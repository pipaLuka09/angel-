"""Build the plain catalogue page: one page, twelve products, each with its clip.

The other page (build.py -> tapwork-nfc.html) is a scroll piece: sticky chapters,
side rails, a 300vh tap sequence, every image inlined into one 3.6 MB file. This
one is the opposite brief — a client opens it from a WhatsApp link, on a phone,
and has to understand twelve products without being walked through a production.

So: no scroll choreography, media as separate files the browser fetches only when
a card comes into view, and the clips doing the explaining. The clips are the
point. They are cut to run approach -> chip read -> content, which is the part
the ad clips skip, and they are composited on the page's own ground so they sit
on it with no visible edge.
"""
import io, os, re, shutil, urllib.parse
from string import Template

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'dist')
CLIPS = os.path.join(ROOT, 'webclips')
STILLS = os.path.join(ROOT, 'img1080')
PHONE = '096 779 4882'
WA = '593967794882'

# Scenes that animate get a clip; acrílico renders once and never moves, and
# pedidos-por-WhatsApp is the one product shown with a real client's photo
# (Döber's own acrylic), which no render should replace.
STILL = {'acrilico': 'acrilico', 'whatsapp': 'dober'}

HOW = [
    ('Acercas el celular',
     'A dos centímetros basta. No hay que abrir la cámara, ni apuntar, ni enfocar un QR.'),
    ('Se abre solo',
     'El chip guarda un enlace y el celular lo abre en el navegador. Tu cliente no instala nada.'),
    ('Lo cambias cuando quieras',
     'El objeto se queda igual. Lo que abre lo actualizas tú, sin volver a imprimir ni mandar a hacer otro.'),
]


def products():
    """Read the catalogue out of build.py so both pages describe the same products."""
    src = io.open(os.path.join(ROOT, 'build.py'), encoding='utf-8').read()
    block = re.compile(
        r"dict\(id='(?P<id>\w+)', img='(?P<img>\w+)', label='(?P<label>[^']*)', "
        r"kind='(?P<kind>[^']*)', client='(?P<client>[^']*)',\s*"
        r"headline='(?P<headline>[^']*)',\s*benefit='(?P<benefit>[^']*)',\s*"
        r"cta='(?P<cta>[^']*)', real='(?P<real>[^']*)', code='(?P<code>[^']*)'")
    return [m.groupdict() for m in block.finditer(src)]


# The catalogue is written all-lowercase as a styling choice on the other page,
# which flattens the names that are not ordinary words: a client reads "wi-fi y
# google" as carelessness, not as a look.
TERMS = [('nfc', 'NFC'), ('qr', 'QR'), ('google', 'Google'), ('whatsapp', 'WhatsApp'),
         ('wi-fi', 'Wi-Fi'), ('wifi', 'Wi-Fi'), ('instagram', 'Instagram'),
         ('tap work', 'Tap Work'), ('ia', 'IA')]


def sentence(s):
    """Give the copy its capital back, proper nouns included."""
    if not s:
        return s
    for low, proper in TERMS:
        s = re.sub(r'(?<![\w-])%s(?![\w-])' % re.escape(low), proper, s, flags=re.I)
    # Several benefit lines are two sentences, so the capital after the full stop
    # matters as much as the one at the start.
    return re.sub(r'(^|[.!?]\s+)([a-záéíóúñ])',
                  lambda m: m.group(1) + m.group(2).upper(), s)


MARK = ('<svg viewBox="0 0 100 100" width="26" height="26" aria-hidden="true">'
        '<rect x="15" y="26" width="48" height="13.5" rx="1.5" fill="currentColor"/>'
        '<rect x="32.2" y="26" width="13.6" height="45" rx="1.5" fill="currentColor"/>'
        '<g fill="none" stroke="currentColor" stroke-width="7.5" stroke-linecap="round">'
        '<path d="M69 37.5a16.5 16.5 0 0 1 0 22"/><path d="M81 30a30 30 0 0 1 0 37"/></g>'
        '<rect x="15" y="79" width="70" height="7.5" rx="3.75" fill="#EC3013"/></svg>')

WA_ICON = ('<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="currentColor">'
           '<path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1'
           '-1.6-.8-2.6-1.4-3.7-3.2-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5'
           '-.2 0-.4 0-.6 0s-.5.1-.8.4c-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.8.8 2.5.9 3.4.7'
           '.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3z"/>'
           '<path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2'
           'l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>')


def wa_link(text):
    return 'https://wa.me/%s?text=%s' % (WA, urllib.parse.quote(text))


def card(p):
    pid, img = p['id'], p['img']
    name = sentence(p['label'])
    alt = 'El celular se acerca al %s y se abre %s' % (p['kind'], p['label'])
    if pid in STILL:
        media = ('<img class="shot" src="v/%s.webp" alt="%s" width="480" height="480" loading="lazy">'
                 % (STILL[pid], sentence(p['label'])))
    else:
        media = (
            '<video class="shot" muted loop playsinline preload="none" poster="v/%s.jpg"\n'
            '             aria-label="%s" width="480" height="480">\n'
            '        <source src="v/%s.webm" type="video/webm">\n'
            '        <source src="v/%s.mp4" type="video/mp4">\n'
            '      </video>' % (img, alt, img, img))
    real = ('<span class="real">Hecho para %s</span>' % sentence(p['real'])) if p['real'] else ''
    return '''    <article class="item">
      %s
      <p class="code">%s</p>
      <h3>%s</h3>
      <p class="kind">%s · %s</p>
      <p class="benefit">%s</p>
      <p class="acts"><a class="ask" href="%s" target="_blank" rel="noopener">%s %s</a>%s</p>
    </article>''' % (
        media, p['code'].upper(), name, sentence(p['kind']), p['client'],
        sentence(p['benefit']), wa_link('Hola, ' + p['cta']), WA_ICON,
        sentence(p['cta']), real)


def build():
    ps = products()
    steps = '\n'.join(
        '      <li><h3>%s</h3><p>%s</p></li>' % (t, d) for t, d in HOW)
    items = '\n'.join(card(p) for p in ps)

    page = Template(PAGE).substitute(
        mark=MARK, wa=WA_ICON, phone=PHONE,
        walink=wa_link('Hola, quiero cotizar productos NFC de Tap Work'),
        steps=steps, items=items, n=len(ps))

    os.makedirs(os.path.join(OUT, 'v'), exist_ok=True)
    io.open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)

    kept = []
    for p in ps:
        if p['id'] in STILL:
            s = os.path.join(STILLS, STILL[p['id']] + '.webp')
            shutil.copy(s, os.path.join(OUT, 'v', STILL[p['id']] + '.webp'))
            kept.append(STILL[p['id']] + '.webp')
        else:
            for ext in ('mp4', 'webm', 'jpg'):
                s = os.path.join(CLIPS, '%s.%s' % (p['img'], ext))
                if os.path.exists(s):
                    shutil.copy(s, os.path.join(OUT, 'v', '%s.%s' % (p['img'], ext)))
                    kept.append('%s.%s' % (p['img'], ext))
    total = sum(os.path.getsize(os.path.join(OUT, 'v', f)) for f in kept)
    print('dist/index.html %d KB · dist/v/ %d archivos, %d KB · %d productos'
          % (len(page) // 1024, len(kept), total // 1024, len(ps)))
    missing = [p['img'] for p in ps if p['id'] not in STILL
               and not os.path.exists(os.path.join(CLIPS, p['img'] + '.mp4'))]
    if missing:
        print('FALTAN clips:', ', '.join(missing))


PAGE = '''<title>Catálogo Tap Work</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,400&display=swap">
<style>
  /* One theme on purpose: every clip is composited on --ground, so the product
     floats on the page with no visible frame. A light theme would put twelve
     dark squares on white and lose exactly the effect the clips are for. */
  :root {
    --ground: #0b0c0f;
    --raise: #14161a;
    --ink: #f2f3f4;
    --muted: #9aa0a8;
    --faint: #6a6f77;
    --red: #ec3013;
    --line: #23262c;
    --sans: "Archivo", system-ui, -apple-system, "Segoe UI", sans-serif;
    --serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--ground); color: var(--ink);
    font-family: var(--sans); font-size: 16px; line-height: 1.5;
    -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 1040px; margin: 0 auto; padding-inline: 20px; padding-block: 0 64px; }
  a { color: inherit; }
  :focus-visible { outline: 2px solid var(--red); outline-offset: 3px; border-radius: 4px; }

  header { padding-block: 40px 8px; }
  .brand { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 800;
    letter-spacing: -.02em; color: var(--ink); }
  h1 { font-size: clamp(30px, 6vw, 52px); font-weight: 800; letter-spacing: -.035em;
    line-height: 1.02; margin: 26px 0 0; text-wrap: balance; }
  h1 em { font-style: normal; color: var(--red); }
  .lede { font-family: var(--serif); font-size: 18px; line-height: 1.6; color: var(--muted);
    max-width: 58ch; margin: 16px 0 0; }

  .ask { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600;
    color: var(--ink); border: 1px solid var(--line); border-radius: 999px;
    padding: 10px 18px; text-decoration: none; transition: border-color .15s, background .15s; }
  .ask:hover { border-color: var(--red); background: rgba(236,48,19,.1); }
  .ask.big { font-size: 15px; padding: 13px 22px; background: var(--red); border-color: var(--red); }
  .ask.big:hover { background: #ff4a2a; border-color: #ff4a2a; }
  header .ask { margin-top: 26px; }

  h2 { font-size: 12px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase;
    color: var(--faint); margin: 0 0 20px; padding-bottom: 11px; border-bottom: 1px solid var(--line); }
  section { padding-top: 58px; }

  /* A real sequence, so it gets real numbers. */
  .how { list-style: none; counter-reset: s; display: grid; gap: 22px; margin: 0; padding: 0;
    grid-template-columns: 1fr; }
  @media (min-width: 720px) { .how { grid-template-columns: repeat(3, 1fr); gap: 26px; } }
  .how li { counter-increment: s; border-top: 2px solid var(--red); padding-top: 13px; }
  .how li::before { content: counter(s, decimal-leading-zero); font-size: 12px; font-weight: 700;
    color: var(--red); letter-spacing: .1em; }
  .how h3 { font-size: 18px; font-weight: 700; letter-spacing: -.015em; margin: 5px 0 5px; }
  .how p { font-family: var(--serif); font-size: 15.5px; line-height: 1.58; color: var(--muted); margin: 0; }

  .grid { display: grid; grid-template-columns: 1fr; gap: 44px 34px; }
  @media (min-width: 760px) { .grid { grid-template-columns: 1fr 1fr; } }
  .item { display: flex; flex-direction: column; }
  /* No card chrome: the clip already carries the page's ground, so a border or a
     radius around it would draw a box around a thing that has no edge. */
  .shot { width: 100%; max-width: 100%; aspect-ratio: 1; display: block;
    background: var(--ground); object-fit: cover; }
  .code { font-family: var(--sans); font-size: 10.5px; font-weight: 700; letter-spacing: .15em;
    color: var(--faint); margin: 14px 0 0; }
  .item h3 { font-size: 23px; font-weight: 700; letter-spacing: -.025em; margin: 7px 0 0; }
  .kind { font-size: 13px; color: var(--faint); margin: 6px 0 0; }
  .benefit { font-family: var(--serif); font-size: 16px; line-height: 1.6; color: var(--muted);
    margin: 11px 0 0; max-width: 46ch; }
  .acts { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 16px 0 0; }
  .real { font-size: 12px; color: var(--faint); }

  footer { margin-top: 64px; padding-top: 26px; border-top: 1px solid var(--line);
    display: flex; align-items: center; gap: 18px 26px; flex-wrap: wrap; }
  footer .tel { font-size: 26px; font-weight: 800; letter-spacing: -.02em; }
  footer .note { font-family: var(--serif); font-size: 15px; color: var(--faint);
    margin: 0; max-width: 46ch; }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header>
    <p class="brand">$mark Tap Work</p>
    <h1>Un toque hace <em>el trabajo</em>.</h1>
    <p class="lede">Ponemos un chip NFC en algo que tu negocio ya usa. Tu cliente acerca el
      celular y se abre lo que tú decidas: tu menú, tus reseñas de Google, tu contacto, tu wi-fi.
      Sin descargar aplicaciones y sin apuntar la cámara a un QR.</p>
    <a class="ask big" href="$walink" target="_blank" rel="noopener">$wa Cotizar por WhatsApp</a>
  </header>

  <section>
    <h2>Cómo funciona</h2>
    <ol class="how">
$steps
    </ol>
  </section>

  <section>
    <h2>Los $n productos</h2>
    <div class="grid">
$items
    </div>
  </section>

  <footer>
    <div>
      <p class="tel">$phone</p>
      <p class="note">Escríbenos por WhatsApp y te cotizamos ahí mismo, con lo que ya tienes en el local.</p>
    </div>
    <a class="ask" href="$walink" target="_blank" rel="noopener">$wa Escribir</a>
  </footer>
</div>

<script>
// Clips start paused on their poster, so the page at rest shows every product.
// They play only while on screen: twelve videos looping at once would heat a
// phone for no reason, and the one you are looking at is the only one that matters.
(function () {
  var vids = Array.prototype.slice.call(document.querySelectorAll('video.shot'));
  if (!vids.length) return;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.35 });
  vids.forEach(function (v) { io.observe(v); });
})();
</script>
'''

if __name__ == '__main__':
    build()
