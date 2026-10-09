import cv2, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

W, H, FLOOR = 1080, 1350, 1075

def expand(q, f):
    q = np.float32(q); c = q.mean(0); return c + (q - c) * f

def flatten(src, quad, w, h, f=1.02):
    im = cv2.imread(src)
    M = cv2.getPerspectiveTransform(expand(quad, f), np.float32([[0, 0], [w, 0], [w, h], [0, h]]))
    out = cv2.warpPerspective(im, M, (w, h), flags=cv2.INTER_CUBIC)
    return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))

def rounded(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, fill=255)
    im = im.convert('RGBA'); im.putalpha(m); return im

def levels(im, lo=2, hi=98.5, target=246):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    l = np.percentile(a, lo); h = np.percentile(a, hi)
    a = (a - l) / max(1, h - l) * (target - 8) + 8
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if im.mode == 'RGBA': out.putalpha(im.getchannel('A'))
    return out

def tilt(im, k):
    """Turn the piece a little around its vertical axis: the far edge shrinks."""
    w, h = im.size
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    d = h * k
    dst = np.float32([[0, 0], [w * (1 - abs(k) * .35), d], [w * (1 - abs(k) * .35), h - d], [0, h]])
    M = cv2.getPerspectiveTransform(src, dst)
    a = cv2.warpPerspective(np.asarray(im), M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    return Image.fromarray(a, 'RGBA')

def studio(glow=(236, 48, 19)):
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    top = np.array([31, 34, 41]); bot = np.array([10, 11, 14])
    base = top * (1 - y[..., None]) + bot * y[..., None]
    base = np.broadcast_to(base, (H, W, 3)).copy()
    # key light behind the product
    d = np.sqrt(((x - .5) * 1.1) ** 2 + ((y - .42) * .9) ** 2)
    base += (np.clip(1 - d / .55, 0, 1) ** 2)[..., None] * np.array([46, 48, 54])
    # floor: a touch lighter, fading to the front
    fl = (y * H > FLOOR).astype(float) * np.clip((y * H - FLOOR) / 300, 0, 1)
    base += fl[..., None] * np.array([6, 6, 7])
    # a brand-red rim glow low on one side
    g = np.sqrt(((x - .1) * 1.4) ** 2 + ((y - .95) * 1.2) ** 2)
    base += (np.clip(1 - g / .5, 0, 1) ** 2)[..., None] * np.array(glow) * .18
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).convert('RGBA')

def place(bg, prod, cx, edge=None):
    """Stand prod on the floor centred at cx, with contact shadow and reflection."""
    x = int(cx - prod.width / 2); y = FLOOR - prod.height
    sh = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sh).ellipse([x + prod.width * .08, FLOOR - 14, x + prod.width * .92, FLOOR + 16], fill=170)
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    bg.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), sh)
    ref = prod.transpose(Image.FLIP_TOP_BOTTOM)
    fade = np.zeros((ref.height, ref.width)); n = min(ref.height, 260)
    fade[:n] = np.linspace(.26, 0, n)[:, None]
    a = np.asarray(ref.getchannel('A')).astype(float) * fade
    ref.putalpha(Image.fromarray(a.astype(np.uint8)))
    ref = ref.filter(ImageFilter.GaussianBlur(2))
    bg.alpha_composite(ref, (x, FLOOR + 2))
    if edge:  # acrylic thickness: a thin lit edge on the near side
        e = Image.new('RGBA', prod.size, (0, 0, 0, 0))
        ImageDraw.Draw(e).rounded_rectangle([0, 0, prod.width - 1, prod.height - 1], edge[1], outline=(255, 255, 255, edge[0]), width=3)
        bg.alpha_composite(e, (x + 5, y - 3))
    bg.alpha_composite(prod, (x, y))
    return bg

def finish(bg, name):
    a = np.asarray(bg.convert('RGB')).astype(np.float32)
    a += np.random.default_rng(1).normal(0, 2.0, a.shape)  # fine grain so gradients don't band
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(name, quality=88, optimize=True, progressive=True)

# --- Reseñas: the acrylic plate, flattened, standing, turned a little ---
plate = flatten('resenas-src.png', [[244, 460], [645, 435], [667, 1052], [267, 1063]], 800, 1200, 1.025)
plate = levels(plate, 1, 99.2, 250)
plate = rounded(plate, 36).resize((600, 900), Image.LANCZOS)
plate = tilt(plate, .045)
finish(place(studio(), plate, W / 2 + 10, edge=(70, 26)), 'resenas.jpg')

# --- Tarjeta: the card, flattened, the thumb and its glare painted out ---
card = flatten('tarjeta-src.png', [[42, 395], [513, 394], [508, 693], [46, 670]], 856, 540, 1.03)
cv = np.asarray(card).copy()
# the thumb and its glare sit along the top-left edge: repaint that strip with
# the card's own matte black, nothing else on the card is touched
hsv = cv2.cvtColor(cv, cv2.COLOR_RGB2HSV)
mask = np.zeros(cv.shape[:2], np.uint8)
strip = hsv[:42, :240, 2] > 62
mask[:42, :240][strip] = 255
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8))
cv = cv2.inpaint(cv, mask, 7, cv2.INPAINT_TELEA)
card = Image.fromarray(cv)
card = ImageEnhance.Contrast(card).enhance(1.06)
card = rounded(card, int(540 * 3.18 / 54)).resize((930, 586), Image.LANCZOS)
card = tilt(card, .05)
finish(place(studio(), card, W / 2), 'tarjeta.jpg')

# --- Menú: the "Carta Digital" insert, flattened, back in a clean acrylic stand ---
ins = flatten('menu-src.png', [[130, 245], [367, 256], [333, 529], [135, 528]], 560, 700, 1.0)
ins = levels(ins, 1, 99.6, 236).resize((600, 750), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2.2, 110, 2))
pw, ph = ins.size; m = 18; foot = 70
stand = Image.new('RGBA', (pw + 2 * m, ph + m + foot), (0, 0, 0, 0))
d = ImageDraw.Draw(stand)
# the acrylic sheet: barely there, a lit rim and a sheen across it
d.rounded_rectangle([0, 0, pw + 2 * m - 1, ph + m], 10, fill=(255, 255, 255, 18), outline=(255, 255, 255, 120), width=2)
stand.alpha_composite(ins.convert('RGBA'), (m, m))
sheen = Image.new('L', stand.size, 0)
ImageDraw.Draw(sheen).polygon([(0, 0), (pw * .55, 0), (pw * .15, ph + m), (0, ph + m)], fill=26)
stand.alpha_composite(Image.merge('RGBA', [Image.new('L', stand.size, 255)] * 3 + [sheen.filter(ImageFilter.GaussianBlur(30))]))
d = ImageDraw.Draw(stand)
d.line([(6, 2), (pw + 2 * m - 6, 2)], fill=(255, 255, 255, 210), width=3)
# the L foot, seen from just above
d.polygon([(0, ph + m), (pw + 2 * m, ph + m), (pw + 2 * m - 26, ph + m + foot), (26, ph + m + foot)], fill=(255, 255, 255, 22))
d.line([(26, ph + m + foot - 1), (pw + 2 * m - 26, ph + m + foot - 1)], fill=(255, 255, 255, 170), width=3)
d.line([(0, ph + m), (26, ph + m + foot)], fill=(255, 255, 255, 90), width=2)
d.line([(pw + 2 * m, ph + m), (pw + 2 * m - 26, ph + m + foot)], fill=(255, 255, 255, 90), width=2)
stand = stand.resize((int(stand.width * 1.08), int(stand.height * 1.08)), Image.LANCZOS)
finish(place(studio(), stand, W / 2), 'menu.jpg')
print('ok')
