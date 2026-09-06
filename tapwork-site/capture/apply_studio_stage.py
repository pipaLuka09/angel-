"""Apply the shared studio stage to the three CSS-only scenes.

NfcLab.dc.html is the source of truth, but e2e/harness8-10.html inline their own
copy of the scene CSS and markup, so the same edit has to land in each of them or
the captures come out of a stale copy. Every substitution is guarded, and files
that do not carry a given scene are simply skipped.
"""
import io, os, sys

STUDIO_CSS = '''  /* ---- Escenario de estudio compartido (tarjeta / llavero / mascotas) ----
     Las otras nueve escenas se renderizan en three.js sobre una tarima clara con
     una línea roja al frente, contra un fondo casi negro neutro. Estas tres están
     hechas solo con CSS, así que no pasan por `_studioRig`; esto les da el mismo
     fondo, la misma tarima y la misma sombra de contacto para que se lean como
     parte del mismo set y no como otra sesión de fotos. */
  .tw-studio { background: radial-gradient(120% 90% at 30% 34%, #17191c 0%, #0c0e10 58%, #070709 100%) !important; }
  /* Un ciclorama, no una tarima: estas escenas se ven casi de frente y no todas
     apoyan sobre algo (el llavero cuelga, mascotas son dos paneles), así que una
     mesa recortada pelearía con la composición. Un barrido de luz que sube desde
     el piso más la línea roja da el mismo estudio sin forzar nada. */
  .tw-slab { position: absolute; left: 0; right: 0; bottom: 0; height: 48%; z-index: 0; pointer-events: none; }
  .tw-slab span { position: absolute; inset: 0; display: block; }
  .tw-slab .tw-slab-top { background: linear-gradient(180deg, rgba(226,232,238,0) 0%, rgba(226,232,238,.05) 30%, rgba(228,234,240,.18) 58%, rgba(233,238,243,.40) 84%, rgba(238,242,246,.52) 100%); }
  /* El viñeteo lateral tiene que entrar por abajo con una máscara: un radial
     centrado bajo el cuadro ya está saturado en el borde superior del elemento
     y dejaría una costura horizontal donde el barrido empieza. */
  .tw-slab .tw-slab-shade { background: radial-gradient(76% 120% at 50% 106%, rgba(0,0,0,0) 36%, rgba(6,7,9,.52) 76%, rgba(6,7,9,.80) 100%);
    -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 46%); mask-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 46%); }
  .tw-slab .tw-slab-face { background: linear-gradient(180deg, rgba(255,255,255,0) 82%, rgba(255,255,255,.10) 100%); }
  .tw-slab .tw-slab-edge { top: auto; height: 6px; background: linear-gradient(180deg, #f2461f, #d8280d); }

'''

SLAB = ('<div class="tw-slab"><span class="tw-slab-top"></span>'
        '<span class="tw-slab-shade"></span><span class="tw-slab-face"></span>'
        '<span class="tw-slab-edge"></span></div>')

OLD_DESK = ('  .tj-desk { position: absolute; inset: 0; background: radial-gradient(120% 80% at 30% 30%, '
            '#fbfbfb 0%, #ececea 55%, #dedbd8 100%); }\n'
            '  .tj-desk::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; '
            'height: 2px; background: #ec3013; }\n')

EDITS = [
    (OLD_DESK, '  .tj-desk { position: absolute; inset: 0; }\n'),
    ('<div class="tj-stage" id="tw-tarjeta-stage" data-state="acerca">',
     '<div class="tj-stage tw-studio" id="tw-tarjeta-stage" data-state="acerca">'),
    ('<div class="tj-desk"></div>\n', '<div class="tj-desk"></div>\n              ' + SLAB + '\n'),
    ('<div class="lv-stage" id="tw-llavero-stage" data-state="acerca">\n',
     '<div class="lv-stage tw-studio" id="tw-llavero-stage" data-state="acerca">\n              ' + SLAB + '\n'),
    ('<div class="ms-stage" id="tw-mascotas-stage" data-state="lock">\n',
     '<div class="ms-stage tw-studio" id="tw-mascotas-stage" data-state="lock">\n              ' + SLAB + '\n'),
    ('.ms-photo { position: relative; flex: none;', '.ms-photo { position: relative; z-index: 2; flex: none;'),
    ('.ms-device { position: relative; flex: none;', '.ms-device { position: relative; z-index: 2; flex: none;'),
]


def patch(path):
    s = io.open(path, encoding='utf-8').read()
    n0 = len(s)
    if '.tw-slab {' not in s:
        assert s.count('</style>') >= 1, path
        s = s.replace('</style>', STUDIO_CSS + '</style>', 1)
    done = []
    for old, new in EDITS:
        c = s.count(old)
        if c == 0:
            continue
        assert c == 1, '%s: %d matches for %r' % (path, c, old[:50])
        s = s.replace(old, new, 1)
        done.append(old.strip()[:34])
    tmp = path + '.tmp'
    io.open(tmp, 'w', encoding='utf-8').write(s)
    os.replace(tmp, path)
    print('%-16s %d -> %d  (%d edits)' % (os.path.basename(path), n0, len(s), len(done)))


for f in sys.argv[1:]:
    patch(f)
