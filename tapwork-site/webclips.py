"""Encode the detail captures into the looping clips the product page shows.

vdetail.mjs writes a transparent PNG sequence per scene under capture/vd/<scene>/.
These are not ads: they run approach -> read -> content, so the clip has to end on
the content and give the eye a moment to read it before the loop restarts. Hence
the tail hold; without it the menu appears and vanishes in the same breath.

Square, because the page lays the products out in a grid and a 9:16 clip would
leave two columns of dead space in every card.
"""
import os, subprocess, sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.environ.get('TAPWORK_DETAIL', os.path.join(ROOT, 'capture', 'vd'))
OUT = os.path.join(ROOT, 'webclips')
WORK = os.path.join(ROOT, 'capture', '.workweb')

FPS = 20
SIZE = 1080          # full HD square: sharp on a retina phone and on a desktop
GROUND = (11, 12, 15)  # the page's background, so the clip has no visible edge
HOLD = 0.9           # seconds held on the last frame before the loop restarts


def content_box(frames):
    """The union of every frame's drawn pixels, so the crop never clips motion."""
    box = None
    for f in frames:
        a = Image.open(f).convert('RGBA').getchannel('A').point(lambda v: 255 if v > 8 else 0)
        b = a.getbbox()
        if b is None:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    return box


def square(box, w, h, pad=1.12):
    """Size the crop on the content's height, not its widest dimension.

    The plinth is far wider than it is tall, so squaring on the width leaves the
    product small in the middle of a lot of empty plinth — and the product is the
    whole point of these clips. Squaring on the height fills the frame and lets
    the plinth run off the sides, which reads as framing rather than as a crop.
    Height already covers the camera push-in, since the box is the union of every
    frame, so nothing is ever cut off the top or bottom.
    """
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = min((y1 - y0) * pad / 2, max(w, h) / 2)
    return (round(cx - half), round(cy - half), round(cx + half), round(cy + half))


def build(key):
    src = os.path.join(FRAMES, key)
    frames = [os.path.join(src, f) for f in sorted(os.listdir(src)) if f.endswith('.png')]
    box = square(content_box(frames), *Image.open(frames[0]).size)

    work = os.path.join(WORK, key)
    os.makedirs(work, exist_ok=True)
    for f in os.listdir(work):
        os.remove(os.path.join(work, f))

    n = 0
    for f in frames:
        im = Image.open(f).convert('RGBA').crop(box).resize((SIZE, SIZE), Image.LANCZOS)
        flat = Image.new('RGB', (SIZE, SIZE), GROUND)
        flat.paste(im, (0, 0), im)
        flat.save(os.path.join(work, '%04d.png' % n))
        n += 1
    last = os.path.join(work, '%04d.png' % (n - 1))
    for _ in range(round(FPS * HOLD)):
        Image.open(last).save(os.path.join(work, '%04d.png' % n))
        n += 1

    os.makedirs(OUT, exist_ok=True)
    made = []
    for ext, args in (
        ('mp4', ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                 '-crf', '30', '-preset', 'veryslow', '-movflags', '+faststart']),
        # VP9 first in the page: some browser builds ship without an H.264 decoder.
        ('webm', ['-c:v', 'libvpx-vp9', '-crf', '44', '-b:v', '0', '-row-mt', '1']),
    ):
        p = os.path.join(OUT, '%s.%s' % (key, ext))
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS),
                        '-i', os.path.join(work, '%04d.png'), *args, p], check=True)
        made.append((ext, os.path.getsize(p) // 1024))

    poster = os.path.join(OUT, '%s.jpg' % key)
    Image.open(os.path.join(work, '%04d.png' % (n - 1))).save(poster, quality=82, optimize=True)
    made.append(('jpg', os.path.getsize(poster) // 1024))
    return n, made


# Footage the merchant filmed in a real venue, which no render should stand in for.
# It arrives as a finished video rather than a frame sequence, so it skips the
# compositing above: there is no transparent plinth to lay on the page ground,
# only a trim to the part that shows the tap, a square crop and the same encode
# so it sits in the grid like the rendered clips.
FOOTAGE = {
    # key: (source file, start, end, y offset of the 464-wide square crop)
    'pedidos-whatsapp': ('pedidos-whatsapp-fuente.mp4', 6.0, 12.7, 200),
}


def build_footage(key):
    src, ss, to, y = FOOTAGE[key]
    src = os.path.join(ROOT, 'footage', src)
    os.makedirs(OUT, exist_ok=True)
    vf = 'crop=iw:iw:0:%d,scale=%d:%d:flags=lanczos' % (y, SIZE, SIZE)
    made = []
    for ext, args in (
        ('mp4', ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                 '-crf', '30', '-preset', 'veryslow', '-movflags', '+faststart']),
        ('webm', ['-c:v', 'libvpx-vp9', '-crf', '44', '-b:v', '0', '-row-mt', '1']),
    ):
        path = os.path.join(OUT, '%s.%s' % (key, ext))
        # -an: the card autoplays, and the other eleven are silent.
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss), '-to', str(to),
                        '-i', src, '-vf', vf, '-an', *args, path], check=True)
        made.append((ext, os.path.getsize(path) // 1024))
    poster = os.path.join(OUT, '%s.jpg' % key)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(to - 0.9), '-i', src,
                    '-frames:v', '1', '-vf', vf, '-q:v', '4', poster], check=True)
    made.append(('jpg', os.path.getsize(poster) // 1024))
    return made


if __name__ == '__main__':
    keys = sys.argv[1:] or sorted(os.listdir(FRAMES)) + sorted(FOOTAGE)
    for k in keys:
        if k in FOOTAGE:
            made = build_footage(k)
            print('%-17s filmado    %s' % (k, ' · '.join('%s %dKB' % m for m in made)))
        else:
            n, made = build(k)
            print('%-17s %3d frames  %s' % (k, n, ' · '.join('%s %dKB' % m for m in made)))
