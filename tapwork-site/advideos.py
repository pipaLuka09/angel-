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
from PIL import Image, ImageChops, ImageFilter, ImageStat

ROOT = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.environ.get('TAPWORK_FRAMES', os.path.join(ROOT, 'capture', 'vf'))
OUT = os.path.join(ROOT, 'ads')
WORK = os.path.join(ROOT, 'capture', '.work')

FPS = 24
# name -> (width, height, product's share of the width, vertical anchor)
FORMATS = {'reel': (1080, 1920, 0.94, 0.40), 'feed': (1080, 1350, 0.98, 0.40)}
# These scenes were authored as looping web animations, not as vertical ads: each
# has one held moment worth showing and a lot of transitional pan and zoom around
# it. So keep a short, steady window and ping-pong it into a seamless loop that
# still clears the three-second minimum Reels enforces.
WINDOW = 40          # frames of held motion to keep
# Two scenes need the window pinned by hand. Their "NFC detectada" notice is a big
# bright card held on a dark screen, so it scores higher on both size and
# steadiness than the thing it announces -- the contact card, the pet's record --
# and the picker lands on the notice every time. Both hold their payoff from
# roughly frame 36 to 160 of a ten-second capture.
PINNED = {'tarjeta': 48, 'mascotas': 48}
STEADINESS = 2.5     # how hard to prefer a steady window over merely a big one
BACKDROP_LUMA = 15   # mean luminance every clip's backdrop is dimmed to


def _slab_tone(im):
    """The plinth's own luminance: the most common tone among the drawn pixels."""
    lum = im.convert('RGB').convert('L')
    hist = lum.histogram(mask=im.getchannel('A').point(lambda v: 255 if v > 140 else 0))
    return max(range(256), key=lambda i: hist[i]) if any(hist) else 255


def content_box(im, slab=None):
    """Where the product is, as opposed to the slab it stands on.

    Same idea as grade.py -- cropping to the alpha bounds frames the pale plinth
    and leaves the product small, so this keeps only pixels that differ from the
    slab's tone, by brightness or by colour. Done with whole-image PIL ops rather
    than a Python pixel loop, because this now runs on every frame of every clip.
    """
    small = im.resize((im.width // 4, im.height // 4), Image.BILINEAR)
    if slab is None:
        slab = _slab_tone(small)
    rgb = small.convert('RGB')
    r, g, b = rgb.split()
    hi = ImageChops.lighter(ImageChops.lighter(r, g), b)
    lo = ImageChops.darker(ImageChops.darker(r, g), b)
    saturation = ImageChops.subtract(hi, lo)
    deviation = ImageChops.difference(rgb.convert('L'), Image.new('L', small.size, slab))
    signal = ImageChops.lighter(saturation, deviation).point(lambda v: 255 if v > 33 else 0)
    drawn = small.getchannel('A').point(lambda v: 255 if v > 140 else 0)
    mask = ImageChops.multiply(signal, drawn).filter(ImageFilter.MinFilter(3))
    box = mask.getbbox() or small.getbbox() or (0, 0, small.width, small.height)
    return tuple(v * 4 for v in box)


def union(boxes):
    return (min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes))


def square(box, im, pad=1.10):
    """Grow the content box into a square, keeping it inside the source frame."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = min(max(x1 - x0, y1 - y0) * pad / 2, max(im.width, im.height) / 2)
    return (round(cx - half), round(cy - half), round(cx + half), round(cy + half))


def pick_window(frames, length):
    """Choose the stretch of the loop that actually shows the product.

    These scenes pan and zoom, so a fixed slice can open on the piece filling the
    frame and end on it the size of a stamp -- the crop then has to cover both and
    the product is small throughout. This scores every candidate window on how
    large the product is and how little that size moves, and keeps the best one.
    """
    slab = _slab_tone(Image.open(frames[len(frames) // 2]).convert('RGBA'))
    boxes = [content_box(Image.open(f).convert('RGBA'), slab) for f in frames]
    areas = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
    if length >= len(frames):
        return 0, len(frames), union(boxes)
    best, best_score = 0, None
    for i in range(len(frames) - length + 1):
        w = areas[i:i + length]
        mean = sum(w) / len(w)
        var = sum((a - mean) ** 2 for a in w) / len(w)
        score = mean - STEADINESS * (var ** 0.5)     # big, and above all steady
        if best_score is None or score > best_score:
            best, best_score = i, score
    return best, best + length, union(boxes[best:best + length])


def encode(key, fmt, frames, crop, still):
    w, h, fill, anchor = FORMATS[fmt]
    stage = os.path.join(WORK, '%s_%s' % (key, fmt))
    shutil.rmtree(stage, ignore_errors=True)
    os.makedirs(stage)

    bg = still.crop(crop).convert('RGB').resize((w, h), Image.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(w * 0.11))
    # Dim to a fixed darkness rather than by a fixed amount. A scene built around a
    # white slab blurs to a pale field and a fixed blend leaves it grey, so that clip
    # reads lighter than the other ten sitting next to it. Solving the blend for a
    # target mean puts every backdrop at the same depth.
    dark = Image.new('RGB', (w, h), (7, 7, 9))
    mean = ImageStat.Stat(bg.convert('L')).mean[0]
    alpha = (mean - BACKDROP_LUMA) / (mean - 7.7) if mean > 7.7 else 0.72
    bg = Image.blend(bg, dark, min(0.93, max(0.55, alpha)))

    side = round(w * fill)
    x = (w - side) // 2
    y = round((h - side) * anchor)
    # Forward then back: any window of a longer loop ends somewhere other than it
    # started, and a straight cut there reads as a glitch. Ping-pong makes the
    # seam impossible and doubles the run to clear the Reels minimum.
    frames = list(frames) + list(reversed(frames[1:-1]))
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
    # Smaller copies for the launch pack to play inline. Two codecs on purpose:
    # H.264 is what Meta wants for the real upload, but not every browser build
    # ships an H.264 decoder, and a page that leans on it alone renders empty grey
    # boxes there. VP9 covers those; the page offers both and lets the browser pick.
    for codec, ext, args in (
        ('libvpx-vp9', 'webm', ['-b:v', '0', '-crf', '34', '-row-mt', '1']),
        ('libx264', 'mp4', ['-profile:v', 'baseline', '-crf', '28', '-movflags', '+faststart']),
    ):
        subprocess.run([
            'ffmpeg', '-y', '-loglevel', 'error', '-i', out,
            '-vf', 'scale=%d:-2' % (w // 2), '-c:v', codec, '-pix_fmt', 'yuv420p',
            '-preset' if codec == 'libx264' else '-deadline',
            'slow' if codec == 'libx264' else 'good',
            *args, os.path.join(OUT, '%s_%s_preview.%s' % (key, fmt, ext)),
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
        if key in PINNED:
            a = PINNED[key]
            b = a + WINDOW
            slab = _slab_tone(Image.open(frames[a + WINDOW // 2]).convert('RGBA'))
            box = union([content_box(Image.open(f).convert('RGBA'), slab) for f in frames[a:b]])
        else:
            a, b, box = pick_window(frames, WINDOW)
        frames = frames[a:b]
        still = Image.open(frames[len(frames) // 2]).convert('RGBA')
        crop = square(box, still)
        sizes = ' · '.join('%s %dKB' % (f, encode(key, f, frames, crop, still)) for f in FORMATS)
        print('%-11s frames %3d-%-3d  %s' % (key, a, b, sizes))
    shutil.rmtree(WORK, ignore_errors=True)
