/*
  The live sky behind every page. The GPU draws the sky and two layers of
  drifting clouds; a second canvas on top flies birds, planes with their
  contrails and a hot-air balloon through it. Scrolling climbs through that
  sky: the clouds and everything in them slide past at their own depth, and
  near the bottom of the page the afternoon turns to evening, with the first
  stars. Behind a video background (the --fondo build) only the birds and
  planes are drawn, over the clip, once the reader has scrolled past it.
  Nothing moves with prefers-reduced-motion: the sky is drawn still.
*/
(function () {
  var bg = document.querySelector('.bg');
  var fxc = bg && bg.querySelector('.sky-fx');
  if (!fxc) return;
  var glc = bg.querySelector('.sky-gl');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var overVideo = !!bg.querySelector('video');
  var lift = bg.classList.contains('bg--sky') ? 1.4 : 0;  // the inner pages start higher up
  var ctx = fxc.getContext('2d');
  var W = 0, H = 0, DPR = 1, small = false;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  /* ---------------------------------------------------------------- sky */
  var gl = null, U = {}, glScale = fine ? 0.6 : 0.4;
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'uniform vec2 uRes; uniform float uT, uAlt, uDusk;',
    'float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }',
    'const mat2 R = mat2(1.6, 1.2, -1.2, 1.6);',
    'float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = R * p; a *= .5; } return v; }',
    // One layer of cloud: x = how lit by the sun, y = coverage. Lighting looks
    // a little toward the sun: denser there means this point is in shadow.
    'vec2 cloud(vec2 uv, float asp, float sc, float par, float spd, float cover, vec2 sun, float seed){',
    '  vec2 p = vec2(uv.x * asp * .55, uv.y - uAlt * par) * sc + vec2(uT * spd + seed, seed * 1.7);',
    '  p += .35 * vec2(noise(p * .7 + uT * .02), noise(p * .7 + 5.2));',
    '  float n = fbm(p);',
    '  float n2 = fbm(p + normalize((sun - uv) * vec2(asp, 1.)) * .1 * sc);',
    '  return vec2(clamp(.58 + (n - n2) * 4.5, 0., 1.), smoothstep(cover, cover + .2, n)); }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes; float asp = uRes.x / uRes.y, k = uDusk;',
    '  vec3 col = mix(mix(vec3(.56, .77, .97), vec3(.95, .50, .30), k), mix(vec3(.06, .30, .74), vec3(.02, .05, .16), k),',
    '    smoothstep(-.1, 1.05, uv.y));',
    '  vec2 sun = vec2(.84, mix(1.02, .04, k));',
    '  float sd = length((uv - sun) * vec2(asp, 1.));',
    '  col += mix(vec3(1., .97, .88), vec3(1., .62, .32), k) * (.32 * exp(-sd * 3.2) + .22 * exp(-sd * 14.));',
    // Stars come out with the evening, behind the clouds.
    '  vec2 sp = floor(gl_FragCoord.xy / max(uRes.x / 900., 1.) + vec2(0., uAlt * 14.));',
    '  float st = step(.9965, hash(sp)) * (.55 + .45 * sin(uT * 2.3 + hash(sp + 7.) * 40.));',
    '  col += vec3(st) * smoothstep(.45, 1., k) * smoothstep(.15, .7, uv.y);',
    '  vec3 shade = mix(vec3(.64, .72, .86), vec3(.30, .26, .44), k), lit = mix(vec3(1.), vec3(1., .72, .52), k);',
    '  vec2 c = cloud(uv, asp, 2.6, .16, .010, .55, sun, 3.);',
    '  col = mix(col, mix(shade, lit, c.x) * .97, c.y * .72);',
    '  c = cloud(uv, asp, 1.25, .5, .022, .49 + .09 * uv.y, sun, 11.);',
    '  col = mix(col, mix(shade * .9, lit, c.x), c.y * .96);',
    '  gl_FragColor = vec4(col, 1.); }'
  ].join('\n');

  function initGL() {
    if (!glc || overVideo) return;
    gl = glc.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return dropGL();
    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = shader(gl.VERTEX_SHADER, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }');
    var fs = shader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return dropGL();
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return dropGL();
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var at = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uT', 'uAlt', 'uDusk'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    glc.addEventListener('webglcontextlost', function (e) { e.preventDefault(); dropGL(); });
    bg.classList.add('sky-on');
  }
  // Without WebGL the CSS gradient behind the canvas stays as the sky.
  function dropGL() { gl = null; if (glc) glc.style.display = 'none'; bg.classList.remove('sky-on'); }

  function drawSky(t, alt, dusk) {
    gl.viewport(0, 0, glc.width, glc.height);
    gl.uniform2f(U.uRes, glc.width, glc.height);
    gl.uniform1f(U.uT, t); gl.uniform1f(U.uAlt, alt); gl.uniform1f(U.uDusk, dusk);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ------------------------------------------------------------- flyers */
  // Everything that flies has a depth d (1 = near, slides with the page; small
  // = far, barely moves) and an anchor a: the scroll position, in screens, at
  // which it sits at height yf of the screen.
  function screenY(o, S) { return H * (o.yf + (o.a - S) * o.d); }
  function hazy(d, dusk) {  // far things fade into the sky
    var f = 1 - d, r = 18 + 120 * f, g = 26 + 140 * f, b = 38 + 170 * f;
    return 'rgba(' + (r * (1 - dusk * .5) | 0) + ',' + (g * (1 - dusk * .6) | 0) + ',' + (b * (1 - dusk * .5) | 0) + ',' + (.55 + .45 * d) + ')';
  }

  function newFlock(S, from) {
    var d = rnd(.22, 1), dir = Math.random() < .5 ? 1 : -1;
    var n = Math.max(2, Math.round(rnd(3, 12) * (1.15 - d * .45)));
    var vee = n > 4 && Math.random() < .4;
    var size = (small ? .7 : 1) * (12 + 46 * d * d);
    var birds = [];
    for (var i = 0; i < n; i++) {
      var r = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      birds.push({
        ox: vee ? -r * 1.25 : rnd(-1.6, 1.6) * Math.sqrt(n), oy: vee ? side * r * .85 : rnd(-.8, .8) * Math.sqrt(n),
        ph: rnd(0, 6.3), hz: rnd(2.1, 3.2) * (1.35 - d * .45), glide: false, gt: rnd(.5, 3), bob: rnd(0, 6.3), s: rnd(.85, 1.15)
      });
    }
    var f = { kind: 'birds', d: d, dir: dir, size: size, birds: birds, v: dir * W * rnd(.05, .09) * (.45 + d * .7), yf: rnd(.15, .8) };
    if (from === 'side') { f.a = S + rnd(-.3, .3); f.x = dir > 0 ? -size * 4 : W + size * 4; }
    else { f.a = S + (from === 'above' ? -rnd(.5, 1) : rnd(.7, 1.6)) / d; f.x = rnd(.1, .9) * W; }
    if (overVideo) f.a = Math.max(f.a, 1.1);
    return f;
  }

  function wing(x, y, s, f, k) {
    var tip = -f * s * .3, el = -f * s * .1 + s * .02;
    ctx.moveTo(x + k * s * .03, y - s * .01);
    ctx.quadraticCurveTo(x + k * s * .13, y + el - s * .06, x + k * s * .22, y + el);
    ctx.quadraticCurveTo(x + k * s * .36, y + (el + tip) / 2 - s * .03, x + k * s * .5, y + tip);
    ctx.quadraticCurveTo(x + k * s * .34, y + (el + tip) / 2 + s * .05, x + k * s * .2, y + el + s * .05);
    ctx.quadraticCurveTo(x + k * s * .1, y + el * .5 + s * .06, x + k * s * .02, y + s * .05);
  }
  function drawBird(x, y, s, f, dir) {
    ctx.beginPath();
    wing(x, y, s, f, 1); wing(x, y, s, f, -1);
    ctx.ellipse(x, y + s * .02, s * .075, s * .032, 0, 0, 6.2832);
    ctx.moveTo(x + dir * s * .1, y + s * .012); ctx.arc(x + dir * s * .085, y + s * .012, s * .024, 0, 6.2832);
    ctx.moveTo(x - dir * s * .06, y); ctx.lineTo(x - dir * s * .14, y - s * .015); ctx.lineTo(x - dir * s * .14, y + s * .05);
    ctx.fill();
  }
  function stepFlock(o, dt, dS, S, dusk) {
    o.x += o.v * dt + o.dir * dS * H * .22 * o.d;
    var y0 = screenY(o, S);
    ctx.fillStyle = hazy(o.d, dusk);
    for (var i = 0; i < o.birds.length; i++) {
      var b = o.birds[i];
      if ((b.gt -= dt) < 0) { b.glide = !b.glide; b.gt = b.glide ? rnd(.6, 1.8) : rnd(1, 3); }
      b.ph += dt * 6.2832 * b.hz;
      var f = b.glide ? .18 + .04 * Math.sin(b.ph * .2) : Math.sin(b.ph);
      var bx = o.x + o.dir * b.ox * o.size * .9, by = y0 + b.oy * o.size * .8 + Math.sin(T * 1.3 + b.bob) * o.size * .12;
      drawBird(bx, by, o.size * b.s, f, o.dir);
    }
    var span = o.size * (Math.sqrt(o.birds.length) * 2 + 2);
    return !(o.dir > 0 ? o.x - span > W : o.x + span < 0) && y0 > -H * .4 && y0 < H * 1.4;
  }

  function newPlane(S, far) {
    var dir = Math.random() < .5 ? 1 : -1;
    var p = {
      kind: 'plane', far: far, dir: dir, d: far ? .14 : rnd(.45, .6),
      L: far ? rnd(16, 22) : (small ? 70 : 110) * rnd(.85, 1.15),
      yf: far ? rnd(.12, .3) : rnd(.18, .5), trail: [[], []], acc: 0
    };
    p.ang = (dir > 0 ? 0 : Math.PI) - dir * rnd(.03, .09);
    p.v = W / (far ? rnd(28, 40) : rnd(11, 15));
    p.a = S + (far ? rnd(-.2, .5) : rnd(.6, 1.4) / p.d);
    if (overVideo) p.a = Math.max(p.a, 1.2);
    p.x = dir > 0 ? -p.L * 1.5 : W + p.L * 1.5;
    p.y = 0; p.climb = 0;
    return p;
  }
  function drawPlane(p, lights) {
    var c = Math.cos(p.ang), s = Math.sin(p.ang);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang); ctx.scale(p.L, p.L);
    ctx.fillStyle = p.far ? 'rgba(232,238,246,.9)' : '#c9d3df';
    ctx.beginPath();  // wings and tailplane
    [1, -1].forEach(function (k) {
      ctx.moveTo(.10, .045 * k); ctx.lineTo(-.17, .48 * k); ctx.lineTo(-.235, .48 * k); ctx.lineTo(-.06, .16 * k); ctx.lineTo(-.08, .045 * k);
      ctx.moveTo(-.36, .03 * k); ctx.lineTo(-.47, .17 * k); ctx.lineTo(-.51, .17 * k); ctx.lineTo(-.47, .03 * k);
    });
    ctx.fill();
    ctx.fillStyle = p.far ? '#f2f5f9' : '#e6ecf3';
    ctx.beginPath();  // fuselage
    ctx.moveTo(.5, 0); ctx.quadraticCurveTo(.47, .045, .38, .045); ctx.lineTo(-.40, .036); ctx.quadraticCurveTo(-.5, .02, -.54, 0);
    ctx.quadraticCurveTo(-.5, -.02, -.40, -.036); ctx.lineTo(.38, -.045); ctx.quadraticCurveTo(.47, -.045, .5, 0);
    ctx.fill();
    if (!p.far) {
      ctx.fillStyle = '#aeb9c6';
      ctx.beginPath(); ctx.ellipse(.05, .17, .065, .024, 0, 0, 6.2832); ctx.ellipse(.05, -.17, .065, .024, 0, 0, 6.2832); ctx.fill();
    }
    if (lights > .05) {  // navigation lights in the evening: red left, green right, white strobe
      var on = (T % 1.2) < .08;
      ctx.globalAlpha = lights;
      [['#ff3b30', -.48], ['#34c759', .48]].forEach(function (l) {
        ctx.fillStyle = l[0]; ctx.beginPath(); ctx.arc(-.2, l[1], .018 + (p.far ? .05 : 0), 0, 6.2832); ctx.fill();
      });
      if (on) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-.52, 0, p.far ? .09 : .03, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    return [[p.x + (.02 * c - .17 * s) * p.L, p.y + (.02 * s + .17 * c) * p.L],
            [p.x + (.02 * c + .17 * s) * p.L, p.y + (.02 * s - .17 * c) * p.L]];
  }
  function stepPlane(p, dt, dS, S, dusk) {
    p.x += Math.cos(p.ang) * p.v * dt + p.dir * dS * H * .3 * p.d;
    p.climb += Math.sin(p.ang) * p.v * dt;
    p.y = screenY(p, S) + p.climb;
    var shift = S * H * p.d;
    // Contrails: a point every 50 ms behind each engine, kept in sky
    // coordinates so they stay put as the page scrolls.
    var life = p.far ? 14 : 9, tint = dusk > 0 ? 'rgba(255,' + (240 - 50 * dusk | 0) + ',' + (235 - 80 * dusk | 0) + ',' : 'rgba(255,255,255,';
    for (var e = 0; e < 2; e++) {
      var tr = p.trail[e];
      while (tr.length && T - tr[0][2] > life) tr.shift();
      ctx.lineCap = 'round';
      for (var i = 1; i < tr.length; i++) {
        var age = T - tr[i][2];
        var a = (p.far ? .5 : .6) * smooth(age / .5) * (1 - age / life);
        if (a <= .01) continue;
        ctx.strokeStyle = tint + a.toFixed(3) + ')';
        ctx.lineWidth = p.L * (p.far ? .12 : .03) + age * p.L * (p.far ? .05 : .016);
        ctx.beginPath(); ctx.moveTo(tr[i - 1][0], tr[i - 1][1] - shift); ctx.lineTo(tr[i][0], tr[i][1] - shift); ctx.stroke();
      }
    }
    var eng = drawPlane(p, dusk);
    var gone = p.dir > 0 ? p.x - p.L > W : p.x + p.L < 0;
    if (!gone && (p.acc += dt) > .05) {
      p.acc = 0;
      p.trail[0].push([eng[0][0], eng[0][1] + shift, T]);
      p.trail[1].push([eng[1][0], eng[1][1] + shift, T]);
    }
    return !gone || p.trail[0].length > 0;
  }

  function newBalloon(S) {
    return { kind: 'balloon', d: .32, r: small ? 15 : 22, yf: rnd(.3, .55), a: S + rnd(.8, 1.6) / .32,
      x: rnd(.12, .3) * W * (Math.random() < .5 ? 1 : 3.2), v: rnd(4, 9) * (Math.random() < .5 ? 1 : -1), ph: rnd(0, 6) };
  }
  function stepBalloon(o, dt, dS, S, dusk) {
    o.x += o.v * dt;
    var r = o.r, x = o.x, y = screenY(o, S) + Math.sin(T * .5 + o.ph) * r * .15;
    ctx.save();
    ctx.globalAlpha = .92;
    ctx.beginPath();
    ctx.moveTo(x - r * .24, y + r * 1.02);
    ctx.bezierCurveTo(x - r * .75, y + r * .7, x - r * 1.04, y + r * .3, x - r, y - r * .1);
    ctx.arc(x, y - r * .1, r, Math.PI, 0);
    ctx.bezierCurveTo(x + r * 1.04, y + r * .3, x + r * .75, y + r * .7, x + r * .24, y + r * 1.02);
    ctx.closePath();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#d61f12'; ctx.fillRect(x - r * 1.1, y - r * 1.2, r * 2.2, r * 2.3);
    ctx.fillStyle = '#eef1f5';
    ctx.beginPath(); ctx.ellipse(x - r * .55, y, r * .14, r * 1.3, 0, 0, 6.2832); ctx.ellipse(x + r * .25, y, r * .16, r * 1.3, 0, 0, 6.2832); ctx.fill();
    var g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(10,20,50,.45)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 1.1, y - r * 1.2, r * 2.2, r * 2.3);
    if (dusk > 0) { ctx.fillStyle = 'rgba(40,20,60,' + (dusk * .5).toFixed(3) + ')'; ctx.fillRect(x - r * 1.1, y - r * 1.2, r * 2.2, r * 2.3); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,30,30,.7)'; ctx.lineWidth = Math.max(.6, r * .03);
    ctx.beginPath(); ctx.moveTo(x - r * .22, y + r * 1.03); ctx.lineTo(x - r * .1, y + r * 1.3); ctx.moveTo(x + r * .22, y + r * 1.03); ctx.lineTo(x + r * .1, y + r * 1.3); ctx.stroke();
    ctx.fillStyle = '#5a3b22'; ctx.fillRect(x - r * .12, y + r * 1.28, r * .24, r * .18);
    ctx.restore();
    var sy = screenY(o, S);
    return x > -r * 3 && x < W + r * 3 && sy > -H * .6 && sy < H * 1.8;
  }

  /* -------------------------------------------------------------- frame */
  var things = [], T = 0, last = 0, lastS = null, running = false, flip = false;
  var nFlocks = fine ? 4 : 3;

  function size() {
    var w = innerWidth, h = document.documentElement.clientHeight;
    // Mobile address bars change the height while scrolling; only a real
    // resize (a different width, or a big jump) re-lays the sky.
    if (w === W && Math.abs(h - H) < 120) return;
    W = w; H = h; small = W < 700;
    DPR = Math.min(devicePixelRatio || 1, 2);
    fxc.width = W * DPR; fxc.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (glc) { glc.width = Math.max(2, W * glScale | 0); glc.height = Math.max(2, H * glScale | 0); }
  }
  function scrollS() { return scrollY / H + lift; }
  function duskAt(S) {
    if (overVideo) return 0;
    var max = (document.documentElement.scrollHeight - H) / H + lift;
    return .9 * smooth((S - (max - 1.3)) / 1.3) * clamp((max - lift - 1) / 1.5, 0, 1);
  }

  function seed(S) {
    things = [];
    for (var i = 0; i < nFlocks; i++) things.push(newFlock(S, i === 0 ? 'side' : 'below'));
    things[0].x = W * rnd(.15, .4); things[0].a = S + (overVideo ? 1.2 : .05);
    things.push(newPlane(S, false), newPlane(S, true), newBalloon(S));
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min((now - last) / 1000 || 0, .05); last = now; T += dt;
    var S = scrollS(), dS = lastS === null ? 0 : S - lastS; lastS = S;
    var dusk = duskAt(S);
    if (overVideo) fxc.style.opacity = smooth((S - .45) / .5).toFixed(3);  // only once the clip is all sky
    flip = !flip;
    if (gl && (fine || flip)) drawSky(T, S, dusk);
    ctx.clearRect(0, 0, W, H);
    things.sort(function (a, b) { return a.d - b.d; });
    for (var i = 0; i < things.length; i++) {
      var o = things[i], alive;
      if (o.kind === 'birds') alive = stepFlock(o, dt, dS, S, dusk);
      else if (o.kind === 'plane') alive = stepPlane(o, dt, dS, S, dusk);
      else alive = stepBalloon(o, dt, dS, S, dusk);
      if (!alive) {
        if (o.kind === 'birds') things[i] = newFlock(S, screenY(o, S) > H ? 'above' : Math.random() < .5 ? 'side' : 'below');
        else if (o.kind === 'plane') things[i] = newPlane(S, o.far);
        else things[i] = newBalloon(S);
      }
    }
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || document.hidden) return;
    running = true; last = performance.now(); requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  size();
  initGL();
  if (still) {
    // One still sky, redrawn when the page moves; nothing flies.
    var paint = function () { size(); if (gl) drawSky(40, scrollS(), duskAt(scrollS())); };
    addEventListener('scroll', function () { requestAnimationFrame(paint); }, { passive: true });
    addEventListener('resize', paint);
    paint();
    return;
  }
  seed(scrollS());
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  start();
})();
