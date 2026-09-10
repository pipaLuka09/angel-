"""Assemble the attendance sales video from assets that already exist.

No generated footage and no stock: the product shots are the project's own 3D
clips, the report is a real screen recording of the dashboard, and the cards are
rendered from brand/portada-plate-style HTML so they carry the real typeface.
Everything is normalised to 1080x1920 at 24fps before concatenation, because
ffmpeg's concat demuxer needs identical streams and the dashboard capture is a
different size and frame rate from the rest.
"""
import os, shutil, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
ADS, BRAND = os.path.join(ROOT, 'ads'), os.path.join(ROOT, 'brand')
CARDS = os.environ.get('TAPWORK_CARDS', '/tmp/vid')
WORK = os.path.join(ROOT, 'capture', '.sales')
W, H, FPS = 1080, 1920, 24
BG = '0x0b0c0f'

# (kind, source, seconds) in cut order
TIMELINE = [
    ('card',  os.path.join(CARDS, 'hook.png'), 3.0),
    ('clip',  os.path.join(ADS, 'asistencia_reel.mp4'), None),
    ('card',  os.path.join(CARDS, 'como.png'), 2.8),
    ('screen', (os.path.join(CARDS, 'dash-a.png'), os.path.join(CARDS, 'dash-b.png')), None),
    ('card',  os.path.join(CARDS, 'sin.png'), 2.8),
    ('card',  os.path.join(CARDS, 'fin.png'), 3.6),
]

V = ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
     '-crf', '20', '-preset', 'medium', '-r', str(FPS), '-an']


def run(args):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + args, check=True)


def build(i, kind, src, secs):
    out = os.path.join(WORK, '%02d.mp4' % i)
    if kind == 'card':
        run(['-loop', '1', '-t', str(secs), '-i', src,
             '-vf', 'scale=%d:%d,format=yuv420p' % (W, H)] + V + [out])
    elif kind == 'clip':
        run(['-i', src, '-vf', 'scale=%d:%d:force_original_aspect_ratio=increase,'
             'crop=%d:%d' % (W, H, W, H)] + V + [out])
    else:
        # Two full-resolution stills, hard cut. Playwright's recorder draws the page
        # at CSS-pixel size inside whatever canvas you request, so a 390px viewport
        # in a 780px video came out two thirds grey. And a dissolve between two
        # text-heavy screens ghosts every row -- the punch lands instantly anyway,
        # so the cut is both cleaner and truer to how it behaves.
        a, bb = src
        run(['-loop', '1', '-t', '2.3', '-i', a, '-loop', '1', '-t', '3.0', '-i', bb,
             '-filter_complex',
             '[0:v]scale=%d:%d:force_original_aspect_ratio=decrease,'
             'pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=%s[x];'
             '[1:v]scale=%d:%d:force_original_aspect_ratio=decrease,'
             'pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=%s[y];'
             '[x][y]concat=n=2:v=1:a=0'
             % (W, H, W, H, BG, W, H, W, H, BG)] + V + [out])
    return out


if __name__ == '__main__':
    shutil.rmtree(WORK, ignore_errors=True)
    os.makedirs(WORK)
    parts = [build(i, *t) for i, t in enumerate(TIMELINE)]
    listing = os.path.join(WORK, 'list.txt')
    open(listing, 'w').write('\n'.join("file '%s'" % p for p in parts))
    out = os.path.join(BRAND, 'tapwork-asistencia-venta.mp4')
    run(['-f', 'concat', '-safe', '0', '-i', listing, '-c', 'copy',
         '-movflags', '+faststart', out])
    shutil.rmtree(WORK, ignore_errors=True)
    print('%s · %d KB' % (os.path.basename(out), os.path.getsize(out) // 1024))
