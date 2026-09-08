"""Build the Facebook page cover, as a still and as a video.

Facebook crops the cover differently on desktop and on phones, and the profile
picture sits over its bottom-left corner on desktop. So everything that has to be
read lives inside the central ~1100px and clear of that corner: the text column at
x300, the product at x790, nothing out at the edges.

The video version cycles through the product clips so the page opens on something
moving rather than a still.
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
ADS = os.path.join(ROOT, 'ads')
OUT = os.path.join(ROOT, 'brand')
# The text column is rendered from brand/portada-plate.html through a headless
# browser, so it uses the real Archivo rather than whatever font this box happens
# to have installed.
PLATE = os.environ.get('TAPWORK_PLATE', '/tmp/brand/plate.png')

W, H = 1640, 856
BOX = 560                     # the product square
PX, PY = 790, (H - BOX) // 2
BG = '0x0b0c0f'

# Attendance and gyms lead, per the merchant's priority.
ORDER = ['asistencia', 'gym', 'resenas', 'menu', 'tarjeta', 'mascotas', 'wifi']

# The feed clip is 1080x1350 with the product anchored high; this square lands on it.
CROP = 'crop=1080:1080:0:100,scale=%d:%d:flags=lanczos' % (BOX, BOX)


def segment(key, out):
    subprocess.run([
        'ffmpeg', '-y', '-loglevel', 'error',
        '-i', os.path.join(ADS, '%s_feed.mp4' % key), '-i', PLATE,
        '-filter_complex',
        '[0:v]%s[p];'
        'color=c=%s:s=%dx%d:r=24[bg];'
        '[bg][p]overlay=%d:%d:shortest=1[o];'
        '[o][1:v]overlay=0:0[v]' % (CROP, BG, W, H, PX, PY),
        '-map', '[v]', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-crf', '20', '-preset', 'medium', '-r', '24', out,
    ], check=True)


def still(key, out):
    """Compose the static cover by hand.

    Doing this in one ffmpeg graph kept losing the product: a bare color source has
    no timeline of its own, so the single frame -frames:v 1 grabs is whatever the
    overlay had at t=0, which is the empty background. Pulling the frame out first
    and pasting it is deterministic.
    """
    from PIL import Image
    tmp = out + '.frame.png'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '1.2',
                    '-i', os.path.join(ADS, '%s_feed.mp4' % key),
                    '-frames:v', '1', tmp], check=True)
    shot = Image.open(tmp).convert('RGB').crop((0, 100, 1080, 1180)).resize((BOX, BOX), Image.LANCZOS)
    canvas = Image.new('RGB', (W, H), (11, 12, 15))
    canvas.paste(shot, (PX, PY))
    plate = Image.open(PLATE).convert('RGBA')
    canvas.paste(plate, (0, 0), plate)
    canvas.save(out)
    os.remove(tmp)


if __name__ == '__main__':
    work = os.path.join(ROOT, 'capture', '.cover')
    os.makedirs(work, exist_ok=True)
    parts = []
    for k in ORDER:
        f = os.path.join(work, '%s.mp4' % k)
        segment(k, f)
        parts.append(f)
    listing = os.path.join(work, 'list.txt')
    open(listing, 'w').write('\n'.join("file '%s'" % p for p in parts))
    video = os.path.join(OUT, 'tapwork-portada-video.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
                    '-i', listing, '-c', 'copy', '-movflags', '+faststart', video], check=True)
    still(ORDER[0], os.path.join(OUT, 'tapwork-portada.png'))
    for p in parts:
        os.remove(p)
    os.remove(listing); os.rmdir(work)
    print('portada  %d KB' % (os.path.getsize(os.path.join(OUT, 'tapwork-portada.png')) // 1024))
    print('video    %d KB' % (os.path.getsize(video) // 1024))
