"""Derive the ad formats Meta serves from the square product stills.

img1080/ holds 1:1 crops, which only cover the feed. Reels and Stories are 9:16
and the best-performing feed placement is 4:5, so each still is re-laid on a
taller canvas that continues its own backdrop instead of being letterboxed or
cropped into the product. No text is burned in: ad copy lives in the post body,
and Meta penalises image-heavy text.
"""
import os
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'img1080')
OUT = os.path.join(ROOT, 'ads')

# name -> (width, height, how much of the width the product should occupy)
FORMATS = {'feed_4x5': (1080, 1350, 0.98), 'story_9x16': (1080, 1920, 0.94)}

KEYS = ['menu', 'resenas', 'dober', 'tarjeta', 'llavero', 'asistencia',
        'wifi', 'pago', 'gym', 'mascotas', 'sticker', 'acrilico']


def backdrop(w, h, src):
    """Continue the still's own backdrop upward rather than padding with flat black.

    A heavy blur of the source, stretched to the taller canvas, keeps each piece's
    colour cast (the warm wood of the menu shot, the magenta of the payment one)
    so the extension reads as more of the same room.
    """
    base = src.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(w * 0.11))
    dim = Image.new('RGB', (w, h), (7, 7, 9))
    return Image.blend(base, dim, 0.72)


def build(key):
    src = Image.open(os.path.join(SRC, key + '.webp')).convert('RGB')
    made = []
    for name, (w, h, fill) in FORMATS.items():
        canvas = backdrop(w, h, src)
        side = round(w * fill)
        piece = src.resize((side, side), Image.LANCZOS)
        # Sit the product above centre: the lower third of a 9:16 is covered by
        # the caption, profile row and CTA sticker in feed and Stories alike.
        x = (w - side) // 2
        y = round((h - side) * 0.40)
        canvas.paste(piece, (x, y))
        path = os.path.join(OUT, '%s_%s.jpg' % (key, name))
        canvas.save(path, 'JPEG', quality=90, subsampling=0)
        made.append((name, os.path.getsize(path) // 1024))
    return made


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for k in KEYS:
        info = ' · '.join('%s %dKB' % m for m in build(k))
        print('%-11s %s' % (k, info))
