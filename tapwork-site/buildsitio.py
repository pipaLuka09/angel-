"""Build the Tap Work site: two pages over one moving sky.

One clip sits behind the whole site. The home page shows it full in the hero
and pushes into its sky as the visitor scrolls; the asistencia page sits on
that sky from the start. Sections are frosted-glass panels over it.

  index.html       hero, how it works, the nine product reels in a carousel
                   with a tab per kind of business, a button to the asistencia
                   page, and the real card at the close (tap it to turn it).
  asistencia.html  the full attendance offer: the panel on desktop and phone,
                   the promo, how it works, what it includes.

The background clip is passed in (--fondo clip.mp4, with clip.jpg next to it
as its poster); without one the background is a still. No prices anywhere:
quotes go through WhatsApp.

    python3 buildsitio.py [--fondo clip.mp4] [--out carpeta]   # -> sitio/ (Netlify Drop)

sitio/preview.html is the home page without the <html> shell, for the claude.ai
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

DESC = {
    'index.html': 'Chips NFC para tu negocio en Machala: menú digital, reseñas de Google, Wi-Fi, pagos, '
                  'asistencia y más. Mira cómo funciona cada uno.',
    'asistencia.html': 'Control de asistencia con gafete NFC: tu equipo marca en el celular del local y tú ves '
                       'el turno en un panel y exportas a Excel.',
}

# The asistencia page. Only what the system really does: it marks from the
# venue's own phone (one or several), and it keeps the time and the badge,
# no photo and no location.
ASIS_HOW = [
    ('Te entregamos los gafetes', 'Uno por persona, y dejamos el panel listo en el celular del local.'),
    ('Tu equipo marca', 'Al llegar y al salir, cada uno acerca su gafete al celular del local.'),
    ('Tú revisas el turno', 'Ves quién llegó, quién se atrasó y exportas el reporte a Excel.'),
]
ASIS_FEATS = [
    ('Quién llegó y a qué hora', 'Cada marcación aparece en el panel en el momento.'),
    ('Atrasos y ausencias', 'El resumen del turno te dice quién se atrasó y quién faltó.'),
    ('Horas trabajadas', 'Suma las horas de cada persona y de todo el día.'),
    ('Reporte a Excel', 'Exportas la lista completa en un clic.'),
    ('Varios locales', 'Cada local marca en su propio celular, todo en una cuenta.'),
    ('Sin app para tu equipo', 'Solo acercan el gafete. No instalan nada.'),
    ('Solo en el local', 'Se marca únicamente en el celular del local.'),
    ('Sin foto ni ubicación', 'Guarda la hora y el gafete, nada más.'),
    ('Lo instalamos nosotros', 'Te lo dejamos funcionando en tu local.'),
]

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
CHECK = svg('M5 12.5l4.5 4.5L19 7', 18)
BADGE = svg('M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM10 3v3h4V3M9 17h6M12 9.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', 26)


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def build(out=OUT, fondo=None):
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
        '          <li class="step"><span class="step__n">0%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, d)
        for i, (t, d) in enumerate(HOW))

    asis_steps = '\n'.join(
        '          <li class="step"><span class="step__n">0%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, d)
        for i, (t, d) in enumerate(ASIS_HOW))
    asis_feats = '\n'.join(
        '        <li>%s<span><b>%s</b>%s</span></li>' % (CHECK, t, d) for t, d in ASIS_FEATS)

    # The background: a clip if one was given (its poster sits next to it as
    # .jpg), otherwise a still of the 3D street.
    if fondo:
        media = ('<video autoplay muted loop playsinline preload="auto" poster="v/fondo.jpg">'
                 '<source src="v/fondo.mp4" type="video/mp4"></video>')
    else:
        media = '<img src="v/hero-poster.jpg" alt="">'
    bg = '<div class="bg" aria-hidden="true">%s</div>' % media
    fill = dict(
        mark=cat.MARK, wa=cat.WA_ICON, phone=cat.PHONE, arrow=ARROW, left=LEFT, right=RIGHT, pause=PAUSE,
        leftsm=svg('M19 12H5M11 6l-6 6 6 6', 16), badge=BADGE,
        walink=esc(cat.wa_link('Hola, quiero cotizar productos NFC de Tap Work')),
        walink_asis=esc(cat.wa_link('Hola, quiero una demostración del control de asistencia de Tap Work')),
        steps=steps, segs=segs, slides='\n'.join(slides), n=str(n), bg=bg,
        bg_sky=bg.replace('class="bg"', 'class="bg bg--sky"'), asis_steps=asis_steps, asis_feats=asis_feats)

    def render(name):
        page = io.open(os.path.join(SRC, name), encoding='utf-8').read()
        for k, val in fill.items():
            page = page.replace('{{%s}}' % k, val)
        assert '{{' not in page, 'placeholder sin reemplazar en ' + name
        head, body = page.split('<!--/head-->')
        doc = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
               '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
               '<meta name="description" content="%s">\n'
               '<meta name="theme-color" content="#0e4fb8">\n'
               '<link rel="icon" href="data:image/svg+xml,%s">\n'
               '<link rel="preload" href="fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>\n'
               '%s</head>\n<body>\n%s</body>\n</html>\n' % (DESC[name], FAVICON, head, body))
        return page, doc

    if os.path.isdir(out):
        shutil.rmtree(out)
    for d in ('v', 'js', 'fonts', 'css'):
        os.makedirs(os.path.join(out, d))
    home, home_doc = render('index.html')
    _, asis_doc = render('asistencia.html')
    io.open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(home_doc)
    io.open(os.path.join(out, 'asistencia.html'), 'w', encoding='utf-8').write(asis_doc)
    io.open(os.path.join(out, 'preview.html'), 'w', encoding='utf-8').write(home)

    shutil.copy(os.path.join(SRC, 'site.css'), os.path.join(out, 'css', 'site.css'))
    shutil.copy(os.path.join(SRC, 'app.js'), os.path.join(out, 'js', 'app.js'))
    shutil.copy(os.path.join(REPO, 'assets', 'lenis.min.js'), os.path.join(out, 'js', 'lenis.min.js'))
    for f in ('hero-poster.jpg', 'panel.jpg', 'panel-movil.jpg', 'card-front.jpg', 'card-back.jpg'):
        shutil.copy(os.path.join(SRC, f), os.path.join(out, 'v', f))
    if fondo:
        base = os.path.splitext(fondo)[0]
        shutil.copy(base + '.mp4', os.path.join(out, 'v', 'fondo.mp4'))
        shutil.copy(base + '.jpg', os.path.join(out, 'v', 'fondo.jpg'))
    for f in os.listdir(FONTS):
        shutil.copy(os.path.join(FONTS, f), os.path.join(out, 'fonts', f))
    missing = []
    for v in sorted({REEL.get(pid, byid[pid]['img']) for _, pid in order} | {'asistencia'}):
        for ext in ('mp4', 'jpg'):
            src = os.path.join(REELS, '%s.%s' % (v, ext))
            if os.path.exists(src):
                shutil.copy(src, os.path.join(out, 'v'))
            else:
                missing.append(os.path.basename(src))
    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(out) for f in fs)
    print('%s/ %d KB · 2 páginas · %d productos en %d segmentos · fondo: %s'
          % (os.path.basename(out), total // 1024, n, len(SEGMENTS), fondo or 'imagen fija'))
    if missing:
        print('FALTAN:', ', '.join(missing))


FAVICON = ('%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E'
           '%3Crect width=%27100%27 height=%27100%27 rx=%2722%27 fill=%27%2305060a%27/%3E'
           '%3Crect x=%2715%27 y=%2726%27 width=%2748%27 height=%2713.5%27 fill=%27%23eef1f5%27/%3E'
           '%3Crect x=%2732.2%27 y=%2726%27 width=%2713.6%27 height=%2745%27 fill=%27%23eef1f5%27/%3E'
           '%3Crect x=%2715%27 y=%2779%27 width=%2770%27 height=%277.5%27 rx=%273.75%27 fill=%27%23ec3013%27/%3E'
           '%3C/svg%3E')

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('--fondo', help='video de fondo (.mp4, con su póster .jpg al lado)')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()
    build(a.out, a.fondo)
