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
import io, json, os, shutil, sys

import buildsimple as cat

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'print'))
import monograma  # noqa: E402  the TP monogram, rebuilt as vector from the real card

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
SRC = os.path.join(ROOT, 'futuro')
OUT = os.path.join(ROOT, 'sitio')
REELS = os.path.join(ROOT, 'reels', 'v')
STILLS = os.path.join(ROOT, 'img1080')
PHOTOS = os.path.join(ROOT, 'fotos')
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

PAGES = ['index.html', 'asistencia.html', 'gimnasio.html', 'productos.html']

DESC = {
    'gimnasio.html': 'Sistema NFC para gimnasios: un lector en cada máquina; tu socio acerca el celular, ve el '
                     'ejercicio y registra su serie al instante, sin app ni papel.',
    'productos.html': 'Todos los productos NFC de Tap Work con sus especificaciones: menú digital, reseñas de '
                      'Google, tarjeta de presentación, Wi-Fi, pagos, gafetes, gimnasios y más.',
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

# The gym page: only what the screen recording of the system shows it doing.
GYM_HOW = [
    ('Un sticker en cada máquina', 'Ponemos el sticker NFC en la máquina, con su número de estación y su ejercicio.'),
    ('Tu socio acerca el celular', 'Se abre esa máquina en el navegador, con lo que hizo la última vez.'),
    ('Registra su serie', 'Peso, repeticiones y cómo se sintió. La próxima vez, lo está esperando.'),
]
GYM_FEATS = [
    ('Registro de series', 'El peso con + y −, las repeticiones y cómo se sintió.'),
    ('Su última vez', 'Ve lo que hizo la vez pasada y el historial de sus sesiones.'),
    ('Cómo se hace', 'Las claves de la técnica y los errores comunes de cada máquina.'),
    ('Su progreso', 'Peso máximo por sesión, su récord, cuánto mejoró y cuántas sesiones lleva.'),
    ('Metas', 'Se pone un peso objetivo y una fecha, y ve cuántos kilos le faltan.'),
    ('Todo el gimnasio', 'Sus ejercicios y todas las máquinas, ordenadas por grupo muscular.'),
]

# Products still being built: they show, but say so instead of taking orders.
SOON = {'mascotas'}

# The shop's spec sheet. Only facts we can stand behind: the format of each
# piece, what it opens, and what NFC itself guarantees. Sizes are given only
# where the format fixes them (an ID-1 card is 85.6 x 54 mm by definition).
COMMON_SPECS = [
    ('Tecnología', 'NFC, 13.56 MHz'),
    ('Cómo se usa', 'Se acerca el celular, a unos 2 cm'),
    ('Compatible con', 'Celulares con NFC: la mayoría de Android y iPhone XS o posterior'),
    ('App', 'No hace falta: se abre en el navegador'),
    ('Contenido', 'Lo cambias cuando quieras, sin reimprimir'),
]
SPECS = {
    'menu': [('Formato', 'Hablador NFC para mesa'), ('Abre', 'Tu menú digital, con platos y precios')],
    'resenas': [('Formato', 'Tarjeta NFC de reseñas'), ('Abre', 'La página para dejar una reseña de tu negocio en Google')],
    'tarjeta': [('Formato', 'Tarjeta NFC, tamaño tarjeta de crédito (85,6 × 54 mm)'),
                ('Abre', 'Tu contacto, que se guarda con un toque, y tu WhatsApp')],
    'asistencia': [('Formato', 'Gafete NFC, uno por persona'),
                   ('Abre', 'La marcación de entrada y salida en el celular del local'),
                   ('Incluye', 'Panel de asistencia con reporte a Excel')],
    'wifi': [('Formato', 'Disco NFC de Wi-Fi'), ('Abre', 'La conexión a tu red de invitados')],
    'pagos': [('Formato', 'Acrílico NFC de pago'), ('Abre', 'Tu enlace de pago y la propina')],
    'gimnasios': [('Formato', 'Lector NFC para cada máquina'),
                  ('Abre', 'El ejercicio de la máquina, sus series y cómo se hace')],
    'mascotas': [('Formato', 'Dije NFC para el collar'),
                 ('Abre', 'La ficha de tu mascota: vacunas, alergias y cómo avisarte')],
    'acrilico': [('Formato', 'Chip NFC que va detrás de tu acrílico actual'),
                 ('Abre', 'Tu menú, tu pago o tu reseña, lo que tú decidas')],
}
# The shop sells products; the systems (attendance, gyms) have their own pages.
NOT_IN_SHOP = {'asistencia', 'gimnasios'}

# Real photos and footage of the product, in fotos/ (4:5). They replace the 3D
# render and the generated reel wherever they exist.
REAL = {
    'menu': {'img': 'menu.jpg', 'reel': 'menu.mp4'},          # the "Carta Digital" acrylic, tapped
    'tarjeta': {'img': 'tarjeta.jpg', 'reel': 'tarjeta.mp4'},  # Tania Sánchez's card, tapped
    'resenas': {'img': 'resenas.jpg', 'reel': 'resenas.mp4'},  # the Google reviews acrylic
    # No footage of these yet: studio shot of the 3D render, sales cut of the 3D tap and screens.
    'pagos': {'img': 'pago.jpg', 'reel': 'pago.mp4'},
    'wifi': {'img': 'wifi.jpg', 'reel': 'wifi.mp4'},
}

# Products with a page of their own.
PAGE_OF = {'asistencia': 'asistencia.html', 'gimnasios': 'gimnasio.html'}

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
PLAY = svg('M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z', 22, fill=True)
CHECK = svg('M5 12.5l4.5 4.5L19 7', 18)
DUMBBELL = svg('M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12', 26)
PAW = svg('M12 13.5c-2.8 0-4.8 2.6-4.8 4.4 0 1.5 1.4 2 2.6 1.6.9-.3 1.5-.5 2.2-.5s1.3.2 2.2.5c1.2.4 2.6-.1 2.6-1.6 0-1.8-2-4.4-4.8-4.4z'
          'M5 10.5a1.6 2 0 1 0 3.2 0 1.6 2 0 1 0-3.2 0M15.8 10.5a1.6 2 0 1 0 3.2 0 1.6 2 0 1 0-3.2 0'
          'M8.3 6.5a1.6 2 0 1 0 3.2 0 1.6 2 0 1 0-3.2 0M12.5 6.5a1.6 2 0 1 0 3.2 0 1.6 2 0 1 0-3.2 0', 26)
BAG = svg('M5.5 8h13l-1 12.5h-11L5.5 8zM9 8V6.5a3 3 0 0 1 6 0V8', 26)
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
                cta=esc('Avísame cuando esté listo' if pid in SOON else cat.sentence(p['cta'])),
                wa=esc(cat.wa_link('Hola, me interesa el collar NFC para mascotas, avísenme cuando esté listo'
                                   if pid in SOON else 'Hola, ' + p['cta'])),
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

    gym_steps = '\n'.join(
        '          <li class="step"><span class="step__n">0%d</span><h3>%s</h3><p>%s</p></li>' % (i + 1, t, d)
        for i, (t, d) in enumerate(GYM_HOW))
    gym_feats = '\n'.join(
        '        <li>%s<span><b>%s</b>%s</span></li>' % (CHECK, t, d) for t, d in GYM_FEATS)

    # The shop: one card per product, and the full sheet as JSON for the drawer.
    shop, sheet = [], {}
    shop_order = [(seg, pid) for seg, pid in order if pid not in NOT_IN_SHOP]
    for (sid, label, sname, _), pid in shop_order:
        p = byid[pid]
        v = REEL.get(pid, p['img'])
        name = cat.sentence(p['label'])
        soon = pid in SOON
        real = REAL.get(pid, {})
        photo = 'v/real-' + real['img'] if 'img' in real else 'v/p-%s.webp' % p['img']
        reel = 'v/real-' + real['reel'] if 'reel' in real else 'v/%s.mp4' % v
        sheet[pid] = dict(
            name=name, code=p['code'].upper(), kind=cat.sentence(p['kind']), seg=sname,
            client=p['client'][0].upper() + p['client'][1:], text=cat.sentence(p['benefit']),
            specs=SPECS[pid] + COMMON_SPECS, img=photo, reel=reel,
            poster=photo if 'reel' in real else 'v/%s.jpg' % v, soon=soon, page=PAGE_OF.get(pid, ''),
            cta='Avísame cuando esté listo' if soon else cat.sentence(p['cta']),
            wa=cat.wa_link('Hola, me interesa el collar NFC para mascotas, avísenme cuando esté listo' if soon
                           else 'Hola, ' + p['cta']))
        shop.append(
            '        <article class="item%s" data-seg="%s" data-id="%s">\n'
            '          <button class="item__media" type="button" aria-label="Ver detalles de %s">\n'
            '            <img src="%s" loading="lazy" alt="%s: %s">\n'
            '            <video muted loop playsinline preload="none" aria-hidden="true"><source src="%s" type="video/mp4"></video>\n'
            '            <span class="item__tag mono">%s</span>%s\n'
            '          </button>\n'
            '          <div class="item__body"><h3>%s</h3><p>%s</p>\n'
            '            <button class="item__more" type="button">Ver detalles %s</button></div>\n'
            '        </article>' % (
                ' is-soon' if soon else '', sid, pid, esc(name), photo, esc(name), esc(cat.sentence(p['kind'])),
                reel, esc(p['code'].upper()), ' <span class="item__soon mono">Próximamente</span>' if soon else '',
                esc(name), esc(cat.sentence(p['kind'])), ARROW))
    in_shop = [(sid, label, [i for i in ids if i not in NOT_IN_SHOP]) for sid, label, _, ids in SEGMENTS]
    shop_segs = '\n'.join(
        '        <button type="button" data-seg="%s">%s <small>%d</small></button>' % (sid, label, len(ids))
        for sid, label, ids in in_shop if ids)

    logo = ('<span class="logo"><span class="logo__mark">%s</span><span class="logo__word">TAP <b>WORK</b></span></span>'
            % monograma.svg('#E30613', 'plata-logo', [('0%', '#F4F6F8'), ('46%', '#C3CAD1'), ('100%', '#E6EAED')]))

    # The background: a clip if one was given (its poster sits next to it as
    # .jpg), otherwise a still of the 3D street.
    if fondo:
        media = ('<video autoplay muted loop playsinline preload="auto" poster="v/fondo.jpg">'
                 '<source src="v/fondo.mp4" type="video/mp4"></video>')
    else:
        media = '<img src="v/hero-poster.jpg" alt="">'
    bg = '<div class="bg" aria-hidden="true">%s</div>' % media
    fill = dict(
        logo=logo, dumbbell=DUMBBELL, paw=PAW, bag=BAG, playsm=PLAY,
        gym_steps=gym_steps, gym_feats=gym_feats, shop='\n'.join(shop), shop_segs=shop_segs,
        shop_json=json.dumps(sheet, ensure_ascii=False).replace('</', '<\\/'),
        walink_gym=esc(cat.wa_link('Hola, quiero lectores NFC para mi gimnasio')),
        walink_pet=esc(cat.wa_link('Hola, me interesa el collar NFC para mascotas, avísenme cuando esté listo')),
        mark=cat.MARK, wa=cat.WA_ICON, phone=cat.PHONE, arrow=ARROW, left=LEFT, right=RIGHT, pause=PAUSE,
        leftsm=svg('M19 12H5M11 6l-6 6 6 6', 16), badge=BADGE,
        walink=esc(cat.wa_link('Hola, quiero cotizar productos NFC de Tap Work')),
        walink_asis=esc(cat.wa_link('Hola, quiero una demostración del control de asistencia de Tap Work')),
        steps=steps, segs=segs, slides='\n'.join(slides), n=str(n), shop_n=str(len(shop_order)), bg=bg,
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
    for name in PAGES:
        page, doc = render(name)
        io.open(os.path.join(out, name), 'w', encoding='utf-8').write(doc)
        if name == 'index.html':
            io.open(os.path.join(out, 'preview.html'), 'w', encoding='utf-8').write(page)

    shutil.copy(os.path.join(SRC, 'site.css'), os.path.join(out, 'css', 'site.css'))
    shutil.copy(os.path.join(SRC, 'app.js'), os.path.join(out, 'js', 'app.js'))
    shutil.copy(os.path.join(REPO, 'assets', 'lenis.min.js'), os.path.join(out, 'js', 'lenis.min.js'))
    for f in ('hero-poster.jpg', 'panel.jpg', 'panel-movil.jpg', 'card-front.jpg', 'card-back.jpg'):
        shutil.copy(os.path.join(SRC, f), os.path.join(out, 'v', f))
    if fondo:
        base = os.path.splitext(fondo)[0]
        shutil.copy(base + '.mp4', os.path.join(out, 'v', 'fondo.mp4'))
        shutil.copy(base + '.jpg', os.path.join(out, 'v', 'fondo.jpg'))
    for f in os.listdir(PHOTOS):
        if not f.endswith(('.jpg', '.mp4')):
            continue
        shutil.copy(os.path.join(PHOTOS, f), os.path.join(out, 'v', 'real-' + f))
    for _, pid in order:
        img = byid[pid]['img']
        shutil.copy(os.path.join(STILLS, img + '.webp'), os.path.join(out, 'v', 'p-%s.webp' % img))
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
    print('%s/ %d KB · %d páginas · %d productos en %d segmentos · fondo: %s'
          % (os.path.basename(out), total // 1024, len(PAGES), n, len(SEGMENTS), fondo or 'imagen fija'))
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
