"""A mockup of the card, separate from the artwork that goes to print.

Gloss on a physical card comes from its finish — a UV varnish or a gloss
lamination the printer applies — not from highlights painted into the file. Bake
a highlight into the artwork and it prints as a permanent grey smear that sits
in the same place no matter how the card is held.

So the shine lives here instead: the print files stay flat and correct, and this
renders what the card looks like once it has that finish, for showing people.
"""
import base64, io, os

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out')


def b64(name):
    with open(os.path.join(OUT, name), 'rb') as f:
        return base64.b64encode(f.read()).decode()


HTML = '''<!doctype html><html><head><meta charset="utf-8"><style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ width: 1600px; height: 1100px; overflow: hidden;
  background: radial-gradient(70% 60% at 50% 38%, #24262a 0%, #121316 55%, #08090b 100%); }}
.floor {{ position: absolute; inset: 0;
  background: repeating-linear-gradient(96deg, rgba(255,255,255,.012) 0 3px, transparent 3px 7px); }}
.stage {{ position: absolute; inset: 0; display: flex; align-items: center;
  justify-content: center; gap: 96px; perspective: 2400px; }}
.card {{ position: relative; width: 430px; height: 656px; border-radius: 22px;
  overflow: hidden; flex: none;
  box-shadow: 0 60px 90px -30px rgba(0,0,0,.85), 0 10px 26px rgba(0,0,0,.6),
              0 0 0 1px rgba(255,255,255,.055); }}
.a {{ transform: rotateX(7deg) rotateY(-13deg) rotateZ(-2deg); }}
.b {{ transform: rotateX(7deg) rotateY(-13deg) rotateZ(-2deg) translateY(26px); }}
.card img {{ display: block; width: 100%; height: 100%; object-fit: cover; }}
/* The finish: one broad specular sweep plus a tight edge catch, which is how a
   gloss laminate actually behaves under a single light. */
.gloss {{ position: absolute; inset: 0; pointer-events: none;
  background:
    linear-gradient(116deg, rgba(255,255,255,0) 26%, rgba(255,255,255,.16) 38%,
                    rgba(255,255,255,.30) 44%, rgba(255,255,255,.07) 51%,
                    rgba(255,255,255,0) 60%),
    linear-gradient(116deg, rgba(255,255,255,0) 68%, rgba(255,255,255,.08) 76%,
                    rgba(255,255,255,0) 83%); }}
.rim {{ position: absolute; inset: 0; pointer-events: none; border-radius: 22px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.22), inset 0 -1px 0 rgba(255,255,255,.07); }}
</style></head><body>
<div class="floor"></div>
<div class="stage">
  <div class="card a"><img src="data:image/png;base64,{front}"><div class="gloss"></div><div class="rim"></div></div>
  <div class="card b"><img src="data:image/png;base64,{back}"><div class="gloss"></div><div class="rim"></div></div>
</div>
</body></html>'''

if __name__ == '__main__':
    io.open(os.path.join(OUT, 'mockup.html'), 'w', encoding='utf-8').write(
        HTML.format(front=b64('tapwork-tarjeta-frente-600dpi.png'),
                    back=b64('tapwork-tarjeta-reverso-600dpi.png')))
    print('mockup.html listo')
