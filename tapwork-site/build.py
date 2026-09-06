import base64, json, os, html
from urllib.parse import quote
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(ROOT, 'img1080')
REF = os.path.join(ROOT, 'refvideo')

# The 1080 product stills come from the capture pipeline (capture_hires.mjs + the
# grading pass) and live in img1080/. Nothing is regenerated here.

def b64(path, mime):
    return 'data:' + mime + ';base64,' + base64.b64encode(open(path, 'rb').read()).decode()

def wa(text):
    return 'https://wa.me/593967794882?text=' + quote(text)

# tint = the glow the poster gallery throws behind each piece, taken from the scene itself
products = [
    dict(id='menu', img='menu', label='menú digital', kind='hablador nfc para mesa', client='restaurantes y cafeterías',
         headline='un menú que se actualiza sin reimprimir nada.',
         benefit='el cliente ve el menú actualizado sin pedir la carta. tú cambias precios y platos desde tu celular.',
         cta='quiero un menú digital', real='', code='TW-01 · MENU', tint='#e2761f'),
    dict(id='resenas', img='resenas', label='reseñas de google', kind='tarjeta nfc de reseñas', client='cualquier negocio con local físico',
         headline='reseñas de 5 estrellas, en el momento justo.',
         benefit='tu cliente acerca el celular y deja una reseña en google al instante, justo cuando la experiencia fue buena.',
         cta='quiero más reseñas', real='', code='TW-02 · GOOGLE', tint='#2f7de1'),
    dict(id='whatsapp', img='dober', label='pedidos por whatsapp', kind='acrílico nfc / qr', client='restaurantes y tiendas',
         headline='pedidos directos a tu whatsapp, sin apps extra.',
         benefit='el cliente escanea o acerca el celular y arma su pedido directo por whatsapp, listo para confirmar.',
         cta='quiero pedidos por whatsapp', real='döber', code='TW-03 · WHATSAPP', tint='#25a55a'),
    dict(id='tarjeta', img='tarjeta', label='tarjeta de presentación', kind='tarjeta nfc', client='profesionales y equipos de venta',
         headline='tu contacto y tu portafolio, en un toque.',
         benefit='comparte tu contacto y tu página con un toque, sin imprimir tarjetas ni dictar tu número.',
         cta='quiero mi tarjeta nfc', real='tania sánchez', code='TW-04 · TARJETA', tint='#c8a24c'),
    dict(id='llavero', img='llavero', label='página web', kind='llavero nfc', client='negocios con instagram o página propia',
         headline='tu instagram o tu página, a un toque de distancia.',
         benefit='el cliente acerca el celular al llavero y tu instagram (o tu página) se abre solo: sin qr, sin buscar el nombre, sin escribir nada.',
         cta='quiero mi llavero nfc', real='döber', code='TW-05 · LLAVERO', tint='#e8531f'),
    dict(id='asistencia', img='asistencia', label='asistencia laboral', kind='gafete nfc', client='negocios con personal en turnos',
         headline='marcación con un toque, reporte listo para exportar.',
         benefit='tu equipo marca entrada y salida con su gafete nfc; tú exportas el reporte cuando quieras.',
         cta='quiero control de asistencia', real='', code='TW-06 · GAFETE', tint='#d33a2a'),
    dict(id='wifi', img='wifi', label='wi-fi y redes', kind='disco nfc de wi-fi', client='restaurantes, hoteles y salas de espera',
         headline='un toque y tu cliente ya está conectado.',
         benefit='tu cliente se conecta al wi-fi con un toque, sin escribir contraseñas ni pedirlas al mesero.',
         cta='quiero wi-fi por nfc', real='', code='TW-07 · WIFI', tint='#2fa36b'),
    dict(id='pagos', img='pago', label='pagos y sugerencias', kind='acrílico nfc de pago', client='restaurantes y servicios',
         headline='cobra o recibe propinas con un enlace de pago.',
         benefit='tu cliente paga o deja una propina acercando el teléfono, sin llamar al mesero.',
         cta='quiero cobrar por nfc', real='', code='TW-08 · PAGO', tint='#e02a8f'),
    dict(id='gimnasios', img='gym', label='gimnasios', kind='lector nfc para máquinas', client='gimnasios y estudios',
         headline='cada máquina, registrada con un toque.',
         benefit='tu socio acerca el teléfono al lector de la máquina y registra su serie al instante, sin apps ni papel.',
         cta='quiero lectores nfc para mi gimnasio', real='', code='TW-09 · GYM', tint='#d9452c'),
    dict(id='mascotas', img='mascotas', label='mascotas', kind='collar nfc', client='dueños de mascotas',
         headline='la ficha médica de tu mascota, a un toque de distancia.',
         benefit='quien encuentre a tu mascota acerca el celular al dije del collar y ve su ficha médica, vacunas y tu contacto al instante, sin apps.',
         cta='quiero el collar de mi mascota', real='milo', code='TW-10 · COLLAR', tint='#4f9a4a'),
    dict(id='stickers', img='sticker', label='stickers', kind='sticker nfc', client='marcas con productos de superficie curva',
         headline='un sticker que se adapta a cualquier superficie curva.',
         benefit='va sobre botellas, cascos, laptops o autos y abre tu instagram o tu tienda con un toque. sin qr, sin apps.',
         cta='quiero mi sticker nfc', real='enemy®', code='TW-11 · STICKER', tint='#3aa8a0'),
    dict(id='acrilico', img='acrilico', label='acrílico reutilizado', kind='chip nfc sobre tu acrílico actual', client='negocios que ya tienen acrílicos o señalética',
         headline='convierte el acrílico que ya tienes en uno inteligente.',
         benefit='no hay que botar nada: le pegamos el chip nfc por detrás al acrílico que ya usas y queda listo para abrir tu menú, tu pago o tu reseña con un toque.',
         cta='quiero convertir mis acrílicos', real='', code='TW-12 · UPGRADE', tint='#2bb6c9'),
]

for p in products:
    p['src'] = b64(os.path.join(IMG, p['img'] + '.webp'), 'image/webp')
    p['wa'] = wa('Hola, ' + p['cta'])
    p['productName'] = p['kind'] + (' — ejemplo real (' + p['real'] + ')' if p['real'] else '')

pj = [dict(id=p['id'], img=p['src'], label=p['label'], kind=p['kind'], client=p['client'], headline=p['headline'],
           benefit=p['benefit'], real=p['real'], code=p['code'], tint=p['tint'], cta=p['cta'], wa=p['wa'],
           productName=p['productName']) for p in products]

rail = '\n'.join(
    f'    <a href="#p-{p["id"]}" data-i="{i}"><span class="dot"></span>{html.escape(p["label"])}</a>'
    for i, p in enumerate(products))

tpl = open(os.path.join(ROOT, 'template.html'), encoding='utf-8').read()
webm = b64(os.path.join(REF, 'hero-1080.webm'), 'video/webm')
mp4 = b64(os.path.join(REF, 'hero-1080-b.mp4'), 'video/mp4')
poster_img = Image.open(os.path.join(REF, 'hero-check.png')).convert('RGB').resize((1280, 720), Image.LANCZOS)
poster_img.save(os.path.join(IMG, 'poster.webp'), 'WEBP', quality=72)
poster = b64(os.path.join(IMG, 'poster.webp'), 'image/webp')

out = (tpl.replace('__VIDEO_WEBM__', webm)
          .replace('__VIDEO_MP4__', mp4)
          .replace('__POSTER__', poster)
          .replace('__RAIL_LEFT__', rail)
          .replace('__COUNT__', str(len(products)))
          .replace('__PRODUCTS_JSON__', json.dumps(pj, ensure_ascii=False)))
for token in ('__VIDEO_WEBM__', '__VIDEO_MP4__', '__POSTER__', '__RAIL_LEFT__', '__COUNT__', '__PRODUCTS_JSON__'):
    assert token not in out, 'unreplaced placeholder: ' + token
open(os.path.join(ROOT, 'tapwork-nfc.html'), 'w', encoding='utf-8').write(out)
print('built', len(out) // 1024, 'KB ·', len(products), 'products')
