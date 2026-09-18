"""Three modern takes on the TP monogram, rendered side by side to choose from.

What dates the current mark is not one detail but three at once: a stroke that
changes weight from the T to the P, chamfers on every corner, and a stem that
ends in an arrow point. Contemporary lettermarks hold one stroke weight, spend
their angles once, and let spacing do the work.

Each variant below changes exactly one idea so the choice is legible:
  A  one stroke weight throughout, a single 45 degree cut as the only angle
  B  no angles at all — pure geometry, the quietest of the three
  C  the P's bowl doubles as a contactless arc, which is what the product does
"""
import io, os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')

RED = '#E30613'
# Brushed, not chromed: three stops with a narrow range instead of seven with a
# wide one. The old gradient swung from #FFFFFF to #8F979F and back three times,
# which is what read as glare.
SILVER_STOPS = [('0%', '#F4F6F8'), ('46%', '#C3CAD1'), ('100%', '#E6EAED')]
STOPS = ''.join('<stop offset="%s" stop-color="%s"/>' % (o, c) for o, c in SILVER_STOPS)

DEFS = '<defs><linearGradient id="p{i}" x1="0" y1="0" x2=".7" y2="1">%s</linearGradient></defs>' % STOPS

# A — one stroke weight, one angle. The 45 degree cut on the T's arm is the only
#     bevel on the mark, and it rhymes with the card's corner slashes.
A = '''<svg viewBox="0 0 108 96" width="{w}" height="{w}">{defs}
  <path fill="{red}" d="M14,0 H58 V20 H44 V92 H24 V20 H0 Z"/>
  <path fill="url(#p{i})" fill-rule="evenodd"
        d="M58,0 H80 A26,26 0 0 1 80,52 H78 V92 H58 Z
           M78,20 H80 A6,6 0 0 1 80,32 H78 Z"/>
</svg>'''

# B — no bevels anywhere. Every terminal square, the counters generous, the
#     letters set apart rather than interlocked.
B = '''<svg viewBox="0 0 112 96" width="{w}" height="{w}">{defs}
  <path fill="{red}" d="M0,0 H48 V20 H34 V92 H14 V20 H0 Z"/>
  <path fill="url(#p{i})" fill-rule="evenodd"
        d="M60,0 H84 A26,26 0 0 1 84,52 H80 V92 H60 Z
           M80,20 H84 A6,6 0 0 1 84,32 H80 Z"/>
</svg>'''

# C — the bowl of the P is drawn as a contactless arc, and a second arc rides
#     off it. The mark then says what the product is, not only who makes it.
C = '''<svg viewBox="0 0 132 96" width="{w}" height="{w}">{defs}
  <path fill="{red}" d="M0,0 H48 V20 H34 V92 H14 V20 H0 Z"/>
  <path fill="url(#p{i})" fill-rule="evenodd"
        d="M58,0 H82 A26,26 0 0 1 82,52 H78 V92 H58 Z
           M78,20 H82 A6,6 0 0 1 82,32 H78 Z"/>
  <g fill="none" stroke="{red}" stroke-linecap="round">
    <path stroke-width="9" d="M112,16 A30,30 0 0 1 112,56"/>
    <path stroke-width="9" d="M126,2 A46,46 0 0 1 126,70"/>
  </g>
</svg>'''

SHEET = '''<!doctype html><html><head><meta charset="utf-8"><style>
body {{ margin:0; width:1500px; height:620px; background:#0D0D0D;
  font-family: system-ui, sans-serif; color:#E4E8EB; display:flex; }}
.col {{ flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; gap:34px; border-right:1px solid #232323; }}
.col:last-child {{ border-right:0; }}
.big {{ height:210px; display:flex; align-items:center; }}
.row {{ display:flex; align-items:flex-end; gap:30px; }}
.tag {{ font-size:15px; letter-spacing:.22em; color:#8A9199; text-transform:uppercase; }}
.name {{ font-size:34px; font-weight:800; letter-spacing:.06em; color:#E30613; }}
.note {{ font-size:13.5px; color:#9AA1A9; max-width:330px; text-align:center; line-height:1.55; }}
</style></head><body>{cols}</body></html>'''

COL = '''<div class="col">
  <div class="name">{letter}</div>
  <div class="big">{big}</div>
  <div class="row">{small}{tiny}</div>
  <div class="tag">{tag}</div>
  <div class="note">{note}</div>
</div>'''

VARIANTS = [
    ('A', A, 'un solo grosor', 'Mismo grosor de trazo en la T y en la P. El corte a 45° del brazo es el único ángulo, y repite el de las franjas de la tarjeta.'),
    ('B', B, 'sin ángulos', 'Geometría pura, terminaciones rectas, letras separadas en vez de encajadas. La más silenciosa y la que mejor aguanta tamaños chicos.'),
    ('C', C, 'con la señal', 'La misma P limpia, con las ondas de contactless saliendo a su derecha. El logo dice lo que hace el producto, no solo quién lo hace.'),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    cols = []
    for i, (letter, tpl, tag, note) in enumerate(VARIANTS):
        cols.append(COL.format(
            letter=letter, tag=tag, note=note,
            big=tpl.format(w=190, red=RED, i=i, defs=DEFS.format(i=i)),
            small=tpl.format(w=76, red=RED, i=i, defs=''),
            tiny=tpl.format(w=30, red=RED, i=i, defs='')))
    io.open(os.path.join(OUT, 'logos.html'), 'w', encoding='utf-8').write(
        SHEET.format(cols=''.join(cols)))
    print('hoja de variantes lista')
