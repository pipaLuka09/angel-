"""Build the reel page: the catalogue again, but every product explained by its own video.

buildsimple.py answers "what do you sell" with a looping 3D clip per product.
This page answers "how does it work for my business" the way the asistencia
promo already does: a question the owner recognises, the tap, the screen that
opens, the phone number. reels/composer.html renders one of those per product
(see reels/README.md); this script lays them out as a wall of vertical videos
and adds the motion layer from the ShopNow theme (assets/motion.js in the repo
root): word-by-word heading reveals from blur, cards rising in waves, Lenis on
mouse and trackpad only.

Output is a folder, not one file. The videos are ~1 MB each and a browser only
fetches the ones that scroll into view, which inlining would make impossible.

    python3 buildreels.py   # -> sitio/ (drag the folder into Netlify Drop)
"""
import io, os, shutil

import buildsimple as cat

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
OUT = os.path.join(ROOT, 'sitio')
REELS = os.path.join(ROOT, 'reels', 'v')
FONTS = os.path.join(ROOT, 'reels', 'fonts')
# The same vendored builds the ShopNow theme loads, so both sites run one
# version of each library.
VENDOR = ['gsap.min.js', 'scroll-trigger.min.js', 'lenis.min.js', 'split-type.min.js']

# The reel each product plays. asistencia is the original promo, re-encoded; the
# other eight come out of reels/composer.html.
REEL = {'pagos': 'pago', 'gimnasios': 'gym'}

# Short card copy. The catalogue's benefit lines run two sentences, which is
# right under a square clip and too long under a tall one.
LINE = {
    'menu': 'Cambias un precio desde tu celular y ya se ve en todas las mesas.',
    'resenas': 'Tu cliente deja la reseña en Google en diez segundos, cuando la experiencia fue buena.',
    'tarjeta': 'Tu contacto se guarda con un toque. Sin dictar tu número.',
    'asistencia': 'Tu equipo marca con su gafete y tú exportas la lista a Excel en un clic.',
    'wifi': 'Se conecta solo. Nadie le pide la clave al mesero.',
    'pagos': 'Paga y deja la propina desde su celular, sin esperar la cuenta.',
    'gimnasios': 'Cada serie queda registrada en la máquina, sin papel ni app.',
    'mascotas': 'Quien la encuentre ve sus vacunas, sus alergias y cómo avisarte.',
    'acrilico': 'Le pegamos el chip al acrílico que ya tienes. No se bota nada.',
}

HOW = [
    ('Acercas el celular',
     'A dos centímetros basta. No hay que abrir la cámara ni enfocar un QR.'),
    ('Se abre solo',
     'El chip guarda un enlace y el celular lo abre en el navegador. No se instala nada.'),
    ('Lo cambias cuando quieras',
     'El objeto se queda igual. Lo que abre lo actualizas tú, sin volver a imprimir.'),
]

ARROW = ('<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" '
         'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'
         '<path d="M5 12h14M13 6l6 6-6 6"/></svg>')
PLAY = ('<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">'
        '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>')


def esc(s):
    return s.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')


def reel(p, i):
    pid = p['id']
    v = REEL.get(pid, p['img'])
    name = cat.sentence(p['label'])
    kind = cat.sentence(p['kind'])
    client = p['client'][0].upper() + p['client'][1:]
    wa = cat.wa_link('Hola, ' + p['cta'])
    return '''      <article class="reel reveal" data-reel="{v}" data-name="{name}" data-code="{code}"
        data-kind="{kind}" data-line="{line}" data-wa="{wa}" data-cta="{cta}">
        <button class="reel__media" type="button" data-tilt aria-label="Ver el video de {name} en grande">
          <video muted loop playsinline preload="none" poster="v/{v}.jpg" width="720" height="1280"
            aria-hidden="true"><source src="v/{v}.mp4" type="video/mp4"></video>
          <span class="reel__code">{code}</span>
          <span class="reel__play">{play} Ver en grande</span>
        </button>
        <h3>{name}</h3>
        <p class="reel__kind">{kind} · {client}</p>
        <p class="reel__line">{line}</p>
        <a class="reel__ask" href="{wa}" target="_blank" rel="noopener">{cta} {arrow}</a>
      </article>'''.format(
        v=v, name=esc(name), code=esc(p['code'].upper()), kind=esc(kind),
        client=esc(client), line=esc(LINE[pid]), wa=esc(wa),
        cta=esc(cat.sentence(p['cta'])), play=PLAY, arrow=ARROW)


def page():
    ps = cat.products()
    steps = '\n'.join(
        '      <li class="step reveal"><span class="step__n">0%d</span><h3>%s</h3><p>%s</p></li>'
        % (i + 1, t, d) for i, (t, d) in enumerate(HOW))
    names = [cat.sentence(p['label']) for p in ps]
    ticker = ''.join('<span>%s</span>' % esc(n) for n in names)
    walink = cat.wa_link('Hola, quiero cotizar productos NFC de Tap Work')
    walink_asis = cat.wa_link('Hola, quiero control de asistencia con Tap Work')
    out = PAGE
    for k, v in dict(mark=cat.MARK, wa=cat.WA_ICON, phone=cat.PHONE, walink=esc(walink),
                     walink_asis=esc(walink_asis), steps=steps, ticker=ticker,
                     reels='\n'.join(reel(p, i) for i, p in enumerate(ps)),
                     n=str(len(ps)), arrow=ARROW, play=PLAY).items():
        out = out.replace('{{%s}}' % k, v)
    assert '{{' not in out, 'placeholder sin reemplazar'
    return out, ps


def build():
    body, ps = page()
    # The artifact preview wraps the page in its own document; Netlify needs one.
    head, rest = body.split('<!--/head-->')
    doc = ('<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
           '<meta name="description" content="Chips NFC para tu negocio en Machala: menú digital, '
           'reseñas de Google, asistencia, Wi-Fi, pagos y más. Mira cómo funciona cada uno.">\n'
           '<meta name="theme-color" content="#0b0c0f">\n'
           '<link rel="icon" href="data:image/svg+xml,%s">\n%s</head>\n<body>\n%s</body>\n</html>\n'
           % (FAVICON, head, rest))

    for d in ('v', 'js', 'fonts'):
        os.makedirs(os.path.join(OUT, d), exist_ok=True)
    io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(doc)
    # The same page without the document shell, for the claude.ai preview.
    io.open(os.path.join(OUT, 'preview.html'), 'w', encoding='utf-8').write(body)

    for f in VENDOR:
        shutil.copy(os.path.join(REPO, 'assets', f), os.path.join(OUT, 'js', f))
    shutil.copy(os.path.join(ROOT, 'reels', 'motion.js'), os.path.join(OUT, 'js', 'motion.js'))
    for f in os.listdir(FONTS):
        if f.endswith('.woff2'):
            shutil.copy(os.path.join(FONTS, f), os.path.join(OUT, 'fonts', f))

    vids = sorted({REEL.get(p['id'], p['img']) for p in ps})
    missing = []
    for v in vids:
        for ext in ('mp4', 'jpg'):
            s = os.path.join(REELS, '%s.%s' % (v, ext))
            if os.path.exists(s):
                shutil.copy(s, os.path.join(OUT, 'v', os.path.basename(s)))
            else:
                missing.append(os.path.basename(s))
    total = sum(os.path.getsize(os.path.join(dp, f))
                for dp, _, fs in os.walk(OUT) for f in fs)
    print('sitio/ %d KB en total · index.html %d KB · %d videos'
          % (total // 1024, len(doc) // 1024, len(vids)))
    if missing:
        print('FALTAN:', ', '.join(missing))


FAVICON = ('%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E'
           '%3Crect width=%27100%27 height=%27100%27 rx=%2722%27 fill=%27%230b0c0f%27/%3E'
           '%3Crect x=%2715%27 y=%2726%27 width=%2748%27 height=%2713.5%27 fill=%27%23f2f3f4%27/%3E'
           '%3Crect x=%2732.2%27 y=%2726%27 width=%2713.6%27 height=%2745%27 fill=%27%23f2f3f4%27/%3E'
           '%3Crect x=%2715%27 y=%2779%27 width=%2770%27 height=%277.5%27 rx=%273.75%27 fill=%27%23ec3013%27/%3E'
           '%3C/svg%3E')


PAGE = '''<title>Tap Work</title>
<style>
  /* A wall of vertical videos. Every reel is rendered on --ground, so the page
     commits to the dark look on purpose: on a light page each one would turn
     into a black slab. */
  @font-face { font-family: "Archivo"; src: url("fonts/archivo.woff2") format("woff2");
    font-weight: 100 900; font-stretch: 62% 125%; font-display: swap; }
  @font-face { font-family: "JetBrains Mono"; src: url("fonts/mono.woff2") format("woff2");
    font-weight: 100 800; font-display: swap; }
  :root {
    color-scheme: dark;
    --ground: #0b0c0f;
    --raise: #14161a;
    --ink: #f2f3f4;
    --muted: #a2a8b0;
    --faint: #7c828b;
    --line: #23262c;
    --red: #ec3013;
    --red-hi: #ff4a2a;
    --sans: "Archivo", system-ui, -apple-system, "Segoe UI", sans-serif;
    --mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
    --gutter: clamp(16px, 4vw, 40px);
    --max: 1180px;
  }
  * { box-sizing: border-box; }
  html { background: var(--ground); }
  html.lenis, html.lenis body { height: auto; }
  .lenis.lenis-smooth { scroll-behavior: auto !important; }
  body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--sans);
    font-size: 16px; line-height: 1.5; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
  a { color: inherit; }
  button { font: inherit; color: inherit; }
  :focus-visible { outline: 2px solid var(--red); outline-offset: 3px; border-radius: 6px; }
  .wrap { max-width: var(--max); margin: 0 auto; padding-inline: var(--gutter); }
  /* SplitType wraps each word; inline-block keeps the blur-and-rise per word. */
  .split-heading .word { display: inline-block; will-change: transform, filter; }

  /* ---------- bar ---------- */
  .bar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20;
    background: rgba(11, 12, 15, .72); backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%); border-bottom: 1px solid rgba(35, 38, 44, .7); }
  .bar .wrap { display: flex; align-items: center; gap: 24px; min-height: 62px; }
  .brand { display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 17px;
    letter-spacing: -.02em; text-decoration: none; }
  .bar nav { display: flex; gap: 22px; margin-left: auto; font-size: 14px; font-weight: 600; }
  .bar nav a { text-decoration: none; color: var(--muted); }
  .bar nav a:hover { color: var(--ink); }
  @media (max-width: 640px) { .bar nav { display: none; } .bar .btn { margin-left: auto; } }

  .btn { display: inline-flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 700;
    border-radius: 999px; padding: 13px 22px; text-decoration: none; border: 1px solid var(--line);
    background: transparent; cursor: pointer; transition: background .2s, border-color .2s; }
  .btn:hover { border-color: var(--muted); }
  .btn--red { background: var(--red); border-color: var(--red); color: #fff; }
  .btn--red:hover { background: var(--red-hi); border-color: var(--red-hi); }
  .btn--sm { font-size: 13.5px; padding: 9px 16px; }

  /* ---------- hero ---------- */
  .hero { position: relative; padding-block: clamp(36px, 7vw, 88px) clamp(48px, 7vw, 96px);
    overflow: hidden; }
  .hero .wrap { display: grid; gap: 48px; align-items: center; }
  @media (min-width: 900px) { .hero .wrap { grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr); } }
  .eyebrow { font-family: var(--mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--muted); margin: 0; display: flex; align-items: center; gap: 10px; }
  .eyebrow::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--red);
    box-shadow: 0 0 0 4px rgba(236, 48, 19, .18); }
  .hero__heading { font-size: clamp(46px, 8.6vw, 116px); font-weight: 800; font-stretch: 118%;
    line-height: .94; letter-spacing: -.045em; margin: 22px 0 0; text-wrap: balance; }
  .hero__heading em { font-style: normal; color: var(--red); }
  .hero__lede { font-size: clamp(17px, 1.6vw, 19px); line-height: 1.6; color: var(--muted);
    max-width: 52ch; margin: 24px 0 0; }
  .hero__lede b { color: var(--ink); font-weight: 600; }
  .hero__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }

  .phone-stage { position: relative; display: grid; place-items: center; }
  .phone-stage::before { content: ""; position: absolute; inset: 8% -10% 0; z-index: -1;
    background: radial-gradient(closest-side, rgba(236, 48, 19, .32), transparent 72%); filter: blur(20px); }
  /* The promo already shows a phone on screen, so it gets a plain reel frame;
     a bezel around it would put a phone inside a phone. */
  .hero-reel { position: relative; width: min(340px, 76vw); max-width: 100%; aspect-ratio: 9 / 16;
    border-radius: 30px; overflow: hidden; background: var(--raise);
    box-shadow: 0 50px 90px -40px rgba(0, 0, 0, .95), inset 0 0 0 1px rgba(255, 255, 255, .07); }
  .hero-reel video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-reel .reel__code { left: auto; right: 12px; }
  .phone-cap { margin: 18px 0 0; font-size: 13px; color: var(--faint); text-align: center; }

  /* ---------- ticker ---------- */
  .ticker { border-block: 1px solid var(--line); overflow: hidden; padding-block: 18px; }
  .ticker__track { display: flex; width: max-content; animation: tick 46s linear infinite; }
  .ticker__track span { font-size: clamp(22px, 3vw, 34px); font-weight: 700; font-stretch: 112%;
    letter-spacing: -.02em; color: var(--muted); white-space: nowrap; padding-right: 28px;
    display: inline-flex; align-items: center; gap: 28px; }
  .ticker__track span::after { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--red); }
  @keyframes tick { to { transform: translateX(-50%); } }
  .ticker:hover .ticker__track { animation-play-state: paused; }

  /* ---------- sections ---------- */
  .section { padding-block: clamp(64px, 9vw, 120px) 0; }
  .kicker { font-family: var(--mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--red); margin: 0 0 14px; }
  .section__heading { font-size: clamp(32px, 5vw, 64px); font-weight: 800; font-stretch: 112%;
    line-height: 1; letter-spacing: -.04em; margin: 0; max-width: 18ch; text-wrap: balance; }
  .section__lede { font-size: 17px; line-height: 1.6; color: var(--muted); max-width: 56ch; margin: 18px 0 0; }

  .steps { list-style: none; margin: 44px 0 0; padding: 0; display: grid; gap: 14px; }
  @media (min-width: 760px) { .steps { grid-template-columns: repeat(3, 1fr); } }
  .step { padding: 26px 24px 28px; border-radius: 22px; background: var(--raise); border: 1px solid var(--line); }
  .step__n { font-family: var(--mono); font-size: 13px; color: var(--red); }
  .step h3 { font-size: 22px; font-weight: 700; font-stretch: 108%; letter-spacing: -.025em; margin: 18px 0 8px; }
  .step p { margin: 0; color: var(--muted); font-size: 15.5px; line-height: 1.6; }

  /* ---------- reel wall ---------- */
  .wall { display: grid; gap: 36px 18px; margin-top: 48px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (min-width: 760px) { .wall { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 56px 26px; } }
  /* The board offset: the middle column sits lower, so the wall reads as a
     pinned board instead of a spreadsheet of identical tiles. */
  @media (min-width: 760px) { .reel:nth-child(3n+2) { margin-top: 72px; } }
  .reel { display: flex; flex-direction: column; min-width: 0; }
  .reel__media { position: relative; display: block; width: 100%; max-width: 100%; aspect-ratio: 9 / 16;
    padding: 0; border: 0; border-radius: 24px; overflow: hidden; cursor: pointer; background: var(--raise);
    box-shadow: 0 30px 60px -36px rgba(0, 0, 0, .9), inset 0 0 0 1px rgba(255, 255, 255, .05); }
  .reel__media video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .reel__code { position: absolute; right: 12px; top: 12px; font-family: var(--mono); font-size: 10.5px;
    letter-spacing: .08em; padding: 5px 9px; border-radius: 8px; background: rgba(11, 12, 15, .7);
    color: var(--ink); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
  .reel__play { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%);
    display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px;
    background: rgba(242, 243, 244, .94); color: var(--ground); font-size: 13px; font-weight: 700;
    white-space: nowrap; opacity: 0; transition: opacity .25s, transform .25s; }
  .reel__media:hover .reel__play, .reel__media:focus-visible .reel__play { opacity: 1;
    transform: translateX(-50%) translateY(-4px); }
  /* Touch has no hover, so the cue is always there, as a small round button
     that leaves the video readable. */
  @media (hover: none) {
    .reel__play { opacity: 1; left: auto; right: 10px; bottom: 10px; transform: none; width: 36px; height: 36px;
      padding: 0; justify-content: center; font-size: 0; gap: 0; }
    .reel__play svg { margin-left: 2px; }
    .reel__media:focus-visible .reel__play { transform: none; }
  }
  .reel h3 { font-size: clamp(18px, 2vw, 24px); font-weight: 700; font-stretch: 108%;
    letter-spacing: -.025em; margin: 18px 0 0; line-height: 1.15; }
  .reel__kind { font-size: 13px; color: var(--faint); margin: 6px 0 0; }
  .reel__line { font-size: 15.5px; line-height: 1.55; color: var(--muted); margin: 10px 0 0; }
  .reel__ask { display: inline-flex; align-items: center; gap: 7px; margin-top: 14px; font-size: 14px;
    font-weight: 700; color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--red);
    padding-bottom: 3px; align-self: flex-start; }
  .reel__ask:hover { color: var(--red-hi); }
  /* On a phone two columns leave ~170px per card: the name stays, the rest
     moves into the player that opens on tap. */
  @media (max-width: 759px) {
    .reel__line, .reel__ask { display: none; }
    .reel h3 { font-size: 16px; margin-top: 12px; }
    .reel__kind { font-size: 12px; }
    .reel__media { border-radius: 18px; }
    .reel__code { display: none; }
  }

  /* ---------- pricing ---------- */
  .plans { display: grid; gap: 16px; margin-top: 44px; }
  @media (min-width: 760px) { .plans { grid-template-columns: 1fr 1fr; } }
  .plan { border-radius: 26px; padding: 30px 28px 32px; background: var(--raise); border: 1px solid var(--line);
    display: flex; flex-direction: column; min-width: 0; }
  .plan--best { border-color: rgba(236, 48, 19, .7);
    background: linear-gradient(180deg, rgba(236, 48, 19, .14), var(--raise) 55%); }
  .plan__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .plan h3 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: .02em; }
  .tag { font-family: var(--mono); font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
    padding: 5px 10px; border-radius: 999px; background: var(--red); color: #fff; }
  .price { margin: 22px 0 0; font-size: clamp(56px, 7vw, 84px); font-weight: 800; font-stretch: 112%;
    letter-spacing: -.05em; line-height: 1; font-variant-numeric: tabular-nums; }
  .price small { font-size: 18px; font-weight: 600; letter-spacing: 0; color: var(--muted); font-stretch: 100%; }
  .plan__note { margin: 12px 0 0; color: var(--muted); font-size: 15.5px; }
  .plan__note b { color: var(--ink); }
  .plan .btn { margin-top: 26px; align-self: flex-start; }
  .incl { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 0;
    border-top: 1px solid var(--line); }
  @media (min-width: 760px) { .incl { grid-template-columns: 1fr 1fr; column-gap: 32px; } }
  .incl li { display: flex; justify-content: space-between; gap: 16px; padding: 15px 0;
    border-bottom: 1px solid var(--line); font-size: 15.5px; }
  .incl li span { color: var(--muted); }
  .incl li b { font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
  .others { margin: 22px 0 0; color: var(--muted); font-size: 15.5px; max-width: 64ch; }

  /* ---------- close ---------- */
  .close { padding-block: clamp(80px, 11vw, 150px) 40px; text-align: left; }
  .close__tel { display: block; font-size: clamp(44px, 9vw, 120px); font-weight: 800; font-stretch: 120%;
    letter-spacing: -.05em; line-height: 1; margin: 22px 0 0; font-variant-numeric: tabular-nums;
    user-select: all; }
  .close .hero__actions { margin-top: 28px; }
  footer { border-top: 1px solid var(--line); padding-block: 26px 40px; color: var(--faint); font-size: 13.5px; }
  footer .wrap { display: flex; flex-wrap: wrap; gap: 10px 24px; justify-content: space-between; }

  /* ---------- player ---------- */
  dialog.player { border: 0; padding: 0; background: transparent; color: var(--ink);
    width: min(940px, 100vw - 32px); max-width: 100%; max-height: calc(100dvh - 32px); }
  dialog.player::backdrop { background: rgba(5, 6, 8, .84); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
  .player__in { display: grid; gap: 22px; align-items: center; background: var(--raise);
    border: 1px solid var(--line); border-radius: 26px; padding: 16px; max-height: calc(100dvh - 32px); overflow: auto; }
  @media (min-width: 760px) { .player__in { grid-template-columns: auto minmax(260px, 1fr); padding: 18px 36px 18px 18px; gap: 36px; } }
  /* width:auto is load-bearing: the width attribute would otherwise win over
     aspect-ratio and letterbox the reel inside a wide black box. */
  .player video { height: min(76dvh, 760px); width: auto; max-width: 100%; aspect-ratio: 9 / 16; border-radius: 18px;
    display: block; margin: 0 auto; background: #000; }
  @media (max-width: 759px) { .player video { height: auto; width: 100%; max-height: 64dvh; object-fit: contain; } }
  .player h3 { font-size: clamp(26px, 3.4vw, 40px); font-weight: 800; font-stretch: 112%;
    letter-spacing: -.035em; margin: 10px 0 0; line-height: 1.05; }
  .player .reel__kind { font-size: 14px; }
  .player p.line { font-size: 17px; line-height: 1.6; color: var(--muted); margin: 14px 0 0; }
  .player .btn { margin-top: 24px; }
  .player__x { position: absolute; right: 10px; top: 10px; width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid var(--line); background: rgba(11, 12, 15, .8); cursor: pointer; font-size: 20px;
    line-height: 1; display: grid; place-items: center; }
  dialog.player > div { position: relative; }

  @media (prefers-reduced-motion: reduce) {
    .ticker__track { animation: none; flex-wrap: wrap; width: auto; }
    .ticker__track span:nth-child(n+10) { display: none; }
    * { transition: none !important; }
  }
</style>
<!--/head-->
<header class="bar">
  <div class="wrap">
    <a class="brand" href="#top">{{mark}} Tap Work</a>
    <nav aria-label="Secciones"><a href="#como">Cómo funciona</a><a href="#productos">Productos</a><a href="#precios">Precios</a></nav>
    <a class="btn btn--red btn--sm" href="{{walink}}" target="_blank" rel="noopener">{{wa}} Cotizar</a>
  </div>
</header>

<main id="top">
  <section class="hero">
    <div class="wrap">
      <div>
        <p class="eyebrow">Chips NFC para negocios · Machala</p>
        <h1 class="hero__heading">Un toque hace <em>el trabajo.</em></h1>
        <p class="hero__lede">Ponemos un chip NFC en algo que tu negocio ya usa. Tu cliente acerca el celular y
          se abre lo que tú decidas: <b>tu menú, tus reseñas de Google, tu contacto, tu Wi-Fi.</b>
          Sin descargar aplicaciones y sin apuntar la cámara a un QR.</p>
        <div class="hero__actions">
          <a class="btn btn--red" href="{{walink}}" target="_blank" rel="noopener">{{wa}} Cotizar por WhatsApp</a>
          <a class="btn" href="#productos">Ver los {{n}} videos {{arrow}}</a>
        </div>
      </div>
      <div class="phone-stage" data-hero-parallax>
        <div class="hero-reel">
          <video autoplay muted loop playsinline preload="auto" poster="v/asistencia.jpg" width="720" height="1280"
            aria-label="Video: un empleado acerca su gafete al celular del local, se marca su hora de entrada y el administrador ve todo el turno en un panel">
            <source src="v/asistencia.mp4" type="video/mp4"></video>
          <span class="reel__code">TW-06 · GAFETE</span>
        </div>
        <p class="phone-cap">Control de asistencia con gafete NFC</p>
      </div>
    </div>
  </section>

  <div class="ticker" aria-hidden="true"><div class="ticker__track">{{ticker}}{{ticker}}</div></div>

  <section class="section" id="como">
    <div class="wrap">
      <p class="kicker">Cómo funciona</p>
      <h2 class="section__heading">Tres pasos, y el primero es acercar el celular.</h2>
      <ol class="steps">
{{steps}}
      </ol>
    </div>
  </section>

  <section class="section" id="productos">
    <div class="wrap">
      <p class="kicker">Los {{n}} productos</p>
      <h2 class="section__heading">Mira cómo funciona cada uno.</h2>
      <p class="section__lede">Cada video dura menos de treinta segundos. Toca cualquiera para verlo en grande.</p>
      <div class="wall">
{{reels}}
      </div>
    </div>
  </section>

  <section class="section" id="precios">
    <div class="wrap">
      <p class="kicker">Precios · Control de asistencia</p>
      <h2 class="section__heading">Un solo precio, tenga el tamaño que tenga.</h2>
      <p class="section__lede">De 1 a 40 personas pagas lo mismo. Lo único que cambia con el tamaño son las tarjetas.</p>
      <div class="plans">
        <article class="plan reveal">
          <div class="plan__top"><h3>Mensual</h3></div>
          <p class="price">$25<small> /mes</small></p>
          <p class="plan__note">Más <b>$30 de instalación</b>, una sola vez.</p>
          <a class="btn" href="{{walink_asis}}" target="_blank" rel="noopener">{{wa}} Empezar mensual</a>
        </article>
        <article class="plan plan--best reveal">
          <div class="plan__top"><h3>Anual</h3><span class="tag">Ahorras $60</span></div>
          <p class="price">$270<small> /año</small></p>
          <p class="plan__note"><b>Instalación incluida.</b> Un solo pago por los doce meses.</p>
          <a class="btn btn--red" href="{{walink_asis}}" target="_blank" rel="noopener">{{wa}} Quiero el anual</a>
        </article>
      </div>
      <ul class="incl reveal">
        <li><span>Tarjetas incluidas</span><b>Las 10 primeras</b></li>
        <li><span>Desde la tarjeta 11</span><b>$5 cada una, una vez</b></li>
        <li><span>Varios locales</span><b>Mismo precio</b></li>
        <li><span>Tarjeta de repuesto</span><b>$6</b></li>
      </ul>
      <p class="others">Más de 40 personas, o cualquiera de los otros productos: te cotizamos por WhatsApp según
        cuántos necesites.</p>
    </div>
  </section>

  <section class="close">
    <div class="wrap">
      <p class="kicker">Escríbenos</p>
      <h2 class="section__heading">Te lo dejamos funcionando en tu local.</h2>
      <span class="close__tel">{{phone}}</span>
      <div class="hero__actions">
        <a class="btn btn--red" href="{{walink}}" target="_blank" rel="noopener">{{wa}} Escribir por WhatsApp</a>
      </div>
    </div>
  </section>
</main>

<footer><div class="wrap"><span>Tap Work · Chips NFC para negocios</span><span>WhatsApp {{phone}}</span></div></footer>

<dialog class="player" id="player" aria-labelledby="player-name">
  <div class="player__in">
    <video controls playsinline muted loop width="720" height="1280"></video>
    <div>
      <span class="reel__code" style="position:static;display:inline-block" data-p="code"></span>
      <h3 id="player-name" data-p="name"></h3>
      <p class="reel__kind" data-p="kind"></p>
      <p class="line" data-p="line"></p>
      <a class="btn btn--red" data-p="wa" href="#" target="_blank" rel="noopener">{{wa}} <span data-p="cta"></span></a>
    </div>
  </div>
  <button class="player__x" type="button" aria-label="Cerrar">×</button>
</dialog>

<script>
document.documentElement.classList.add('js');

/* Reels play only while on screen: nine videos looping at once would heat a
   phone, and the one in view is the only one that matters. */
(function () {
  var vids = [].slice.call(document.querySelectorAll('.reel video'));
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!still && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === 'none') { v.preload = 'auto'; }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) { v.pause(); }
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { io.observe(v); });
  }
  if (still) {
    var hero = document.querySelector('.phone video');
    if (hero) { hero.removeAttribute('autoplay'); hero.pause(); hero.setAttribute('controls', ''); }
  }

  var dlg = document.getElementById('player');
  var pv = dlg.querySelector('video');
  function field(k) { return dlg.querySelector('[data-p="' + k + '"]'); }
  document.querySelectorAll('.reel__media').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = btn.closest('.reel'), d = r.dataset;
      field('code').textContent = d.code;
      field('name').textContent = d.name;
      field('kind').textContent = d.kind;
      field('line').textContent = d.line;
      field('cta').textContent = d.cta;
      field('wa').href = d.wa;
      pv.poster = 'v/' + d.reel + '.jpg';
      pv.src = 'v/' + d.reel + '.mp4';
      vids.forEach(function (v) { v.pause(); });
      if (window.__lenis) window.__lenis.stop();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      var p = pv.play(); if (p && p.catch) p.catch(function () {});
    });
  });
  function shut() { if (dlg.open) dlg.close(); }
  dlg.querySelector('.player__x').addEventListener('click', shut);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(); });
  dlg.addEventListener('close', function () {
    pv.pause(); pv.removeAttribute('src'); pv.load();
    if (window.__lenis) window.__lenis.start();
  });
})();

/* The motion layer stays off the critical path, as in the ShopNow theme: the
   vendored libraries load one at a time, in order, only after window.load. */
window.addEventListener('load', function () {
  var files = ['js/gsap.min.js', 'js/scroll-trigger.min.js', 'js/lenis.min.js', 'js/split-type.min.js', 'js/motion.js'];
  (function next(i) {
    if (i >= files.length) return;
    var s = document.createElement('script');
    s.src = files[i];
    s.onload = s.onerror = function () { next(i + 1); };
    document.body.appendChild(s);
  })(0);
});
</script>
'''

if __name__ == '__main__':
    build()
