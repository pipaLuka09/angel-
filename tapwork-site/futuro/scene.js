/*
  Hero scene: looking straight up from the street, glass towers leaning in
  through a fisheye lens, and a Tap Work card held out to the camera.

  Everything is procedural (no textures to download): the sky, the clouds and
  the facades are shaders, the card face is drawn on a canvas. Scroll drives one
  value, `progress` 0..1: the card comes closer and turns to show its chip,
  and the afternoon turns into night, which is where the rest of the page lives.

  window.TWScene.create(canvas, { onReady }) -> { setProgress, setPointer, start, stop, frame }
*/
(function () {
  if (!window.THREE) return;
  var T = window.THREE;

  var GLSL_COMMON = [
    'uniform float uNight; uniform float uTime; uniform vec3 uSun;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }',
    'vec3 skyCol(vec3 d){',
    '  float h = clamp(d.y, 0.0, 1.0);',
    '  vec3 z = mix(vec3(0.06, 0.26, 0.68), vec3(0.010, 0.013, 0.024), uNight);',
    '  vec3 hz = mix(vec3(0.60, 0.79, 0.95), vec3(0.11, 0.035, 0.035), uNight);',
    '  vec3 c = mix(hz, z, pow(h, 0.5));',
    '  float s = max(dot(d, uSun), 0.0);',
    '  c += (1.0-uNight) * (vec3(1.0, 0.95, 0.86)*pow(s, 600.0)*5.0 + vec3(1.0, 0.92, 0.78)*pow(s, 10.0)*0.38);',
    '  c += uNight * vec3(0.93, 0.19, 0.07) * pow(max(1.0-h, 0.0), 6.0) * 0.35;',
    '  return c;',
    '}'
  ].join('\n');

  var SKY_FRAG = GLSL_COMMON + [
    '',
    'varying vec3 vDir;',
    'void main(){',
    '  vec3 d = normalize(vDir);',
    '  vec3 c = skyCol(d);',
    '  vec2 uv = d.xz / (d.y + 0.28) * 1.6 + vec2(uTime*0.012, uTime*0.004);',
    '  float cl = smoothstep(0.52, 0.88, fbm(uv*1.3));',
    '  float wisp = smoothstep(0.55, 0.9, fbm(uv*vec2(4.0, 0.9) + 7.0)) * 0.5;',
    '  vec3 cloudC = mix(vec3(1.0, 0.99, 0.97), vec3(0.16, 0.10, 0.11), uNight);',
    '  c = mix(c, cloudC, (cl*0.6 + wisp*0.35) * smoothstep(0.02, 0.35, d.y));',
    '  vec2 sg = floor(d.xz / (d.y + 0.6) * 220.0);',
    '  float star = step(0.9965, hash(sg)) * uNight * smoothstep(0.2, 0.7, d.y);',
    '  c += star * (0.6 + 0.4*sin(uTime*2.0 + hash(sg)*40.0));',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var SKY_VERT = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

  var TOWER_VERT = [
    'varying vec3 vWorld; varying vec3 vN; varying vec3 vLocal; varying vec3 vLN;',
    'void main(){',
    '  vLocal = position; vLN = normal;',
    '  vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz;',
    '  vN = normalize(mat3(modelMatrix) * normal);',
    '  gl_Position = projectionMatrix * viewMatrix * w;',
    '}'
  ].join('\n');

  var TOWER_FRAG = GLSL_COMMON + [
    '',
    'uniform float uSeed; uniform vec2 uCell;',
    'varying vec3 vWorld; varying vec3 vN; varying vec3 vLocal; varying vec3 vLN;',
    'void main(){',
    '  vec2 fu = abs(vLN.x) > 0.5 ? vLocal.zy : vLocal.xy;',
    '  vec2 g = fu / uCell; vec2 id = floor(g); vec2 f = fract(g);',
    '  float mull = max(max(step(f.x, 0.03), step(0.97, f.x)), step(f.y, 0.045));',
    '  vec3 n = normalize(vN);',
    '  vec3 V = normalize(vWorld - cameraPosition);',
    '  vec3 R = reflect(V, n);',
    '  vec3 refl = skyCol(normalize(vec3(R.x, abs(R.y), R.z)));',
    '  float fres = pow(1.0 - max(dot(-V, n), 0.0), 2.5);',
    '  float rnd = hash(id + uSeed*17.0);',
    '  vec3 tint = mix(vec3(0.03, 0.11, 0.22), mix(vec3(0.02, 0.14, 0.17), vec3(0.10, 0.12, 0.15), step(0.5, fract(uSeed*7.0))), step(0.45, uSeed));',
    '  vec3 deep = mix(tint, vec3(0.012, 0.016, 0.025), uNight);',
    '  vec3 glass = mix(deep, refl, 0.62 + 0.38*fres);',
    '  glass *= 0.93 + 0.12*rnd;',
    '  float lit = step(0.8, hash(id*1.7 + uSeed*3.1 + 3.0)) * uNight * 0.7;',
    '  glass += lit * mix(vec3(1.0, 0.80, 0.58), vec3(0.75, 0.88, 1.0), step(0.8, hash(id+9.0))) * (0.55 + 0.45*hash(id+5.0));',
    '  vec3 frameC = mix(vec3(0.78, 0.84, 0.9), vec3(0.03, 0.035, 0.045), uNight);',
    '  vec3 c = mix(glass, frameC, mull * 0.5);',
    '  c += pow(max(dot(R, uSun), 0.0), 180.0) * (1.0-uNight) * vec3(1.0, 0.95, 0.85) * 2.5;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var POST_FRAG = [
    'uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime; uniform float uNight;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main(){',
    '  vec2 p = vUv*2.0 - 1.0;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 q = vec2(p.x*asp, p.y);',
    '  float k = 0.22, r2 = dot(q, q), m2 = asp*asp + 1.0;',
    // Barrel: the centre is magnified and the rim squeezed, which is what makes
    // the towers bow inward like a street seen through a fisheye.
    '  vec2 d = p * (1.0 + k*r2) / (1.0 + k*m2);',
    '  float ca = 0.004 * r2;',
    '  vec3 c = vec3(texture2D(tDiffuse, (d*(1.0+ca))*0.5+0.5).r, texture2D(tDiffuse, d*0.5+0.5).g, texture2D(tDiffuse, (d*(1.0-ca))*0.5+0.5).b);',
    '  float vig = smoothstep(1.9, 0.35, length(q)*0.95);',
    '  c *= mix(0.42, 1.0, vig);',
    '  c = c / (1.0 + c*0.18) * 1.12;',
    '  c += (hash(vUv*uRes + fract(uTime)*100.0) - 0.5) * 0.03;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  function rnd(seed) {
    var s = seed;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // The Tap Work mark, same geometry as brand/tapwork-mark-dark.svg (100 units).
  function drawMark(ctx, x, y, s, ink) {
    var u = s / 100;
    ctx.save(); ctx.translate(x, y); ctx.scale(u, u);
    ctx.fillStyle = ink;
    ctx.fillRect(15, 26, 48, 13.5); ctx.fillRect(32.2, 26, 13.6, 45);
    ctx.strokeStyle = ink; ctx.lineWidth = 7.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(52.5, 48.75, 16.5, -0.73, 0.73); ctx.stroke();
    ctx.beginPath(); ctx.arc(51.5, 48.5, 30, -0.67, 0.67); ctx.stroke();
    ctx.fillStyle = '#ec3013'; roundRect(ctx, 15, 79, 70, 7.5, 3.75); ctx.fill();
    ctx.restore();
  }

  function cardCanvas(back) {
    var W = 1024, H = 646, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    roundRect(g, 0, 0, W, H, 46); g.save(); g.clip();
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1b1d22'); bg.addColorStop(0.55, '#0c0d10'); bg.addColorStop(1, '#141519');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // Fine brushed lines, the finish of a matte black PVC card.
    g.globalAlpha = 0.05; g.strokeStyle = '#fff';
    for (var i = 0; i < H; i += 3) { g.lineWidth = Math.random() * 0.8; g.beginPath(); g.moveTo(0, i); g.lineTo(W, i + 8); g.stroke(); }
    g.globalAlpha = 1;
    if (!back) {
      drawMark(g, 64, 52, 150, '#f2f3f4');
      g.fillStyle = '#f2f3f4'; g.font = '800 92px Archivo, sans-serif';
      g.fillText('Tap Work', 70, 330);
      g.fillStyle = '#9aa0a8'; g.font = '500 30px "JetBrains Mono", monospace';
      g.fillText('ACERCA TU CELULAR', 74, 384);
      // contactless glyph
      g.strokeStyle = '#f2f3f4'; g.lineWidth = 9; g.lineCap = 'round';
      for (var k = 0; k < 3; k++) { g.beginPath(); g.arc(870, 110, 22 + k * 22, -0.75, 0.75); g.stroke(); }
      g.fillStyle = '#ec3013'; g.fillRect(74, 548, 210, 12);
      g.fillStyle = '#7c828b'; g.font = '500 26px "JetBrains Mono", monospace';
      g.fillText('NFC · 13.56 MHz', 690, 562);
    } else {
      g.strokeStyle = 'rgba(236,48,19,.9)'; g.lineWidth = 6;
      for (var r = 0; r < 4; r++) { g.globalAlpha = 1 - r * 0.22; g.beginPath(); g.arc(W / 2, 290, 60 + r * 46, 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1;
      drawMark(g, W / 2 - 46, 244, 92, '#f2f3f4');
      g.fillStyle = '#f2f3f4'; g.font = '700 46px Archivo, sans-serif'; g.textAlign = 'center';
      g.fillText('Se abre solo.', W / 2, 560);
    }
    g.restore();
    var tex = new T.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  function create(canvas, opts) {
    opts = opts || {};
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    var small = Math.min(window.innerWidth, window.innerHeight) < 700;
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);

    var shared = { uNight: { value: 0 }, uTime: { value: 0 }, uSun: { value: new T.Vector3(-0.42, 0.72, -0.55).normalize() } };
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(108, 1, 0.1, 2000);

    var sky = new T.Mesh(new T.SphereGeometry(900, 48, 24),
      new T.ShaderMaterial({ uniforms: shared, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: T.BackSide, depthWrite: false }));
    scene.add(sky);

    // A ring of towers with a gap toward the sun, so the middle of the frame
    // stays open sky for the card, like the street-level reference.
    var R = rnd(7);
    var N = 10;
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2 + (R() - 0.5) * 0.25;
      var w = 12 + R() * 10, dd = 12 + R() * 10, h = 95 + R() * 85;
      var dist = 44 + R() * 20;
      var mat = new T.ShaderMaterial({
        uniforms: { uNight: shared.uNight, uTime: shared.uTime, uSun: shared.uSun,
          uSeed: { value: R() }, uCell: { value: new T.Vector2(2.2 + R() * 0.8, 3.2 + R() * 0.5) } },
        vertexShader: TOWER_VERT, fragmentShader: TOWER_FRAG
      });
      var m = new T.Mesh(new T.BoxGeometry(w, h, dd), mat);
      m.position.set(Math.cos(a) * dist, h / 2 - 40, Math.sin(a) * dist);
      m.rotation.y = -a + (R() - 0.5) * 0.9;
      scene.add(m);
    }

    // Dust and light motes drifting up the shaft between the towers.
    var PN = small ? 220 : 420, pos = new Float32Array(PN * 3);
    for (var j = 0; j < PN; j++) {
      var ang = R() * 6.283, rad = 8 + R() * 34;
      pos[j * 3] = Math.cos(ang) * rad; pos[j * 3 + 1] = 6 + R() * 70; pos[j * 3 + 2] = Math.sin(ang) * rad;
    }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var dot = document.createElement('canvas'); dot.width = dot.height = 64;
    var dg = dot.getContext('2d'), grd = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    dg.fillStyle = grd; dg.fillRect(0, 0, 64, 64);
    var motes = new T.Points(pg, new T.PointsMaterial({ color: 0xffffff, size: 0.35, map: new T.CanvasTexture(dot),
      transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(motes);

    // ---- the card ----
    var CW = 3.37, CH = 2.125;
    var holder = new T.Group(); scene.add(holder);
    var card = new T.Group(); holder.add(card);
    var shape = new T.Shape(), r = 0.14, hw = CW / 2, hh = CH / 2;
    shape.moveTo(-hw + r, -hh); shape.lineTo(hw - r, -hh); shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r); shape.quadraticCurveTo(hw, hh, hw - r, hh); shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r); shape.lineTo(-hw, -hh + r); shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    var body = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 6 }),
      new T.MeshBasicMaterial({ color: 0x2a2d33 }));
    body.position.z = -0.025; card.add(body);

    var faceMat = function (tex) {
      return new T.ShaderMaterial({
        uniforms: { map: { value: tex }, uSheen: { value: 0 }, uNight: shared.uNight },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform sampler2D map; uniform float uSheen; uniform float uNight; varying vec2 vUv;',
          'void main(){ vec4 t = texture2D(map, vUv);',
          '  float b = exp(-pow((vUv.x + vUv.y*0.55 - uSheen) * 5.0, 2.0));',
          '  vec3 sheenC = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.35, 0.22), uNight);',
          '  gl_FragColor = vec4(t.rgb + sheenC*b*0.16, t.a); }'
        ].join('\n'),
        transparent: true
      });
    };
    var front = new T.Mesh(new T.PlaneGeometry(CW, CH), faceMat(null));
    front.position.z = 0.027; card.add(front);
    var backFace = new T.Mesh(new T.PlaneGeometry(CW, CH), faceMat(null));
    backFace.rotation.y = Math.PI; backFace.position.z = -0.027; card.add(backFace);

    var rings = [];
    for (var q = 0; q < 3; q++) {
      var ring = new T.Mesh(new T.RingGeometry(0.97, 1.0, 96),
        new T.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      ring.position.z = 0.06; card.add(ring); rings.push(ring);
    }

    function paintCard() {
      front.material.uniforms.map.value = cardCanvas(false);
      backFace.material.uniforms.map.value = cardCanvas(true);
    }
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('800 92px Archivo'), document.fonts.load('500 26px "JetBrains Mono"')])
        .then(paintCard, paintCard);
    } else paintCard();

    // ---- post: fisheye + grain ----
    var rt = new T.WebGLRenderTarget(4, 4, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    var postU = { tDiffuse: { value: rt.texture }, uRes: { value: new T.Vector2(1, 1) }, uTime: shared.uTime, uNight: shared.uNight };
    var post = new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
      uniforms: postU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: POST_FRAG, depthTest: false, depthWrite: false
    }));
    var postScene = new T.Scene(); postScene.add(post);
    var postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var state = { p: 0, px: 0, py: 0, sx: 0, sy: 0, running: false, t0: performance.now(), last: 0 };

    function resize() {
      var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Portrait screens need a wider lens to keep the towers in frame.
      camera.fov = w < h ? 118 : 104;
      camera.updateProjectionMatrix();
      rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
      postU.uRes.value.set(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    function ease(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
    var up = new T.Vector3(0, 1, 0), fwd = new T.Vector3(), tmp = new T.Vector3();
    var camRight = new T.Vector3(), camUp = new T.Vector3();

    function frame(now) {
      var t = ((now || performance.now()) - state.t0) / 1000;
      shared.uTime.value = t;
      state.sx += (state.px - state.sx) * 0.06; state.sy += (state.py - state.sy) * 0.06;
      var p = state.p;
      shared.uNight.value = ease((p - 0.08) / 0.8);

      // Gaze: steep up at rest, settling a little toward the card as it nears.
      var pitch = (80 - 8 * ease(p / 0.7)) * Math.PI / 180, yaw = state.sx * 0.08;
      fwd.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      camera.position.set(0, 0, 0);
      camera.up.copy(up);
      camera.lookAt(tmp.copy(fwd));

      var near = ease(p / 0.55), flip = ease((p - 0.5) / 0.38);
      // A portrait lens is wider, so the card comes closer to keep its size.
      var dist = (8.6 - 3.0 * near - 1.4 * flip) * (camera.aspect < 1 ? 0.74 : 1);
      holder.position.copy(fwd).multiplyScalar(dist);
      // At rest the headline owns the lower left, so the card starts off to the
      // side (above it on a phone) and drifts to the centre as it comes in.
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);
      var off = 1 - near, portrait = camera.aspect < 1;
      holder.position.addScaledVector(camRight, off * (portrait ? 0.35 : 3.5));
      holder.position.addScaledVector(camUp, off * (portrait ? 2.5 : 1.1));
      // Same orientation as the lens, so the card reads upright on screen
      // however steeply the camera looks up.
      holder.quaternion.copy(camera.quaternion);
      card.rotation.set(
        (0.22 * (1 - near)) + state.sy * 0.22 + Math.sin(t * 0.9) * 0.04,
        (-0.32 * (1 - near)) + flip * Math.PI + state.sx * 0.3 + Math.sin(t * 0.6) * 0.07,
        (-0.14 * (1 - near)) + Math.sin(t * 0.5) * 0.02
      );
      card.position.y = Math.sin(t * 1.1) * 0.06;
      var sheen = ((card.rotation.y % (Math.PI * 2)) + Math.PI) / (Math.PI * 2) * 2.4 - 0.4 + Math.sin(t * 0.35) * 0.25;
      front.material.uniforms.uSheen.value = sheen; backFace.material.uniforms.uSheen.value = 1.6 - sheen;

      // NFC pulses, strongest while the card faces the camera.
      var facing = 1 - Math.min(1, Math.abs(Math.sin(card.rotation.y)) * 1.6);
      for (var i = 0; i < rings.length; i++) {
        var k = ((t * 0.55) + i / rings.length) % 1;
        var s = 1.0 + k * 2.2;
        rings[i].scale.set(s * 1.25, s, 1);
        rings[i].material.opacity = (1 - k) * 0.55 * facing * (0.35 + 0.65 * shared.uNight.value + 0.3);
      }

      motes.position.y = -((t * 0.6) % 20);
      motes.rotation.y = t * 0.01;

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    }

    function loop(now) {
      if (!state.running) return;
      frame(now);
      requestAnimationFrame(loop);
    }

    frame(state.t0);
    if (opts.onReady) opts.onReady();

    return {
      setProgress: function (p) { state.p = Math.min(Math.max(p, 0), 1); },
      setPointer: function (x, y) { state.px = x; state.py = y; },
      start: function () { if (!state.running) { state.running = true; requestAnimationFrame(loop); } },
      stop: function () { state.running = false; },
      frame: function () { frame(performance.now()); },
      resize: resize
    };
  }

  window.TWScene = { create: create };
})();
