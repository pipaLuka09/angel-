"""Turn the raw scene captures into the square 1080 stills the site uses.

Two families come out of the capture pass and they need different handling:

  * the seven WebGL scenes render on a transparent canvas, so the product arrives
    as a cutout floating in a large empty box. Those get cropped to the part that
    actually reads as product, re-framed to a constant share of the canvas, and
    laid on the site's near-black backdrop.
  * the three CSS scenes (tarjeta, llavero, mascotas) are full-bleed compositions
    that already carry their own background. Those only get squared off.

Exposure is then pulled toward the set's median so ten scenes lit independently
read as one shoot, without flattening the ones that are meant to be dark.
"""
import os, sys
from PIL import Image, ImageFilter, ImageStat

# Where capture_hires.mjs drops the raw transparent PNGs. Override with TAPWORK_HIRES
# when the capture harness lives somewhere other than ./capture/hires.
HIRES = os.environ.get('TAPWORK_HIRES',
                       os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capture', 'hires'))
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'img1080')

SIZE = 1080
FILL = 0.94          # longest side of the cutout as a share of the canvas
PULL = 0.40          # how hard each shot is pulled toward the set's median exposure
GAIN_MIN, GAIN_MAX = 0.84, 1.26

CUTOUT = ['menu', 'resenas', 'asistencia', 'wifi', 'gym', 'pago', 'sticker', 'acrilico']
FULLBLEED = ['tarjeta', 'llavero', 'mascotas']
KEYS = CUTOUT + FULLBLEED


def backdrop():
    """Near-black with a soft radial lift, matching the site's product frame."""
    bg = Image.new('RGB', (SIZE, SIZE), (7, 7, 9))
    px = bg.load()
    cx = cy = SIZE / 2
    r = SIZE * 0.62
    for y in range(SIZE):
        for x in range(SIZE):
            d = (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / r
            k = max(0.0, 1.0 - d) ** 2
            v = int(19 * k)
            px[x, y] = (7 + v, 7 + v, 9 + v)
    return bg


def subject_mean(im):
    """Mean luminance of the pixels that actually belong to the product."""
    lum = im.convert('RGB').convert('L')
    mask = im.getchannel('A').point(lambda v: 255 if v > 140 else 0) if im.mode == 'RGBA' else None
    stat = ImageStat.Stat(lum, mask=mask)
    return stat.mean[0] if stat.count[0] else 128.0


def content_box(im):
    """Where the product is, as opposed to the plinth it is standing on.

    Every one of these scenes puts the piece on a big pale slab. Cropping to the
    alpha bounds therefore frames the slab and leaves the product tiny. This looks
    instead for pixels that differ from the slab's own tone — anything coloured,
    dark or bright — and returns their bounds, so the crop lands on the product.
    """
    small = im.resize((im.width // 4, im.height // 4), Image.BILINEAR)
    rgb = small.convert('RGB')
    alpha = small.getchannel('A') if small.mode == 'RGBA' else Image.new('L', small.size, 255)
    lum = rgb.convert('L')

    hist = lum.histogram(mask=alpha.point(lambda v: 255 if v > 140 else 0))
    slab = max(range(256), key=lambda i: hist[i]) if any(hist) else 255

    w, h = small.size
    px_rgb, px_l, px_a = rgb.load(), lum.load(), alpha.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if px_a[x, y] < 140:
                continue
            r, g, b = px_rgb[x, y]
            sat = (max(r, g, b) - min(r, g, b)) / 255.0
            if max(abs(px_l[x, y] - slab) / 255.0, sat) > 0.13:
                xs.append(x); ys.append(y)
    if len(xs) < 40:
        return im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox() if im.mode == 'RGBA' else (0, 0, im.width, im.height)

    xs.sort(); ys.sort()
    lo = int(len(xs) * 0.005); hi = int(len(xs) * 0.995) - 1
    return (xs[lo] * 4, ys[lo] * 4, (xs[hi] + 1) * 4, (ys[hi] + 1) * 4)


def square_from(box, im, pad):
    """Grow the content box into a square, keeping it inside the source."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = max(x1 - x0, y1 - y0) * pad / 2
    half = min(half, max(im.width, im.height) / 2)
    return (round(cx - half), round(cy - half), round(cx + half), round(cy + half))


def load(key):
    im = Image.open(os.path.join(HIRES, key + '.png'))
    return im.convert('RGBA') if im.mode != 'RGBA' else im


def grade(key, im, target, bg):
    # A partial pull, not a hard match: some scenes are legitimately dark (a black
    # keychain) and others legitimately bright (a white acrylic on a white table).
    # Full normalisation would erase that; this only reins in the outliers.
    mean = subject_mean(im)
    gain = min(GAIN_MAX, max(GAIN_MIN, (target / max(mean, 1.0)) ** PULL))
    rgb = im.convert('RGB').point(lambda v: min(255, int(v * gain)))
    im = Image.merge('RGBA', (*rgb.split(), im.getchannel('A')))

    if key in FULLBLEED:
        # Already a finished composition — just square it off around its centre.
        s = min(im.width, im.height)
        x0 = (im.width - s) // 2
        # Bottom-anchored: the studio sweep puts the red edge line on the very last
        # row, and that line is the motif tying these to the rendered scenes.
        y0 = im.height - s
        frame = im.crop((x0, y0, x0 + s, y0 + s)).convert('RGB').resize(
            (SIZE, SIZE), Image.LANCZOS)
    else:
        im = im.crop(square_from(content_box(im), im, 1.16))
        scale = (SIZE * FILL) / max(im.width, im.height)
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                       Image.LANCZOS)
        frame = bg.copy()
        x0, y0 = (SIZE - im.width) // 2, (SIZE - im.height) // 2
        # A dropped, blurred silhouette grounds the product against the flat backdrop.
        glow = Image.new('L', (SIZE, SIZE), 0)
        glow.paste(im.getchannel('A'), (x0, y0 + int(SIZE * 0.02)))
        glow = glow.filter(ImageFilter.GaussianBlur(SIZE * 0.045)).point(lambda v: int(v * 0.42))
        frame.paste(Image.new('RGB', (SIZE, SIZE), (0, 0, 0)), (0, 0), glow)
        frame.paste(im, (x0, y0), im)

    out = os.path.join(OUT, key + '.webp')
    frame.save(out, 'WEBP', quality=88, method=6)
    return mean, round(gain, 3), os.path.getsize(out) // 1024


if __name__ == '__main__':
    keys = sys.argv[1:] or KEYS
    shots = {k: load(k) for k in keys}
    means = sorted(subject_mean(v) for v in shots.values())
    mid = len(means) // 2
    target = means[mid] if len(means) % 2 else (means[mid - 1] + means[mid]) / 2
    print('median exposure target: %.1f' % target)
    bg = backdrop()
    for k in keys:
        mean, gain, kb = grade(k, shots[k], target, bg)
        print('%-11s mean %5.1f  gain %-5s  %3d KB' % (k, mean, gain, kb))
