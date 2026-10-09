"""Build the Tap Work site: a 3D street-level hero, then the products in segments.

The hero is a three.js scene (futuro/scene.js): looking up from the street at
glass towers through a fisheye lens, a Tap Work card held out to the camera.
Scrolling brings the card closer, turns it to show its chip and turns the
afternoon into night, which is where the rest of the page lives.

The nine product reels (reels/, see reels/README.md) ride one 3D carousel with
a tab per kind of business, so only one plays at a time and none are stacked.

    python3 buildsitio.py   # futuro/ + reels/v/ -> sitio/ (drag into Netlify Drop)

sitio/preview.html is the same page without the <html> shell, for the claude.ai
preview, which supplies its own.
"""
import io, os, shutil

import buildsimple as cat

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
SRC = os.path.join(ROOT, 'futuro')
OUT = os.path.join(ROOT, 'sitio')
REELS = os.path.join(ROOT, 'reels', 'v')
FONTS = os.path.join(ROOT, 'reels', 'fonts')

REEL = {'pagos': 'pago', 'gimnasios': 'gym'}

# Kinds of business, in the order the tabs read. Each product sits in the one
# its catalogue client line names.
SEGMENTS = [
    ('restaurantes', 'Restaurantes', 'Restaurantes y cafeterías', ['menu', 'pagos', 'wifi', 'acrilico']),
    ('local', 'Cualquier local', 'Cualquier negocio', ['resenas', 'tarjeta']),
    ('personal', 'Equipos con turnos', 'Negocios con personal', ['asistencia']),
    ('gimnasios', 'Gimnasios', 'Gimnasios y estudios', ['gimnasios']),
    ('mascotas', 'Mascotas', 'Dueños de mascotas', ['mascotas']),
]

LINE = {
    'menu': 'Cambias un precio desde tu celular y ya se ve en todas las mesas.',
    'resenas': 'Tu cliente deja la reseña en Google en diez segundos, cuando la experiencia fue buena.',
    'tarjeta': 'Tu contacto se guarda con un toque. Sin dictar tu número ni imprimir tarjetas.',
    'asistencia': 'Tu equipo marca con su gafete y tú exportas la lista a Excel en un clic.',
    'wifi': 'Se conecta solo. Nadie le pide la clave al mesero.',
    'pagos': 'Paga y deja la propina desde su celular, sin esperar la cuenta.',
    'gimnasios': 'Cada serie queda registrada en la máquina, sin papel ni app.',
    'mascotas': 'Quien la encuentre ve sus vacunas, sus alergias y cómo avisarte.',
    'acrilico': 'Le pegamos el chip al acrílico que ya tienes. No se bota nada.',
}

HOW = [
    ('Acercas el celular', 'A dos centímetros basta. No hay que abrir la cámara ni enfocar un QR.'),
    ('Se abre solo', 'El chip guarda un enlace y el celular lo abre en el navegador.'),
    ('Lo cambias cuando quieras', 'El objeto se queda igual. Lo que abre lo actualizas tú, sin volver a imprimir.'),
]


def svg(path, size=18, fill=False):
    style = ('fill="currentColor"' if fill else
             'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"')
    return ('<svg viewBox="0 0 24 24" width="%d" height="%d" aria-hidden="true" %s><path d="%s"/></svg>'
            % (size, size, style, path))


ARROW = svg('M5 12h14M13 6l6 6-6 6', 16)
LEFT = svg('M15 5l-7 7 7 7')
RIGHT = svg('M9 5l7 7-7 7')
PAUSE = svg('M8 5v14M16 5v14', 14)


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def build():
    byid = {p['id']: p for p in cat.products()}
    order = [(seg, pid) for seg in SEGMENTS for pid in seg[3]]
    assert sorted(pid for _, pid in order) == sorted(byid), 'un producto quedó sin segmento'
    n = len(order)

    slides = []
    for i, ((sid, _, sname, _), pid) in enumerate(order):
        p = byid[pid]
        v = REEL.get(pid, p['img'])
        name = cat.sentence(p['label'])
        client = p['client'][0].upper() + p['client'][1:]
        slides.append(
            '          <div class="slide" data-seg="{sid}" data-seg-name="{sname}" data-code="{code}" data-name="{name}"\n'
            '            data-kind="{kind}" data-line="{line}" data-cta="{cta}" data-wa="{wa}"\n'
            '            aria-roledescription="diapositiva" aria-label="{i} de {n}: {name}">\n'
            '            <video muted playsinline preload="{pre}" poster="v/{v}.jpg" width="720" height="1280"><source src="v/{v}.mp4" type="video/mp4"></video>\n'
            '          </div>'.format(
                sid=sid, sname=esc(sname), code=esc(p['code'].upper()), name=esc(name),
                kind=esc('%s · %s' % (cat.sentence(p['kind']), client)), line=esc(LINE[pid]),
                cta=esc(cat.sentence(p['cta'])), wa=esc(cat.wa_link('Hola, ' + p['cta'])),
                i=i + 1, n=n, pre='metadata' if i == 0 else 'none', v=v))
    segs = '\n'.join(
        '        <button type="button" role="tab" data-seg="%s" aria-selected="false">%s <small>%d</small></button>'
        % (sid, label, len(ids)) for sid, label, _, ids in SEGMENTS)
    steps = '\n'.join(
        '        <li class="step rv"><span class="step__n">0%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, d)
        for i, (t, d) in enumerate(HOW))

    page = io.open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    for k, val in dict(
            mark=cat.MARK, wa=cat.WA_ICON, phone=cat.PHONE, arrow=ARROW, left=LEFT, right=RIGHT, pause=PAUSE,
            walink=esc(cat.wa_link('Hola, quiero cotizar productos NFC de Tap Work')),
            walink_asis=esc(cat.wa_link('Hola, quiero control de asistencia con Tap Work')),
            steps=steps, segs=segs, slides='\n'.join(slides), n=str(n)).items():
        page = page.replace('{{%s}}' % k, val)
    assert '{{' not in page, 'placeholder sin reemplazar'

    head, body = page.split('<!--/head-->')
    doc = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           '<meta name="description" content="Chips NFC para tu negocio en Machala: menú digital, reseñas de '
           'Google, asistencia, Wi-Fi, pagos y más. Mira cómo funciona cada uno.">\n'
           '<meta name="theme-color" content="#05060a">\n'
           '<link rel="icon" href="data:image/svg+xml,%s">\n'
           '<link rel="preload" href="fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>\n'
           '%s</head>\n<body>\n%s</body>\n</html>\n' % (FAVICON, head, body))

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    for d in ('v', 'js', 'fonts'):
        os.makedirs(os.path.join(OUT, d))
    io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(doc)
    io.open(os.path.join(OUT, 'preview.html'), 'w', encoding='utf-8').write(page)

    shutil.copy(os.path.join(SRC, 'app.js'), os.path.join(OUT, 'js', 'app.js'))
    shutil.copy(os.path.join(SRC, 'scene.js'), os.path.join(OUT, 'js', 'scene.js'))
    shutil.copy(os.path.join(SRC, 'three.min.js'), os.path.join(OUT, 'js', 'three.min.js'))
    shutil.copy(os.path.join(REPO, 'assets', 'lenis.min.js'), os.path.join(OUT, 'js', 'lenis.min.js'))
    for f in ('hero-poster.jpg', 'hero-poster-m.jpg', 'panel.jpg'):
        shutil.copy(os.path.join(SRC, f), os.path.join(OUT, 'v', f))
    for f in os.listdir(FONTS):
        shutil.copy(os.path.join(FONTS, f), os.path.join(OUT, 'fonts', f))
    missing = []
    for _, pid in order:
        v = REEL.get(pid, byid[pid]['img'])
        for ext in ('mp4', 'jpg'):
            s = os.path.join(REELS, '%s.%s' % (v, ext))
            if os.path.exists(s):
                shutil.copy(s, os.path.join(OUT, 'v'))
            else:
                missing.append(os.path.basename(s))
    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs)
    print('sitio/ %d KB · index.html %d KB · %d productos en %d segmentos'
          % (total // 1024, len(doc) // 1024, n, len(SEGMENTS)))
    if missing:
        print('FALTAN:', ', '.join(missing))


FAVICON = ('%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E'
           '%3Crect width=%27100%27 height=%27100%27 rx=%2722%27 fill=%27%2305060a%27/%3E'
           '%3Crect x=%2715%27 y=%2726%27 width=%2748%27 height=%2713.5%27 fill=%27%23eef1f5%27/%3E'
           '%3Crect x=%2732.2%27 y=%2726%27 width=%2713.6%27 height=%2745%27 fill=%27%23eef1f5%27/%3E'
           '%3Crect x=%2715%27 y=%2779%27 width=%2770%27 height=%277.5%27 rx=%273.75%27 fill=%27%23ec3013%27/%3E'
           '%3C/svg%3E')

if __name__ == '__main__':
    build()
