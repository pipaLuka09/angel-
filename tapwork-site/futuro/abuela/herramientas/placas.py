# Build the textures for the live photo from the generated shot:
#   plate.jpg  - the street without her, palms or clouds (clean sky behind)
#   masks.png  - R: sky, G: palm fronds, B: palm id (for the wind), A: 255
#   cielo.png  - sky (minus palms) as alpha, to hide far flyers behind buildings
import sys, json, cv2, numpy as np
src, fondo, out = sys.argv[1], sys.argv[2], sys.argv[3]
im = cv2.imread(src); base = cv2.imread(fondo); h, w = im.shape[:2]
woman = cv2.imread(sys.argv[4], 0) > 128
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
H, Sa, V = [hsv[..., i].astype(int) for i in range(3)]

palm = ((H > 28) & (H < 95) & (Sa > 45) & (V > 25) & ~woman).astype(np.uint8)
palm = cv2.morphologyEx(palm, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(palm)
for i in range(1, n):
    if st[i, 4] < 300: palm[lab == i] = 0

sm = cv2.bilateralFilter(im, 9, 40, 9)
seeds = [(800, 150), (1250, 380), (1550, 120), (330, 330), (420, 640), (1700, 640), (820, 450), (1000, 90),
         (1350, 470), (280, 660), (300, 760), (1700, 740), (1740, 840), (560, 230), (330, 590), (360, 700), (300, 620), (1660, 560), (1640, 640), (1720, 700), (1600, 600)]
sky = np.zeros((h + 2, w + 2), np.uint8)
for (x, y) in seeds:
    if not woman[y, x]:
        cv2.floodFill(sm.copy(), sky, (x, y), 0, (6, 6, 6), (6, 6, 6), 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
sky = (sky[1:-1, 1:-1] > 0).astype(np.uint8)
# reflections in the glass that the flood ran into (hand-placed, 2000x1116 frame)
for poly in ([(30, 280), (390, 280), (390, 540), (30, 540)], [(580, 0), (950, 0), (950, 190), (880, 256)]):
    cv2.fillPoly(sky, [np.array(poly)], 0)
sky = cv2.morphologyEx(sky, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
top = np.zeros_like(woman); top[:640] = True
sky[woman & top] = 1   # behind her head and shoulders it is sky (the plate is filled there)
sky &= (palm == 0)

# plate: palms removed, then the sky made clean (no clouds)
pd = cv2.dilate(palm, np.ones((31, 31), np.uint8))
half = lambda a, it=cv2.INTER_AREA: cv2.resize(a, (w // 2, h // 2), interpolation=it)
fill = cv2.inpaint(half(base), half(pd, cv2.INTER_NEAREST), 7, cv2.INPAINT_TELEA)
fill = cv2.resize(fill, (w, h), interpolation=cv2.INTER_CUBIC)
k = cv2.GaussianBlur(pd.astype(np.float32), (0, 0), 4)[..., None]
plate = (base * (1 - k) + fill * k)
# clean sky: blue pixels of the sky only, spread over the whole frame and smoothed
skyx = (sky | (pd & cv2.dilate(sky, np.ones((61, 61), np.uint8)))).astype(np.uint8)
blue = skyx & (Sa > 80) & (H > 96) & (H < 122) & (V > 120) & ~woman
e = 8
small = cv2.resize(im, (w // e, h // e), interpolation=cv2.INTER_AREA)
bm = cv2.resize(blue.astype(np.uint8), (w // e, h // e), interpolation=cv2.INTER_AREA)
clean = cv2.inpaint(small, ((bm == 0) * 255).astype(np.uint8), 12, cv2.INPAINT_TELEA)
clean = cv2.GaussianBlur(clean, (0, 0), 6)
clean = cv2.resize(clean, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)
ks = cv2.GaussianBlur(skyx.astype(np.float32), (0, 0), 1.5)[..., None]
plate = plate * (1 - ks) + clean * ks
cv2.imwrite(out + 'plate.jpg', plate.astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 84, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])

# palm ids for the wind: one id per palm crown (dilated so a frond that swings
# out of its own outline still finds its palm)
pid = np.zeros((h, w), np.uint8); centers = []
g = cv2.dilate(palm, np.ones((61, 61), np.uint8))
n, lab, st, cen = cv2.connectedComponentsWithStats(g)
order = sorted(range(1, n), key=lambda i: -st[i, 4])[:8]
for j, i in enumerate(order):
    pid[(lab == i)] = j + 1
    ys, xs = np.where((lab == i) & (palm > 0))
    # pivot: the crown's point nearest the frame edge it grows from (the trunk side)
    cx, cy = xs.mean(), ys.mean()
    centers.append([round(cx / w, 4), round(cy / h, 4), int(st[i, 4])])
soft = cv2.GaussianBlur(palm.astype(np.float32), (0, 0), .8)
masks = np.dstack([(pid * 30).astype(np.uint8), (soft * 255).astype(np.uint8),
                   (cv2.GaussianBlur(skyx.astype(np.float32), (0, 0), 1.2) * 255).astype(np.uint8),
                   np.full((h, w), 255, np.uint8)])   # BGR(A) on disk: B=id, G=palm, R=sky
cv2.imwrite(out + 'masks.png', cv2.resize(masks, (w // 2, h // 2), interpolation=cv2.INTER_AREA))
alpha = cv2.GaussianBlur((sky & ~woman).astype(np.float32), (0, 0), 1.5)
cv2.imwrite(out + 'cielo.png', cv2.resize(np.dstack([np.full((h, w, 3), 255, np.uint8), (alpha * 255).astype(np.uint8)]),
            (w // 2, h // 2), interpolation=cv2.INTER_AREA))
json.dump(centers, open(out + 'palmeras.json', 'w'))
print(centers)
v = plate.astype(np.uint8).copy(); v[palm > 0] = (0, 255, 255)
cv2.imwrite('plate_view.jpg', cv2.resize(v, (1000, 558)))
