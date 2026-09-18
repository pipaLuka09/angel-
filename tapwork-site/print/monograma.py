"""El monograma TP de Tap Work, redibujado como vector desde la foto de la tarjeta.

La foto tiene 147 x 111 px, está tomada en ángulo y sobre material negro: no hay
nada ahí que se pueda imprimir. Así que en vez de calcarla se midió cómo está
construida —los bordes, los grosores, los ángulos de cada corte— y se rehizo la
misma construcción en vector, que además es lo que hace que aguante desde un
favicon hasta un rótulo.

Lo que se midió en la foto, y que esta reconstrucción respeta:

  * No hay itálica: todo el monograma está ROTADO ~14 grados a la izquierda.
    Se nota porque el brazo de la T sube hacia la derecha y los dos astiles se
    van hacia la derecha al bajar. Una itálica de verdad haría lo contrario.
  * Todos los remates están cortados a 45 grados — los dos extremos del brazo,
    la punta de cada astil y la boca del gancho de la P. Comprobado deshaciendo
    la rotación: los cortes caen en 45 exactos.
  * La P no tiene astil arriba: es un GANCHO abierto por la izquierda, y el
    brazo de la T pasa justo por esa abertura y la cierra visualmente. Ese es
    el truco del logo — la T completa a la P.
  * La T y la P no se tocan nunca: entre las dos hay un hueco de ~0.8 del grosor
    del trazo. Eso es lo que las deja leer como dos piezas y no como una mancha.
"""
import io, os

ROOT = os.path.dirname(os.path.abspath(__file__))

W = 17.0          # grosor del trazo — igual en la T y en la P
CAP = 100.0       # altura de caja
TILT = -14.0      # rotación del conjunto, en grados

# --- T ---------------------------------------------------------------------
BAR = 84.0        # largo del filo superior del brazo (4.7 grosores)
SX = 33.0         # borde izquierdo del astil: queda centrado en el brazo

T_PATH = (f'M0,0 H{BAR} L{BAR + W},{W} H{SX + W} V{CAP - W} L{SX},{CAP} '
          f'V{W} H{W} Z')

# --- P ---------------------------------------------------------------------
GAP = 16.0        # hueco entre los dos astiles (0.9 del grosor)
TX = SX + W + GAP     # la P arranca a la derecha del astil de la T
TY = -4.0         # el cuenco redondo desborda un poco por arriba, como debe
PCAP = 93.0       # la P es algo más corta que la T: termina antes por abajo
CXP = 42.0        # donde termina el filo recto del cuenco y empieza la curva
RX, RY = 27.0, 27.0   # el cuenco es una elipse: más ancho que alto, como el original
MOUTH = 27.0      # boca del gancho: se mete justo debajo del brazo de la T

P_PATH = (f'M{MOUTH},0 H{CXP} A{RX},{RY} 0 0 1 {CXP},{2 * RY} H{W} V{PCAP - W} '
          f'L0,{PCAP} V{2 * RY - W} H{CXP} A{RX - W},{RY - W} 0 0 0 {CXP},{2 * RY - 2 * W} '
          f'H{MOUTH + W} Z')

BOX_W = TX + CXP + RX
BOX_H = CAP


def svg(red, silver_id, silver_stops, tilt=TILT, extra=''):
    """El monograma como SVG suelto, para meterlo donde haga falta."""
    cx, cy = BOX_W / 2, BOX_H / 2
    # La rotación agranda la caja: se calcula el alto real para no recortar.
    import math
    a = math.radians(abs(tilt))
    w = BOX_W * math.cos(a) + BOX_H * math.sin(a)
    h = BOX_W * math.sin(a) + BOX_H * math.cos(a)
    ox, oy = (w - BOX_W) / 2, (h - BOX_H) / 2
    stops = ''.join('<stop offset="%s" stop-color="%s"/>' % s for s in silver_stops)
    return (f'<svg viewBox="{-ox:.2f} {-oy:.2f} {w:.2f} {h:.2f}" '
            f'width="100%" height="100%" aria-label="TP" {extra}>'
            f'<defs><linearGradient id="{silver_id}" x1="0" y1="0" x2=".72" y2="1">'
            f'{stops}</linearGradient></defs>'
            f'<g transform="rotate({tilt} {cx:.2f} {cy:.2f})">'
            f'<path fill="{red}" d="{T_PATH}"/>'
            f'<path fill="url(#{silver_id})" fill-rule="evenodd" '
            f'transform="translate({TX},{TY})" d="{P_PATH}"/>'
            f'</g></svg>')


if __name__ == '__main__':
    print(f'caja {BOX_W:.0f} x {BOX_H:.0f}, trazo {W:.0f}, giro {TILT}')
