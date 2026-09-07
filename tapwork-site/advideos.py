"""Encode the captured scene frames into the two video formats Meta serves.

vcap.mjs writes a transparent PNG sequence per scene under capture/vf/<scene>/.
This lays each frame on the same backdrop treatment the stills use — the shot's
own colours, blurred and dimmed toward the site's near-black — crops to the
product rather than the plinth, and hands the sequence to ffmpeg.

Two outputs per scene:
  reel  1080x1920  Reels, Stories
  feed  1080x1350  in-feed video

H.264 High profile, yuv420p, faststart: what Instagram and Facebook accept
without re-encoding twice. Silent — Reels autoplay muted and a silent track
avoids a spurious "audio too quiet" flag.
"""
import os, shutil, subprocess, sys
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.environ.get('TAPWORK_FRAMES', os.path.join(ROOT, 'capture', 'vf'))
OUT = os.path.join(ROOT, 'ads')
WORK = os.path.join(ROOT, 'capture', '.work')

FPS = 24
# name -> (width, height, product's share of the width, vertical anchor)
FORMATS = {'reel': (1080, 1920, 0.94, 0.40), 'feed': (1080, 1350, 0.98, 0.40)}


def content_box(im):
    """Where the product is, as opposed to the slab it stands on.

    Same reasoning as grade.py: cropping to the alpha bounds frames the pale
    plinth and leaves the product small, so this looks for pixels that differ
    from the slab's own tone. Measured once on a mid-sequence frame and then
    reused for every frame, otherwise the crop would jitter as things move.
    """
    small = im.resize((im.width // 4, im.height // 4), Image.BILINEAR)
    rgb, alpha, lum = small.convert('RGB'), small.getchannel('A'), small.convert('RGB').convert('L')
    hist = lum.histogram(mask=alpha.point(lambda v: 255 if v > 140 else 0))
    slab = max(range(256), key=lambda i: hist[i]) if any(hist) else 255
    pr, pl, pa = rgb.load(), lum.load(), alpha.load()
    xs, ys = [], []
    for y in range(small.height):
        for x in range(small.width):
            if pa[x, y] < 140:
                continue
            r, g, b = pr[x, y]
            sat = (max(r, g, b) - min(r, g, b)) / 255.0
            if max(abs(pl[x, y] - slab) / 255.0, sat) > 0.13:
                xs.append(x); ys.append(y)
    if len(xs) < 40:
        return im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox() or (0, 0, im.width, im.height)
    xs.sort(); ys.sort()
    lo, hi = int(len(xs) * 0.005), int(len(xs) * 0.995) - 1
    return (xs[lo] * 4, ys[lo] * 4, (xs[hi] + 1) * 4, (ys[hi] + 1) * 4)


def square(box, im, pad=1.16):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = min(max(x1 - x0, y1 - y0) * pad / 2, max(im.width, im.height) / 2)
    return (round(cx - half), round(cy - half), round(cx + half), round(cy + half))


def encode(key, fmt, frames, crop, still):
    w, h, fill, anchor = FORMATS[fmt]
    stage = os.path.join(WORK, '%s_%s' % (key, fmt))
    shutil.rmtree(stage, ignore_errors=True)
    os.makedirs(stage)

    bg = still.crop(crop).convert('RGB').resize((w, h), Image.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(w * 0.11))
    bg = Image.blend(bg, Image.new('RGB', (w, h), (7, 7, 9)), 0.72)

    side = round(w * fill)
    x = (w - side) // 2
    y = round((h - side) * anchor)
    for i, f in enumerate(frames):
        im = Image.open(f).convert('RGBA').crop(crop).resize((side, side), Image.LANCZOS)
        canvas = bg.copy()
        canvas.paste(im, (x, y), im)
        canvas.save(os.path.join(stage, '%04d.jpg' % i), 'JPEG', quality=93, subsampling=0)

    out = os.path.join(OUT, '%s_%s.mp4' % (key, fmt))
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-framerate', str(FPS), '-i', os.path.join(stage, '%04d.jpg'),
        '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
        '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow',
        '-movflags', '+faststart', '-r', str(FPS), out,
    ], check=True)
    # A small, heavily compressed copy so the launch pack can play every clip
    # inline; the file above is what actually gets posted.
    prev = os.path.join(OUT, '%s_%s_preview.mp4' % (key, fmt))
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error', '-i', out,
        '-vf', 'scale=%d:-2' % (w // 3), '-c:v', 'libx264', '-profile:v', 'baseline',
        '-pix_fmt', 'yuv420p', '-crf', '31', '-preset', 'slow',
        '-movflags', '+faststart', prev,
    ], check=True)

    shutil.rmtree(stage, ignore_errors=True)
    return os.path.getsize(out) // 1024


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(WORK, exist_ok=True)
    keys = sys.argv[1:] or sorted(os.listdir(FRAMES))
    for key in keys:
        d = os.path.join(FRAMES, key)
        frames = sorted(os.path.join(d, f) for f in os.listdir(d) if f.endswith('.png'))
        if len(frames) < 8:
            print('%-11s skipped (%d frames)' % (key, len(frames)))
            continue
        still = Image.open(frames[len(frames) // 2]).convert('RGBA')
        crop = square(content_box(still), still)
        sizes = ' · '.join('%s %dKB' % (f, encode(key, f, frames, crop, still)) for f in FORMATS)
        print('%-11s %3d frames  %s' % (key, len(frames), sizes))
    shutil.rmtree(WORK, ignore_errors=True)
