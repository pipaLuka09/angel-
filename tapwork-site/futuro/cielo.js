/*
  The live shot behind every page, as a fixed-camera time-lapse.

  The photo of the grandmother (bg--photo) is redrawn by the GPU from three
  textures cut out of it (futuro/abuela/): the street with a clean sky, the
  street as shot, and masks for the sky and each palm. Clouds drift across the
  sky at time-lapse speed and dim the light when one crosses the sun, the
  palm fronds sway and shiver in the wind, and near the bottom of the page the
  afternoon turns to evening.

  Over it a second canvas flies real gulls (photos cut into body and wings so
  they flap in bursts, glide and bank through their turns) and airliners that
  cross on a straight track, growing as they pass overhead, leaving contrails.
  Planes and distant flocks are high up, so the sky mask hides them behind the
  towers and palms; the gulls fly below, in front of the street. She stands in
  front of all of it (an <img> above the canvas).

  Behind a video background (the --fondo build) only the flyers are drawn,
  over the clip, once the reader has scrolled past it. With
  prefers-reduced-motion nothing moves: the shot is drawn once, still.
*/
(function () {
  var bg = document.querySelector('.bg');
  var fxc = bg && bg.querySelector('.sky-fx');
  if (!fxc) return;
  var glc = bg.querySelector('.sky-gl');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var overVideo = !!bg.querySelector('video');
  var onPhoto = bg.classList.contains('bg--photo');
  var ctx = fxc.getContext('2d');
  var far = document.createElement('canvas'), fctx = far.getContext('2d');
  var W = 0, H = 0, DPR = 1, small = false;
  var AR = 2000 / 1116, F = { x: 0, y: 0, w: 0, h: 0 };  // where the photo sits on screen (cover)

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function img(src) { var im = new Image(); im.decoding = 'async'; im.src = src; return im; }
  function ready(im) { return im && im.complete && im.naturalWidth > 0; }

  /* ------------------------------------------------- noise (GLSL and JS) */
  // The same value noise on both sides, so the page knows when a cloud is
  // over the sun and can dim the flare and her along with the street.
  var NOISE = [
    'float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }',
    'float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= .5; } return v; }'
  ].join('\n');
  function fract(x) { return x - Math.floor(x); }
  function hash(x, y) {
    var a = fract(x * .1031), b = fract(y * .1031), c = a;
    var d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
    a += d; b += d; c += d;
    return fract((a + b) * c);
  }
  function noise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var top = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * ux;
    var bot = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * ux;
    return top + (bot - top) * uy;
  }
  function fbm(x, y) {
    var v = 0, a = .5;
    for (var i = 0; i < 5; i++) { v += a * noise(x, y); var nx = 1.6 * x - 1.2 * y; y = 1.2 * x + 1.6 * y; x = nx; a *= .5; }
    return v;
  }
  // Cloud cover at a point of the photo (uv, y down), as the shader computes it.
  var SUN = [.617, .546];
  function cloudAt(u, v, t) {
    var px = u * AR * 2.3 + t * .09, py = v * 2.3 + t * .025;
    var wx = noise(px * .6 + t * .05, py * .6 + t * .05), wy = noise(px * .6 + 7.3, py * .6 + 7.3);
    px += .45 * wx; py += .45 * wy;
    var r = Math.hypot((u - .5) * AR, v - .5), cover = .6 + (.47 - .6) * smooth((r - .25) / .65);
    return smooth((fbm(px, py) - cover) / .2);
  }

  /* ------------------------------------------------------ the photo, live */
  var PALMS = [[.1651, .1436], [.1008, .7736], [.8372, .1002], [.8315, .8913], [.9265, .5451], [.3346, .9949]];
  var FS_PHOTO = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes; uniform vec4 uFrame; uniform float uT, uDusk, uLight;',
    'uniform sampler2D uPlate, uBase, uMask; uniform vec3 uPalm[6];',
    'const float AR = ' + AR.toFixed(4) + ';',
    NOISE,
    // x: how lit by the sun, y: cover. It looks a little toward the sun:
    // denser there means this point of the cloud is in its own shadow.
    'vec2 cloudAt(vec2 uv){',
    '  vec2 p = vec2(uv.x * AR, uv.y) * 2.3 + vec2(uT * .09, uT * .025);',
    '  p += .45 * vec2(noise(p * .6 + uT * .05), noise(p * .6 + 7.3));',
    '  float n = fbm(p);',
    '  float r = length((uv - .5) * vec2(AR, 1.));',
    '  float cover = mix(.6, .47, smoothstep(.25, .9, r));',   // thicker toward the horizon, at the rim of the lens
    '  vec2 ts = normalize((vec2(' + SUN[0] + ', ' + SUN[1] + ') - uv) * vec2(AR, 1.) + 1e-4);',
    '  float n2 = fbm(p + ts * .13);',
    '  return vec2(clamp(.55 + (n - n2) * 4.5, 0., 1.), smoothstep(cover, cover + .2, n)); }',
    'void main(){',
    '  vec2 uv = (vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - uFrame.xy) / uFrame.zw;',
    '  vec4 m = texture2D(uMask, uv);',
    '  vec3 col = texture2D(uPlate, uv).rgb;',
    '  if (m.r > .01) {',
    '    vec2 c = cloudAt(uv);',
    '    vec3 sh = mix(vec3(.64, .71, .82), vec3(.34, .27, .42), uDusk), li = mix(vec3(1., .99, .97), vec3(1., .74, .52), uDusk);',
    '    col = mix(col, mix(sh, li, c.x), c.y * .96 * m.r);',
    '  }',
    // Palms: each pixel looks up where its frond was before the wind turned
    // the crown, plus a fine shiver that grows toward the leaf tips.
    '  float id = floor(m.b * 255. / 30. + .5);',
    '  if (id > .5) {',
    '    vec3 pc = vec3(0.);',
    '    for (int i = 0; i < 6; i++) { if (abs(float(i + 1) - id) < .5) pc = uPalm[i]; }',
    '    vec2 rel = (uv - pc.xy) * vec2(AR, 1.);',
    '    float gust = noise(vec2(uT * .55, pc.z * 3.)) - .5;',
    '    float ang = (sin(uT * 2.2 + pc.z) * .65 + sin(uT * 3.7 + pc.z * 1.7) * .35) * .03 + gust * .07;',
    '    float cs = cos(ang), sn = sin(ang);',
    '    vec2 src = vec2(cs * rel.x + sn * rel.y, -sn * rel.x + cs * rel.y);',
    '    src += length(rel) * .03 * vec2(noise(uv * 55. + uT * 4.) - .5, noise(uv * 55. + 9. + uT * 4.) - .5);',
    '    vec2 suv = pc.xy + src / vec2(AR, 1.);',
    '    col = mix(col, texture2D(uBase, suv).rgb * (1. - gust * .08), texture2D(uMask, suv).g);',
    '  }',
    '  col *= uLight;',
    '  col = mix(col, col * vec3(1.06, .8, .68), uDusk * .55);',
    '  gl_FragColor = vec4(col, 1.); }'
  ].join('\n');

  var gl = null, U = {}, photoReady = false;
  var glScale = Math.min(devicePixelRatio || 1, fine ? 1.5 : 1.25) * (fine ? 1 : .8);
  function initPhotoGL() {
    if (!onPhoto || !glc) return;
    gl = glc.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return dropGL();
    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = shader(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }');
    var fs = shader(gl.FRAGMENT_SHADER, FS_PHOTO);
    if (!vs || !fs) return dropGL();
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return dropGL();
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var at = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uFrame', 'uT', 'uDusk', 'uLight', 'uPlate', 'uBase', 'uMask', 'uPalm'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    var pal = [];
    PALMS.forEach(function (p, i) { pal.push(p[0], p[1], i * 1.37 + .4); });
    gl.uniform3fv(U.uPalm, new Float32Array(pal));
    var left = 3;
    ['v/abuela/plate.jpg', 'v/abuela/fondo.jpg', 'v/abuela/masks.png'].forEach(function (s, i) {
      var im = new Image();
      im.onload = function () {
        if (!gl) return;
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (--left === 0) {
          gl.uniform1i(U.uPlate, 0); gl.uniform1i(U.uBase, 1); gl.uniform1i(U.uMask, 2);
          photoReady = true;
          drawPhoto(T);
          bg.classList.add('sky-on');
        }
      };
      im.src = s;
    });
    glc.addEventListener('webglcontextlost', function (e) { e.preventDefault(); dropGL(); });
  }
  // Without WebGL the photo stays as the still <img> under the canvas.
  function dropGL() { gl = null; photoReady = false; if (glc) glc.style.display = 'none'; bg.classList.remove('sky-on'); }

  var light = 1, dusk = 0;
  function drawPhoto(t) {
    if (!gl || !photoReady) return;
    gl.viewport(0, 0, glc.width, glc.height);
    gl.uniform2f(U.uRes, glc.width, glc.height);
    var k = glc.width / W;
    gl.uniform4f(U.uFrame, F.x * k, F.y * k, F.w * k, F.h * k);
    gl.uniform1f(U.uT, t); gl.uniform1f(U.uDusk, dusk); gl.uniform1f(U.uLight, light);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* -------------------------------------------------------------- gulls */
  // Real gulls seen from below (Unsplash). Each is cut at the shoulders: the
  // body stays, the wings turn about the shoulders and shorten as they rise or
  // fall, which is how a wingbeat reads from the ground. body: the point
  // between the wings; axis: the wing line; fwd: where the head points.
  var GULL = [
    { im: img('v/cielo/gaviota-lejos.webp'), body: [68, 27], axis: 0, fwd: -Math.PI / 2, bw: 9, span: 1 },
    { im: img('v/cielo/gaviota-1.webp'), body: [99, 69], axis: .557, fwd: -1.013, bw: 13, span: 1.15 },
    { im: img('v/cielo/gaviota-3.webp'), body: [122, 91], axis: .677, fwd: -.894, bw: 14, span: 1.2 }
  ];

  function drawGull(g, x, y, w, heading, e, bank, dim) {
    var im = g.im; if (!ready(im)) return;
    var s = w / im.naturalWidth, bx = g.body[0], by = g.body[1], A = g.axis, bw = g.bw;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(heading - g.fwd); ctx.scale(s, s); ctx.rotate(A);
    if (dim) ctx.filter = dim;
    for (var k = -1; k <= 1; k += 2) {
      ctx.save();
      ctx.beginPath(); ctx.rect(k < 0 ? -2000 : bw - 1.5, -2000, 2000 - bw + 1.5, 4000); ctx.clip();
      ctx.translate(k * bw, 0);
      // the wing on the outside of a turn is seen longer, the inside one shorter
      var fore = 1 - .42 * Math.pow(Math.abs(e), 1.2) - Math.max(0, k * bank) * .3;
      ctx.rotate(k * e * .26);
      ctx.scale(Math.max(.35, fore), 1);
      ctx.translate(-k * bw, 0);
      ctx.rotate(-A); ctx.drawImage(im, -bx, -by);
      ctx.restore();
    }
    ctx.save(); ctx.beginPath(); ctx.rect(-bw - .5, -2000, 2 * bw + 1, 4000); ctx.clip();
    ctx.rotate(-A); ctx.drawImage(im, -bx, -by);
    ctx.restore();
    ctx.restore();
  }

  function newGull() {
    var g = GULL[Math.random() * GULL.length | 0], d = rnd(.5, 1), dir = Math.random() < .5 ? 1 : -1;
    var w = (small ? .6 : 1) * (70 + 150 * d * d) * g.span;
    return {
      kind: 'gull', g: g, d: d, w: w, dir: dir, seed: rnd(0, 99),
      x: dir > 0 ? -w : W + w, y: H * rnd(.1, .62), h: (dir > 0 ? 0 : Math.PI) + rnd(-.35, .35), turn: 0,
      v: (small ? .65 : 1) * rnd(70, 120) * (.6 + d * .6),
      ph: rnd(0, 6.28), hz: rnd(2.4, 3.2), beats: Math.round(rnd(3, 7)), glide: 0,
      circling: Math.random() < .25 ? rnd(.35, .6) * (Math.random() < .5 ? 1 : -1) : 0, circleFor: rnd(3, 6)
    };
  }
  function stepGull(o, dt) {
    // Steering: a wandering turn rate, sometimes a slow circle like a gull
    // riding a thermal, otherwise pulled back to keep crossing the screen.
    var want = (noise(T * .3, o.seed) - .5) * 1.2;
    var home = o.dir > 0 ? 0 : Math.PI;
    if (o.circling) { want = o.circling; if ((o.circleFor -= dt) < 0) o.circling = 0; }
    else want += Math.atan2(Math.sin(home - o.h), Math.cos(home - o.h)) * .5;
    o.turn += (want - o.turn) * Math.min(1, dt * 1.6);
    o.h += o.turn * dt;
    // Wingbeats in bursts, then a glide with the wings held a little up.
    var e;
    if (o.glide > 0) {
      o.glide -= dt; e = .12 + .05 * Math.sin(T * 2 + o.seed);
      if (o.glide <= 0) { o.beats = Math.round(rnd(3, 7)); o.ph = 0; }
    } else {
      var before = Math.floor(o.ph / 6.2832);
      o.ph += dt * 6.2832 * o.hz; e = Math.sin(o.ph);
      if (Math.floor(o.ph / 6.2832) > before && --o.beats <= 0) o.glide = rnd(.9, 2.6);
    }
    var v = o.v * (o.glide > 0 ? .92 : 1.05);
    o.x += Math.cos(o.h) * v * dt; o.y += Math.sin(o.h) * v * dt;
    var bob = o.glide > 0 ? 0 : -e * o.w * .025;
    drawGull(o.g, o.x, o.y + bob, o.w, o.h, e, clamp(o.turn * .9, -.6, .6),
      dusk > .02 ? 'brightness(' + (1 - .55 * dusk).toFixed(2) + ') saturate(' + (1 - .3 * dusk).toFixed(2) + ')' : '');
    var m = o.w * 1.2;
    return o.x > -m * 1.6 && o.x < W + m * 1.6 && o.y > -m * 1.6 && o.y < H + m;
  }

  /* --------------------------------------------------- distant flocks */
  // Small birds far off: drawn silhouettes, flapping, behind the towers.
  function hazy(d) {
    var f = 1 - d, r = 18 + 120 * f, g = 26 + 140 * f, b = 38 + 170 * f;
    return 'rgba(' + (r * (1 - dusk * .5) | 0) + ',' + (g * (1 - dusk * .6) | 0) + ',' + (b * (1 - dusk * .5) | 0) + ',' + (.55 + .45 * d) + ')';
  }
  function newFlock() {
    var d = rnd(.15, .45), dir = Math.random() < .5 ? 1 : -1;
    var n = Math.round(rnd(4, 11));
    var vee = n > 4 && Math.random() < .45, size = (small ? .7 : 1) * (10 + 30 * d * d), birds = [];
    for (var i = 0; i < n; i++) {
      var r = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      birds.push({ ox: vee ? -r * 1.25 : rnd(-1.6, 1.6) * Math.sqrt(n), oy: vee ? side * r * .85 : rnd(-.8, .8) * Math.sqrt(n),
        ph: rnd(0, 6.3), hz: rnd(2.6, 3.6), glide: false, gt: rnd(.5, 3), bob: rnd(0, 6.3), s: rnd(.85, 1.15) });
    }
    return { kind: 'birds', d: d, dir: dir, size: size, birds: birds, x: dir > 0 ? -size * 6 : W + size * 6,
      y: H * rnd(.08, .5), v: dir * W * rnd(.03, .055), drift: rnd(-.04, .04) };
  }
  function wing(c, x, y, s, f, k) {
    var tip = -f * s * .3, el = -f * s * .1 + s * .02;
    c.moveTo(x + k * s * .03, y - s * .01);
    c.quadraticCurveTo(x + k * s * .13, y + el - s * .06, x + k * s * .22, y + el);
    c.quadraticCurveTo(x + k * s * .36, y + (el + tip) / 2 - s * .03, x + k * s * .5, y + tip);
    c.quadraticCurveTo(x + k * s * .34, y + (el + tip) / 2 + s * .05, x + k * s * .2, y + el + s * .05);
    c.quadraticCurveTo(x + k * s * .1, y + el * .5 + s * .06, x + k * s * .02, y + s * .05);
  }
  function stepFlock(o, dt, c) {
    o.x += o.v * dt; o.y += o.drift * Math.abs(o.v) * dt;
    c.fillStyle = hazy(o.d);
    for (var i = 0; i < o.birds.length; i++) {
      var b = o.birds[i];
      if ((b.gt -= dt) < 0) { b.glide = !b.glide; b.gt = b.glide ? rnd(.5, 1.5) : rnd(1, 3); }
      b.ph += dt * 6.2832 * b.hz;
      var f = b.glide ? .18 : Math.sin(b.ph), s = o.size * b.s;
      var bx = o.x + o.dir * b.ox * o.size * .9, by = o.y + b.oy * o.size * .8 + Math.sin(T * 1.3 + b.bob) * o.size * .12;
      c.beginPath(); wing(c, bx, by, s, f, 1); wing(c, bx, by, s, f, -1);
      c.ellipse(bx, by + s * .02, s * .075, s * .032, 0, 0, 6.2832); c.fill();
    }
    var span = o.size * (Math.sqrt(o.birds.length) * 2 + 3);
    return o.dir > 0 ? o.x - span < W : o.x + span > 0;
  }

  /* -------------------------------------------------------------- planes */
  // Airliners seen from below (Unsplash). They hold a straight track; one
  // passing close grows toward the middle of its pass and shrinks again, and
  // the contrails form a little behind the wings, then widen and fade.
  var JETS = [img('v/cielo/avion-1.webp'), img('v/cielo/avion-2.webp')];
  function newPlane(isFar) {
    var dir = Math.random() < .5 ? 1 : -1, L = isFar ? rnd(22, 30) : (small ? 58 : 84) * rnd(.9, 1.1);
    var ang = (dir > 0 ? 0 : Math.PI) + rnd(-.22, .22);
    var x0 = dir > 0 ? -L * 3 : W + L * 3, y0 = H * (isFar ? rnd(.06, .32) : rnd(.08, .42));
    return { kind: 'plane', far: isFar, L0: L, L: L, ang: ang, x0: x0, y0: y0, u: 0,
      dur: isFar ? rnd(55, 75) : rnd(20, 28), span: (W + L * 6) / Math.abs(Math.cos(ang)), x: x0, y: y0,
      jet: JETS[Math.random() * JETS.length | 0], trail: [[], []], acc: 0, wait: isFar ? rnd(0, 6) : rnd(2, 10) };
  }
  function drawPlane(c, p) {
    var co = Math.cos(p.ang), si = Math.sin(p.ang);
    c.save(); c.translate(p.x, p.y); c.rotate(p.ang);
    if (ready(p.jet)) {  // the photo points its nose up: a quarter turn points it along the track
      var jh = p.L * p.jet.naturalHeight / p.jet.naturalWidth;
      c.save(); c.rotate(Math.PI / 2);
      if (dusk > .02) c.filter = 'brightness(' + (1 - .5 * dusk).toFixed(2) + ')';
      c.drawImage(p.jet, -p.L / 2, -jh / 2, p.L, jh);
      c.restore();
    }
    if (dusk > .05) {  // navigation lights in the evening: red left, green right, white strobe
      c.scale(p.L, p.L); c.globalAlpha = dusk;
      c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(-.08, -.48, p.far ? .07 : .02, 0, 6.2832); c.fill();
      c.fillStyle = '#34c759'; c.beginPath(); c.arc(-.08, .48, p.far ? .07 : .02, 0, 6.2832); c.fill();
      if (T % 1.2 < .08) { c.fillStyle = '#fff'; c.beginPath(); c.arc(-.5, 0, p.far ? .1 : .03, 0, 6.2832); c.fill(); }
    }
    c.restore();
    return [[p.x + (.02 * co - .2 * si) * p.L, p.y + (.02 * si + .2 * co) * p.L],
            [p.x + (.02 * co + .2 * si) * p.L, p.y + (.02 * si - .2 * co) * p.L]];
  }
  function stepPlane(p, dt, c) {
    if (p.wait > 0) { p.wait -= dt; return true; }
    p.u += dt / p.dur;
    var u = Math.min(p.u, 1);
    p.x = p.x0 + Math.cos(p.ang) * p.span * u;
    p.y = p.y0 + Math.sin(p.ang) * p.span * u - (p.far ? 0 : Math.sin(Math.PI * u) * H * .04);
    p.L = p.L0 * (p.far ? 1 : .72 + .5 * Math.sin(Math.PI * u));
    var life = p.far ? 16 : 10, tint = dusk > 0 ? 'rgba(255,' + (240 - 50 * dusk | 0) + ',' + (235 - 80 * dusk | 0) + ',' : 'rgba(255,255,255,';
    c.lineCap = 'round';
    for (var e = 0; e < 2; e++) {
      var tr = p.trail[e];
      while (tr.length && T - tr[0][3] > life) tr.shift();
      for (var i = 1; i < tr.length; i++) {
        var age = T - tr[i][3], a = (p.far ? .5 : .62) * smooth(age / .6) * (1 - age / life);
        if (a <= .01) continue;
        c.strokeStyle = tint + a.toFixed(3) + ')';
        c.lineWidth = tr[i][2] * (p.far ? .1 : .035) + age * tr[i][2] * (p.far ? .04 : .02);
        c.beginPath(); c.moveTo(tr[i - 1][0], tr[i - 1][1]); c.lineTo(tr[i][0], tr[i][1]); c.stroke();
      }
    }
    if (p.u < 1) {
      var eng = drawPlane(c, p);
      if ((p.acc += dt) > .05) {
        p.acc = 0;
        p.trail[0].push([eng[0][0], eng[0][1], p.L, T]);
        p.trail[1].push([eng[1][0], eng[1][1], p.L, T]);
      }
    }
    return p.u < 1 || p.trail[0].length > 0;
  }

  /* -------------------------------------------------------------- frame */
  var skyCut = onPhoto ? img('v/abuela/cielo.png') : null;   // sky alpha: far flyers pass behind the towers
  var things = [], T = 0, last = 0, running = false, flip = false;

  function size() {
    var w = bg.clientWidth || innerWidth, h = bg.clientHeight || document.documentElement.clientHeight;
    // Mobile address bars change the height while scrolling; only a real
    // resize (a different width, or a big jump) re-lays the scene.
    if (w === W && Math.abs(h - H) < 120) return;
    W = w; H = h; small = W < 700;
    DPR = Math.min(devicePixelRatio || 1, 2);
    fxc.width = far.width = W * DPR; fxc.height = far.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    F.w = Math.max(W, H * AR); F.h = F.w / AR;
    F.x = (W - F.w) / 2; F.y = (H - F.h) / 2;
    if (onPhoto) {  // the CSS layers (her, the fallback still) sit exactly where the shader draws
      bg.style.setProperty('--fx', F.x + 'px'); bg.style.setProperty('--fy', F.y + 'px');
      bg.style.setProperty('--fw', F.w + 'px'); bg.style.setProperty('--fh', F.h + 'px'); bg.style.setProperty('--ft', '0px 0px');
    }
    if (glc) { glc.width = Math.max(2, W * glScale | 0); glc.height = Math.max(2, H * glScale | 0); }
    if (still || !running) drawPhoto(T);
  }
  function scrollS() { return scrollY / H; }
  function duskAt(S) {
    if (overVideo) return 0;
    var max = (document.documentElement.scrollHeight - H) / H;
    return .9 * smooth((S - (max - 1.3)) / 1.3) * clamp((max - 1) / 1.5, 0, 1);
  }

  function seed() {
    things = [newGull(), newFlock(), newPlane(false), newPlane(true)];
    if (fine) things.push(newGull(), newFlock());
    // one gull already over the street on the first screen
    var g = things[0]; g.x = W * (g.dir > 0 ? rnd(.1, .3) : rnd(.7, .9)); g.y = H * rnd(.15, .35);
    things[2].wait = rnd(1, 4);
  }

  var lastDusk = -1, lastSun = -1;
  function frame(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000 || 0, .05); last = now; T += dt;
    var S = scrollS();
    dusk = duskAt(S);
    if (overVideo) fxc.style.opacity = smooth((S - .45) / .5).toFixed(3);  // only once the clip is all sky
    if (onPhoto) {
      var cov = cloudAt(SUN[0], SUN[1], T);
      light += ((1 - .13 * cov) - light) * Math.min(1, dt * 2);
      if (Math.abs(dusk - lastDusk) > .004) { bg.style.setProperty('--dusk', dusk.toFixed(3)); lastDusk = dusk; }
      var sun = (1 - .85 * cov) * (1 - dusk);
      if (Math.abs(sun - lastSun) > .01) {
        bg.style.setProperty('--sun', sun.toFixed(2)); bg.style.setProperty('--light', light.toFixed(3)); lastSun = sun;
      }
      flip = !flip;
      if (fine || flip) drawPhoto(T);
    }
    // High up: planes and distant flocks, cut by the sky so the towers hide them.
    fctx.clearRect(0, 0, W, H);
    ctx.clearRect(0, 0, W, H);
    var i, o;
    for (i = 0; i < things.length; i++) {
      o = things[i];
      if (o.kind === 'gull') continue;
      if (!(o.kind === 'plane' ? stepPlane(o, dt, fctx) : stepFlock(o, dt, fctx)))
        things[i] = o.kind === 'plane' ? newPlane(o.far) : newFlock();
    }
    if (ready(skyCut)) {
      fctx.globalCompositeOperation = 'destination-in';
      fctx.drawImage(skyCut, F.x, F.y, F.w, F.h);
      fctx.globalCompositeOperation = 'source-over';
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(far, 0, 0); ctx.restore();
    // Low: the gulls, in front of the street.
    for (i = 0; i < things.length; i++) {
      o = things[i];
      if (o.kind === 'gull' && !stepGull(o, dt)) things[i] = newGull();
    }
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || document.hidden) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  size();
  initPhotoGL();
  addEventListener('resize', size);
  if (still) {
    // One still shot, redrawn when the page moves; nothing flies.
    var paint = function () { dusk = duskAt(scrollS()); bg.style.setProperty('--dusk', dusk.toFixed(3)); drawPhoto(20); };
    addEventListener('scroll', function () { requestAnimationFrame(paint); }, { passive: true });
    paint();
    return;
  }
  seed();
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  start();
})();
