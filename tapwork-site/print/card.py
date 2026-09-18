"""Redraw the Tap Work card as print artwork at the real card size.

What arrived was a mockup photograph: the card at an angle, under studio light,
on bubble wrap. Nothing in that image is printable — perspective, glare and the
background's reflections are baked into every pixel, and the card occupies far
too few of them for 300 dpi at 54 mm. So the design is rebuilt as vector at the
exact trim size, which is also what a printer actually wants.

ISO 7810 ID-1, the format every NFC card uses: 85.6 x 54 mm. The design is
vertical, so the card is portrait — 54 wide by 85.6 tall — plus 3 mm of bleed on
every side, which is what print shops here ask for.

Colours were sampled off the mockup rather than guessed: its reds run #C60612 to
#D62A32 depending on where the light falls, so the flat colour underneath is
about #E30613 — and that one converts to a clean CMYK red instead of a muddy one.
"""
import io, os, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get('TAPWORK_FONTS',
                       '/tmp/claude-0/-home-user-angel-/194e78c5-b7d9-567d-9e9f-5f4edaaf8b10/scratchpad/card/fonts')
OUT = os.path.join(ROOT, 'out')

TRIM_W, TRIM_H = 54.0, 85.6      # mm, ID-1 stood on end
BLEED = 3.0                       # mm on every side
SAFE = 4.0                        # mm inside the trim: nothing important crosses it
W, H = TRIM_W + BLEED * 2, TRIM_H + BLEED * 2

RED = '#E30613'
INK = '#EDF0F2'          # plata claro: el tono plano para textos pequeños
BLACK = '#0D0D0D'
# Un degradado plateado es una sucesión de luces y sombras, no un gris: son los
# cambios los que el ojo lee como metal. Va solo en las piezas grandes — sobre
# texto chico el degradado se ensucia al imprimir.
SILVER = ('linear-gradient(118deg, #FFFFFF 0%, #AFB7BF 17%, #F4F7F9 33%, '
          '#8F979F 52%, #FBFCFD 68%, #A9B1B9 85%, #E8ECEF 100%)')
SILVER_STOPS = [('0%', '#FFFFFF'), ('17%', '#AFB7BF'), ('33%', '#F4F7F9'),
                ('52%', '#8F979F'), ('68%', '#FBFCFD'), ('85%', '#A9B1B9'),
                ('100%', '#E8ECEF')]


def font_face():
    """Embed the face rather than linking it: a PDF that depends on a web font
    prints in whatever the shop's machine falls back to."""
    import base64
    f = os.path.join(FONTS, 'montserrat-700.woff2')
    b64 = base64.b64encode(open(f, 'rb').read()).decode()
    return ("@font-face{font-family:'Montserrat';font-style:normal;"
            "font-weight:100 900;src:url(data:font/woff2;base64,%s) format('woff2');}" % b64)


# The monogram, redrawn. The mockup shows an angular T and P sharing a stem, with
# 45-degree cuts throughout; these paths reproduce that construction rather than
# tracing the photograph, which would carry its lighting into the artwork.
MONOGRAM = '''<svg viewBox="0 0 112 90" width="100%" height="100%" aria-label="TP">
  <defs><linearGradient id="plata" x1="0" y1="0" x2="1" y2="1">{stops}</linearGradient></defs>
  <path fill="{red}" d="M9,0 H66 V18 H47 V77 L37,88 L27,77 V18 H0 Z"/>
  <path fill="url(#plata)" fill-rule="evenodd"
        d="M57,0 H95 L109,13 V33 L95,46 H75 V88 H57 Z
           M75,15 H90 L96,20 V26 L90,31 H75 Z"/>
</svg>'''.format(red=RED, stops=''.join(
    '<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in SILVER_STOPS))

# The contactless mark: three arcs opening right, struck from one centre.
NFC = '''<svg viewBox="0 0 44 44" width="100%" height="100%" aria-label="NFC">
  <g fill="none" stroke="{red}" stroke-width="4.4" stroke-linecap="round">
    <path d="M13,13 a13,13 0 0 1 0,18"/>
    <path d="M22,7 a21,21 0 0 1 0,30"/>
    <path d="M31,1.5 a29,29 0 0 1 0,41"/>
  </g>
  <circle cx="6" cy="22" r="3.4" fill="{red}"/>
</svg>'''.format(red=RED)

PAGE = '''<!doctype html>
<html><head><meta charset="utf-8"><style>
{face}
@page {{ size: {w}mm {h}mm; margin: 0; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {w}mm; height: {h}mm; }}
body {{ font-family: 'Montserrat', sans-serif; -webkit-font-smoothing: antialiased; }}
.card {{ position: relative; width: {w}mm; height: {h}mm; overflow: hidden;
  background: {black}; color: {ink}; }}
/* Kept very shallow on purpose: a strong gradient over a large dark area is
   where offset printing bands. */
.sheen {{ position: absolute; inset: 0;
  background:
    linear-gradient(118deg, rgba(255,255,255,.055) 0%, rgba(255,255,255,0) 34%,
                    rgba(255,255,255,.03) 52%, rgba(255,255,255,0) 72%),
    radial-gradient(120% 82% at 50% 20%, #1D1D1D 0%, {black} 64%); }}
/* The corner slashes run off the artboard, which is what the bleed is for. */
.slash {{ position: absolute; background: {red}; transform-origin: center; }}
.s1 {{ top: -6mm; left: -7mm; width: 1.1mm; height: 26mm; transform: rotate(-45deg); }}
.s2 {{ top: -10mm; left: -2mm; width: 2.6mm; height: 30mm; transform: rotate(-45deg); }}
.s3 {{ bottom: -7mm; right: -6mm; width: 1.1mm; height: 26mm; transform: rotate(-45deg); }}
.s4 {{ bottom: -11mm; right: -1mm; width: 2.6mm; height: 30mm; transform: rotate(-45deg); }}
.stack {{ position: absolute; left: {bleed}mm; top: {bleed}mm;
  width: {tw}mm; height: {th}mm; display: flex; flex-direction: column;
  align-items: center; }}
.mono {{ width: 24mm; margin-top: 12mm; }}
.word {{ margin-top: 8.2mm; font-weight: 800; font-size: 6.4mm; letter-spacing: .20em;
  white-space: nowrap; text-indent: .20em;
  background: {silver}; -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent; }}
.word b {{ font-weight: 800; -webkit-text-fill-color: {red}; color: {red}; }}
.tag {{ margin-top: 5.2mm; font-weight: 400; font-size: 2.0mm; letter-spacing: .28em;
  line-height: 1.85; text-align: center; text-indent: .28em; color: #CDD3D9; }}
.nfc {{ position: absolute; left: 0; right: 0; bottom: 12.5mm;
  display: flex; flex-direction: column; align-items: center; gap: 2.2mm; }}
.nfc .sym {{ width: 7.4mm; }}
.nfc span {{ font-weight: 600; font-size: 2.1mm; letter-spacing: .34em; text-indent: .34em; }}
/* Back */
.back {{ justify-content: center; }}
/* Plata plana, no degradado: a 2.9 mm el degradado deja unas letras oscuras y
   otras claras dentro de la misma palabra, y eso se lee como suciedad de
   impresión, no como metal. El degradado se queda donde hay superficie que lo
   sostenga — el monograma y el wordmark. */
.claim {{ font-weight: 500; font-size: 2.9mm; letter-spacing: .30em; line-height: 2.05;
  text-align: center; text-indent: .30em; color: #E4E8EB; }}
.rule {{ margin-top: 5.4mm; width: 13mm; height: .7mm; background: {red}; }}
</style></head><body>{body}</body></html>
'''

FRONT = '''<div class="card"><div class="sheen"></div>
  <i class="slash s1"></i><i class="slash s2"></i>
  <i class="slash s3"></i><i class="slash s4"></i>
  <div class="stack">
    <div class="mono">{mono}</div>
    <div class="word">TAP <b>WORK</b></div>
    <div class="tag">TU NEGOCIO<br>SIEMPRE CONECTADO</div>
  </div>
  <div class="nfc"><div class="sym">{nfc}</div><span>NFC</span></div>
</div>'''

BACK = '''<div class="card"><div class="sheen"></div>
  <div class="stack back">
    <div class="claim">INNOVACIÓN<br>QUE IMPULSA<br>TU NEGOCIO</div>
    <div class="rule"></div>
  </div>
</div>'''


def page(body):
    return PAGE.format(face=font_face(), w=W, h=H, tw=TRIM_W, th=TRIM_H,
                       bleed=BLEED, black=BLACK, ink=INK, red=RED,
                       silver=SILVER, body=body)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    io.open(os.path.join(OUT, 'frente.html'), 'w', encoding='utf-8').write(
        page(FRONT.format(mono=MONOGRAM, nfc=NFC)))
    io.open(os.path.join(OUT, 'reverso.html'), 'w', encoding='utf-8').write(page(BACK))
    print('artboard %.1f x %.1f mm (corte %.1f x %.1f + %.0f de sangrado)'
          % (W, H, TRIM_W, TRIM_H, BLEED))
