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


def stand(path, pw=540, ph=810, m=18, foot=70, k=1.08, sticker=None):
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
    if sticker:  # (png, x mm, y mm, diámetro mm): pegado por fuera, sobre la lámina
        png, sx, sy, sd = sticker
        px = pw / 100
        stk = Image.open(png).convert('RGBA').resize((round(sd * px), round(sd * px)), Image.LANCZOS)
        cx, cy = m + sx * px, m + sy * px
        sh = Image.new('RGBA', st.size, (0, 0, 0, 0))
        sh.paste(Image.new('RGBA', stk.size, (0, 0, 0, 120)), (round(cx - stk.width / 2 + 3), round(cy - stk.height / 2 + 4)), stk)
        st.alpha_composite(sh.filter(ImageFilter.GaussianBlur(4)))
        st.alpha_composite(stk, (round(cx - stk.width / 2), round(cy - stk.height / 2)))
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
# El acrílico reutilizado: el de siempre (solo QR) y el sticker de Tap Work que se le pega.
STICKER = ('pieza-sticker.png', 80, 128, 30)
# FORJA: la foto de Unsplash (ver README) recortada a 4:5 y el sticker de la estación pegado
# en el poste delantero de la máquina, con su inclinación.
GYM_CROP = (0, 150, 1088, 1510)
GYM_STICKER = (557, 624, 41, -6)   # centro en la foto original, ancho en px, giro en grados


def gym():
    im = Image.open('gym-unsplash.jpg').convert('RGB').crop(GYM_CROP).resize((W, H), Image.LANCZOS)
    k = W / (GYM_CROP[2] - GYM_CROP[0])
    cx, cy = (GYM_STICKER[0] - GYM_CROP[0]) * k, (GYM_STICKER[1] - GYM_CROP[1]) * k
    stk = Image.open('pieza-forja.png').convert('RGBA')
    w = round(GYM_STICKER[2] * k); stk = stk.resize((w, round(w * stk.height / stk.width)), Image.LANCZOS)
    # como impreso sobre el acero, con la misma luz baja de la foto
    a = np.asarray(stk).astype(np.float32)
    x = np.linspace(0, 1, stk.width)[None, :, None]
    a[..., :3] = a[..., :3] * (.72 + .18 * x) + 4
    stk = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').filter(ImageFilter.GaussianBlur(.5))
    stk = stk.rotate(GYM_STICKER[3], resample=Image.BICUBIC, expand=True)
    out = im.convert('RGBA'); out.alpha_composite(stk, (round(cx - stk.width / 2), round(cy - stk.height / 2)))
    finish(out, 'gym-fondo.jpg')
    return [cx, cy, GYM_STICKER[2] * k * .75]


if __name__ == '__main__':
    info = {}
    for k in ('pago', 'wifi'):
        st, (ix, iy, iw, ih) = stand(k + '-diseno.png')
        x = int(W / 2 - st.width / 2); y = FLOOR - st.height
        cx, cy, r = TAP[k]
        info[k] = dict(photo='../%s.jpg' % k, tap=[x + ix + cx / 100 * iw, y + iy + cy / 150 * ih, r / 100 * iw],
                       insert=[x + ix, y + iy, iw, ih])
        finish(place(studio(), st, W / 2), '../%s.jpg' % k)
    # acrílico reutilizado: la tienda muestra el "después" (con sticker); la animación parte del "antes"
    st, (ix, iy, iw, ih) = stand('pieza-viejo.png')
    x = int(W / 2 - st.width / 2); y = FLOOR - st.height
    finish(place(studio(), st, W / 2), 'acrilico-antes.jpg')
    finish(place(studio(), stand('pieza-viejo.png', sticker=STICKER)[0], W / 2), '../acrilico.jpg')
    _, sx, sy, sd = STICKER
    info['acrilico'] = dict(photo='acrilico-antes.jpg', ring='236,48,19', delay=1.1,
                            tap=[x + ix + sx / 100 * iw, y + iy + sy / 150 * ih, sd / 2 / 100 * iw],
                            sticker=dict(src='pieza-sticker.png', d=sd / 100 * iw))
    # el menú: la foto real del acrílico "Carta Digital"; el ícono NFC está bajo el QR
    info['menu'] = dict(photo='../menu.jpg', ring='255,255,255', tap=[530, 825, 46])
    info['gym'] = dict(photo='gym-fondo.jpg', ring='236,48,19', phone=.62, tap=gym())
    json.dump(info, open('acrilicos.json', 'w'), indent=1)
    print(json.dumps(info))
