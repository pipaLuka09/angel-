"""Fotos de estudio de los acrílicos de pago (Deuna) y Wi-Fi.

Toman el diseño impreso (pago-diseno.png, wifi-diseno.png: el arte final de
10 x 15 cm sin el sangrado) y lo meten en el mismo soporte de acrílico en L
que la foto del menú, sobre el mismo fondo de estudio. Además de ../pago.jpg y
../wifi.jpg guardan en acrilicos.json dónde quedó el círculo "toca aquí", para
que la animación del celular (toque.html) sepa dónde tocar.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from estudio import W, H, FLOOR, studio, place, finish


def printed(path, w, h):
    """El arte como se ve impreso detrás del acrílico: un poco menos de contraste,
    la luz cae de izquierda a derecha y de arriba abajo."""
    im = Image.open(path).convert('RGB').resize((w, h), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(.94)
    a = np.asarray(im).astype(np.float32)
    x = np.linspace(0, 1, w)[None, :, None]; y = np.linspace(0, 1, h)[:, None, None]
    light = 1.03 - .08 * x - .05 * y
    a = a * light
    a = a * .97 + 6
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def stand(path, pw=540, ph=810, m=18, foot=70, k=1.08):
    ins = printed(path, pw, ph)
    st = Image.new('RGBA', (pw + 2 * m, ph + m + foot), (0, 0, 0, 0))
    d = ImageDraw.Draw(st)
    d.rounded_rectangle([0, 0, pw + 2 * m - 1, ph + m], 10, fill=(255, 255, 255, 18), outline=(255, 255, 255, 120), width=2)
    st.alpha_composite(ins.convert('RGBA'), (m, m))
    sheen = Image.new('L', st.size, 0)
    ImageDraw.Draw(sheen).polygon([(0, 0), (pw * .55, 0), (pw * .15, ph + m), (0, ph + m)], fill=30)
    st.alpha_composite(Image.merge('RGBA', [Image.new('L', st.size, 255)] * 3 + [sheen.filter(ImageFilter.GaussianBlur(30))]))
    # un segundo brillo fino, como el reflejo de una ventana en la lámina
    glint = Image.new('L', st.size, 0)
    ImageDraw.Draw(glint).polygon([(pw * .78, 0), (pw * .86, 0), (pw * .52, ph + m), (pw * .44, ph + m)], fill=16)
    st.alpha_composite(Image.merge('RGBA', [Image.new('L', st.size, 255)] * 3 + [glint.filter(ImageFilter.GaussianBlur(12))]))
    d = ImageDraw.Draw(st)
    d.line([(6, 2), (pw + 2 * m - 6, 2)], fill=(255, 255, 255, 210), width=3)
    d.polygon([(0, ph + m), (pw + 2 * m, ph + m), (pw + 2 * m - 26, ph + m + foot), (26, ph + m + foot)], fill=(255, 255, 255, 22))
    d.line([(26, ph + m + foot - 1), (pw + 2 * m - 26, ph + m + foot - 1)], fill=(255, 255, 255, 170), width=3)
    d.line([(0, ph + m), (26, ph + m + foot)], fill=(255, 255, 255, 90), width=2)
    d.line([(pw + 2 * m, ph + m), (pw + 2 * m - 26, ph + m + foot)], fill=(255, 255, 255, 90), width=2)
    st = st.resize((int(st.width * k), int(st.height * k)), Image.LANCZOS)
    # el inserto dentro del soporte ya escalado: x, y, ancho, alto
    return st, (m * k, m * k, pw * k, ph * k)


# Dónde está el círculo "toca aquí" en cada diseño, en mm sobre los 100 x 150 del arte.
TAP = {'pago': (20, 61, 16.2), 'wifi': (21, 80, 14)}

if __name__ == '__main__':
    info = {}
    for k in ('pago', 'wifi'):
        st, (ix, iy, iw, ih) = stand(k + '-diseno.png')
        x = int(W / 2 - st.width / 2); y = FLOOR - st.height
        cx, cy, r = TAP[k]
        info[k] = dict(tap=[x + ix + cx / 100 * iw, y + iy + cy / 150 * ih, r / 100 * iw],
                       insert=[x + ix, y + iy, iw, ih])
        finish(place(studio(), st, W / 2), '../%s.jpg' % k)
    json.dump(info, open('acrilicos.json', 'w'), indent=1)
    print(info)
