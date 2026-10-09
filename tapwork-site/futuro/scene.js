/*
  The world behind the whole page: a street seen from below through a fisheye
  lens, glass towers and palms leaning in, a slow drifting camera, and a Tap
  Work card held out to the viewer.

  Everything is procedural (no textures to download): sky, clouds and facades
  are shaders, the palms and the card faces are drawn on canvases.

  The page feeds one number, `s`: which section is on screen, as a float
  (0 = hero, 1 = how it works, ... 4 = the close). Each section has a camera
  angle and a place for the card; between sections the scene eases from one to
  the next, and the afternoon turns to sunset toward the close.

  window.TWScene.create(canvas) -> { setSection, setPointer, tap, start, stop, frame }
*/
(function () {
  if (!window.THREE) return;
  var T = window.THREE;

  // Per-section shot. cx/cy place the card in camera space (right/up), with a
  // separate pair for portrait screens, where text owns the top and bottom.
  var SHOTS = [
    { yaw: 0.00, pitch: 70, dist: 5.6, cx: -2.75, cy: 0.20, pcx: 0.0, pcy: 1.05, rx: 0.16, ry: -0.42, rz: 0.16, dusk: 0.00 },
    { yaw: 0.95, pitch: 64, dist: 6.4, cx: -2.70, cy: 0.10, pcx: 0.0, pcy: 2.6, rx: 0.10, ry: 0.50, rz: -0.12, dusk: 0.08 },
    { yaw: 1.85, pitch: 80, dist: 9.5, cx: 0.00, cy: 3.40, pcx: 0.0, pcy: 4.2, rx: 0.40, ry: 0.25, rz: 0.00, dusk: 0.18 },
    { yaw: 2.70, pitch: 68, dist: 7.0, cx: 2.80, cy: 0.70, pcx: 0.0, pcy: 3.0, rx: 0.10, ry: -0.55, rz: 0.10, dusk: 0.42 },
    { yaw: 3.50, pitch: 60, dist: 4.4, cx: 0.00, cy: 0.05, pcx: 0.0, pcy: 0.05, rx: 0.00, ry: 0.00, rz: 0.00, dusk: 0.92 }
  ];

  var COMMON = [
    'uniform float uDusk; uniform float uTime; uniform vec3 uSun;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }',
    'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }',
    'vec3 skyCol(vec3 d){',
    '  float h = clamp(d.y, 0.0, 1.0);',
    '  vec3 z = mix(vec3(0.05, 0.30, 0.78), vec3(0.09, 0.10, 0.34), uDusk);',
    '  vec3 hz = mix(vec3(0.70, 0.86, 0.98), vec3(1.00, 0.56, 0.34), uDusk);',
    '  vec3 c = mix(hz, z, pow(h, 0.42));',
    '  float s = max(dot(d, uSun), 0.0);',
    '  vec3 sunC = mix(vec3(1.0, 0.97, 0.90), vec3(1.0, 0.62, 0.32), uDusk);',
    '  c += sunC * (pow(s, 900.0)*6.0 + pow(s, 14.0)*0.45 + pow(s, 3.0)*0.10);',
    '  return c;',
    '}'
  ].join('\n');

  var SKY_FRAG = COMMON + [
    '',
    'varying vec3 vDir;',
    'void main(){',
    '  vec3 d = normalize(vDir);',
    '  vec3 c = skyCol(d);',
    '  vec2 uv = d.xz / (d.y + 0.30) * 1.5 + vec2(uTime*0.010, uTime*0.004);',
    '  float cl = smoothstep(0.50, 0.90, fbm(uv*1.2));',
    '  float wisp = smoothstep(0.52, 0.92, fbm(uv*vec2(5.0, 1.0) + 7.0));',
    '  float lit = pow(max(dot(d, uSun), 0.0), 4.0);',
    '  vec3 cloudC = mix(vec3(1.0, 1.0, 1.0), mix(vec3(1.0, 0.70, 0.62), vec3(1.0, 0.86, 0.66), lit), uDusk);',
    '  c = mix(c, cloudC, (cl*0.55 + wisp*0.40) * smoothstep(0.0, 0.3, d.y));',
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

  // Curtain-wall glass: mostly a mirror of the sky, thin mullions, and a slight
  // per-panel wobble so the reflection breaks up the way real panes do.
  var TOWER_FRAG = COMMON + [
    '',
    'uniform float uSeed; uniform vec2 uCell; uniform float uKind;',
    'varying vec3 vWorld; varying vec3 vN; varying vec3 vLocal; varying vec3 vLN;',
    'void main(){',
    '  vec2 fu = abs(vLN.x) > 0.5 ? vLocal.zy : vLocal.xy;',
    '  vec2 g = fu / uCell; vec2 id = floor(g); vec2 f = fract(g);',
    '  float mull = max(max(step(f.x, 0.025), step(0.975, f.x)), step(f.y, 0.035));',
    '  float slab = step(fract(g.y / 4.0), 0.06) * uKind;',
    '  vec3 n = normalize(vN + vec3(hash(id+uSeed)-0.5, 0.0, hash(id.yx+uSeed)-0.5) * 0.05);',
    '  vec3 V = normalize(vWorld - cameraPosition);',
    '  vec3 R = reflect(V, n);',
    '  vec3 refl = skyCol(normalize(vec3(R.x, abs(R.y) * 0.9 + 0.05, R.z)));',
    '  vec2 cuv = R.xz / (abs(R.y) + 0.3) * 1.5 + vec2(uTime*0.010, uTime*0.004);',
    '  refl = mix(refl, vec3(1.0), smoothstep(0.55, 0.9, fbm(cuv*1.2)) * 0.35 * (1.0-uDusk*0.5));',
    '  float fres = pow(1.0 - max(dot(-V, n), 0.0), 2.0);',
    '  vec3 tint = mix(vec3(0.05, 0.16, 0.30), vec3(0.08, 0.20, 0.24), step(0.5, fract(uSeed*7.0)));',
    '  vec3 glass = mix(tint, refl, 0.70 + 0.30*fres);',
    '  glass *= 0.90 + 0.14*hash(id + uSeed*17.0);',
    '  float lit = step(0.9, hash(id*1.7 + uSeed*3.1 + 3.0)) * smoothstep(0.4, 0.95, uDusk);',
    '  glass += lit * vec3(1.0, 0.78, 0.52) * 0.45;',
    '  vec3 frameC = mix(vec3(0.86, 0.90, 0.94), vec3(0.20, 0.16, 0.20), uDusk);',
    '  vec3 c = mix(glass, frameC, max(mull * 0.55, slab * 0.9));',
    '  c += pow(max(dot(R, uSun), 0.0), 400.0) * vec3(1.0, 0.95, 0.85) * 1.2;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var POST_FRAG = [
    'uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime; uniform vec3 uSunPos; uniform float uDusk;',
    'varying vec2 vUv;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
    'void main(){',
    '  vec2 p = vUv*2.0 - 1.0;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 q = vec2(p.x*asp, p.y);',
    '  float k = 0.24, r2 = dot(q, q), m2 = asp*asp + 1.0;',
    // Barrel: the centre is magnified and the rim squeezed, which bends the
    // towers inward like a street seen through a fisheye.
    '  vec2 d = p * (1.0 + k*r2) / (1.0 + k*m2);',
    '  float ca = 0.004 * r2;',
    '  vec3 c = vec3(texture2D(tDiffuse, (d*(1.0+ca))*0.5+0.5).r, texture2D(tDiffuse, d*0.5+0.5).g, texture2D(tDiffuse, (d*(1.0-ca))*0.5+0.5).b);',
    // Lens flare: a soft bloom and a horizontal streak where the sun sits.
    '  vec2 sp = uSunPos.xy; vec2 dd = vec2((d.x - sp.x)*asp, d.y - sp.y);',
    '  vec3 fl = mix(vec3(1.0, 0.96, 0.88), vec3(1.0, 0.6, 0.35), uDusk);',
    '  c += fl * uSunPos.z * (exp(-length(dd)*3.2)*0.45 + exp(-abs(dd.y)*55.0)*exp(-abs(dd.x)*1.6)*0.35);',
    '  c += fl * uSunPos.z * exp(-length(vec2(d.x + sp.x*0.6, d.y + sp.y*0.6)*vec2(asp,1.0))*14.0) * 0.12;',
    '  float vig = smoothstep(2.0, 0.4, length(q)*0.95);',
    '  c *= mix(0.55, 1.0, vig);',
    '  c = c / (1.0 + c*0.15) * 1.10;',
    '  c += (hash(vUv*uRes + fract(uTime)*100.0) - 0.5) * 0.025;',
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

  function cardCanvas(back, phone) {
    var W = 1024, H = 646, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    roundRect(g, 0, 0, W, H, 46); g.save(); g.clip();
    var bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1c1e23'); bg.addColorStop(0.55, '#0c0d10'); bg.addColorStop(1, '#16171b');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.05; g.strokeStyle = '#fff';
    for (var i = 0; i < H; i += 3) { g.lineWidth = Math.random() * 0.8; g.beginPath(); g.moveTo(0, i); g.lineTo(W, i + 8); g.stroke(); }
    g.globalAlpha = 1;
    g.strokeStyle = '#f2f3f4'; g.lineCap = 'round';
    if (!back) {
      drawMark(g, 64, 52, 150, '#f2f3f4');
      g.fillStyle = '#f2f3f4'; g.font = '800 92px Archivo, sans-serif';
      g.fillText('Tap Work', 70, 330);
      g.fillStyle = '#9aa0a8'; g.font = '500 30px "JetBrains Mono", monospace';
      g.fillText('ACERCA TU CELULAR', 74, 384);
      g.lineWidth = 9;
      for (var k = 0; k < 3; k++) { g.beginPath(); g.arc(870, 110, 22 + k * 22, -0.75, 0.75); g.stroke(); }
      g.fillStyle = '#ec3013'; g.fillRect(74, 548, 210, 12);
      g.fillStyle = '#7c828b'; g.font = '500 26px "JetBrains Mono", monospace';
      g.fillText('NFC · 13.56 MHz', 690, 562);
    } else {
      drawMark(g, 64, 52, 120, '#f2f3f4');
      g.fillStyle = '#9aa0a8'; g.font = '600 34px Archivo, sans-serif';
      g.fillText('Escr\u00edbenos por WhatsApp', 74, 300);
      g.fillStyle = '#f2f3f4'; g.font = '800 104px Archivo, sans-serif';
      g.fillText(phone, 70, 420);
      g.fillStyle = '#ec3013'; g.fillRect(74, 548, 210, 12);
      g.lineWidth = 9;
      for (var j = 0; j < 3; j++) { g.beginPath(); g.arc(870, 110, 22 + j * 22, -0.75, 0.75); g.stroke(); }
    }
    g.restore();
    var tex = new T.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // A palm, drawn once: curved trunk, a crown of fronds with leaflets.
  function palmCanvas(seed) {
    var R = rnd(seed), W = 512, H = 1024, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    var bend = (R() - 0.5) * 120, cx = W / 2 + bend, cy = 300;
    g.strokeStyle = '#3d3229'; g.lineCap = 'round';
    for (var t = 0; t < 1; t += 0.02) {
      var x = W / 2 + bend * t * t, y = H - t * (H - cy);
      g.lineWidth = 26 - 12 * t; g.beginPath(); g.moveTo(x, y); g.lineTo(W / 2 + bend * (t + 0.02) * (t + 0.02), y - (H - cy) * 0.02); g.stroke();
      if ((t * 50 | 0) % 3 === 0) { g.strokeStyle = '#4c4034'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + 10, y - 3); g.stroke(); g.strokeStyle = '#3d3229'; }
    }
    var fronds = 13;
    for (var f = 0; f < fronds; f++) {
      var a = (f / fronds) * Math.PI * 2 + R() * 0.3, len = 170 + R() * 70;
      var droop = 0.55 + R() * 0.4;
      var ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.55 + len * droop * 0.5;
      var mx = cx + Math.cos(a) * len * 0.5, my = cy + Math.sin(a) * len * 0.3 - 40;
      var shade = 0.6 + R() * 0.4;
      g.strokeStyle = 'rgba(' + (26 * shade | 0) + ',' + (56 * shade | 0) + ',' + (30 * shade | 0) + ',1)';
      g.lineWidth = 6; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
      for (var l = 0.12; l < 1; l += 0.045) {
        var px = (1 - l) * (1 - l) * cx + 2 * (1 - l) * l * mx + l * l * ex;
        var py = (1 - l) * (1 - l) * cy + 2 * (1 - l) * l * my + l * l * ey;
        var leaf = 46 * (1 - l * 0.6);
        g.lineWidth = 3.5;
        g.strokeStyle = 'rgba(' + (34 * shade | 0) + ',' + (78 * shade | 0) + ',' + (38 * shade | 0) + ',1)';
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + 1.2) * leaf, py + Math.sin(a + 1.2) * leaf * 0.7 + leaf * 0.5); g.stroke();
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a - 1.2) * leaf, py + Math.sin(a - 1.2) * leaf * 0.7 + leaf * 0.5); g.stroke();
      }
    }
    var tex = new T.CanvasTexture(c);
    return tex;
  }

  function create(canvas, opts) {
    opts = opts || {};
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { return null; }
    var small = Math.min(innerWidth, innerHeight) < 700;
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5);
    renderer.setPixelRatio(dpr);

    var shared = { uDusk: { value: 0 }, uTime: { value: 0 }, uSun: { value: new T.Vector3(-0.50, 0.62, -0.60).normalize() } };
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(108, 1, 0.1, 2000);

    scene.add(new T.Mesh(new T.SphereGeometry(900, 48, 24),
      new T.ShaderMaterial({ uniforms: shared, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: T.BackSide, depthWrite: false })));

    var R = rnd(11);
    var N = 10;
    for (var i = 0; i < N; i++) {
      var a = (i / N) * Math.PI * 2 + (R() - 0.5) * 0.3;
      var w = 12 + R() * 11, dd = 12 + R() * 11, h = 85 + R() * 95;
      var dist = 42 + R() * 22;
      var mat = new T.ShaderMaterial({
        uniforms: { uDusk: shared.uDusk, uTime: shared.uTime, uSun: shared.uSun, uSeed: { value: R() },
          uKind: { value: R() > 0.6 ? 1 : 0 },
          uCell: { value: new T.Vector2(2.0 + R() * 1.2, 3.2 + R() * 0.6) } },
        vertexShader: TOWER_VERT, fragmentShader: TOWER_FRAG
      });
      var m = new T.Mesh(new T.BoxGeometry(w, h, dd), mat);
      m.position.set(Math.cos(a) * dist, h / 2 - 40, Math.sin(a) * dist);
      m.rotation.y = -a + (R() - 0.5) * 0.9;
      scene.add(m);
    }

    // Palms between the camera and the towers, each as two crossed planes that
    // stay upright, so from below their trunks lean in toward the sky.
    var palms = [];
    var PALMS = [[0.5, 17], [1.55, 20], [2.6, 16], [3.75, 19], [4.6, 17], [5.6, 21]];
    PALMS.forEach(function (pp, k) {
      var tex = palmCanvas(31 + (k % 4) * 7);
      var pm = new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: T.DoubleSide, depthWrite: true });
      var grp = new T.Group();
      for (var c2 = 0; c2 < 2; c2++) {
        var plane = new T.Mesh(new T.PlaneGeometry(24, 48), pm);
        plane.rotation.y = c2 * Math.PI / 2;
        grp.add(plane);
      }
      grp.position.set(Math.cos(pp[0]) * pp[1], 24 - 22 + (k % 3) * 3, Math.sin(pp[0]) * pp[1]);
      scene.add(grp); palms.push(grp);
    });

    var PN = small ? 160 : 320, pos = new Float32Array(PN * 3);
    for (var j = 0; j < PN; j++) {
      var ang = R() * 6.283, rad = 8 + R() * 30;
      pos[j * 3] = Math.cos(ang) * rad; pos[j * 3 + 1] = 6 + R() * 70; pos[j * 3 + 2] = Math.sin(ang) * rad;
    }
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    var dot = document.createElement('canvas'); dot.width = dot.height = 64;
    var dg = dot.getContext('2d'), grd = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    dg.fillStyle = grd; dg.fillRect(0, 0, 64, 64);
    var motes = new T.Points(pg, new T.PointsMaterial({ color: 0xfff6e0, size: 0.3, map: new T.CanvasTexture(dot),
      transparent: true, opacity: 0.45, blending: T.AdditiveBlending, depthWrite: false }));
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

    function faceMat() {
      return new T.ShaderMaterial({
        uniforms: { map: { value: null }, uSheen: { value: 0 }, uDusk: shared.uDusk },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform sampler2D map; uniform float uSheen; uniform float uDusk; varying vec2 vUv;',
          'void main(){ vec4 t = texture2D(map, vUv);',
          '  float b = exp(-pow((vUv.x + vUv.y*0.55 - uSheen) * 5.0, 2.0));',
          '  vec3 sheenC = mix(vec3(0.80, 0.90, 1.0), vec3(1.0, 0.62, 0.40), uDusk);',
          '  gl_FragColor = vec4(t.rgb + sheenC*b*0.18, t.a); }'
        ].join('\n'),
        transparent: true
      });
    }
    var front = new T.Mesh(new T.PlaneGeometry(CW, CH), faceMat());
    front.position.z = 0.027; card.add(front);
    var backFace = new T.Mesh(new T.PlaneGeometry(CW, CH), faceMat());
    backFace.rotation.y = Math.PI; backFace.position.z = -0.027; card.add(backFace);

    var rings = [];
    for (var q = 0; q < 4; q++) {
      var ring = new T.Mesh(new T.RingGeometry(0.97, 1.0, 96),
        new T.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      ring.position.z = 0.06; card.add(ring); rings.push(ring);
    }

    function paintCard() {
      front.material.uniforms.map.value = cardCanvas(false);
      backFace.material.uniforms.map.value = cardCanvas(true, opts.phone || '');
    }
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('800 92px Archivo'), document.fonts.load('500 26px "JetBrains Mono"')]).then(paintCard, paintCard);
    } else paintCard();

    // ---- post ----
    var rt = new T.WebGLRenderTarget(4, 4, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    var postU = { tDiffuse: { value: rt.texture }, uRes: { value: new T.Vector2(1, 1) }, uTime: shared.uTime,
      uDusk: shared.uDusk, uSunPos: { value: new T.Vector3(0, 0, 0) } };
    var postScene = new T.Scene();
    postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), new T.ShaderMaterial({
      uniforms: postU, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: POST_FRAG, depthTest: false, depthWrite: false
    })));
    var postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var state = { s: 0, px: 0, py: 0, sx: 0, sy: 0, running: false, t0: performance.now(), tapAt: -10, flipped: 0, flip: 0 };

    function resize() {
      var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < h ? 116 : 102;
      camera.updateProjectionMatrix();
      rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
      postU.uRes.value.set(w, h);
    }
    resize();
    addEventListener('resize', resize);

    function ease(x) { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); }
    function shot(s) {
      var i = Math.min(Math.floor(s), SHOTS.length - 1), k = ease(s - i), A = SHOTS[i], B = SHOTS[Math.min(i + 1, SHOTS.length - 1)], o = {};
      for (var key in A) o[key] = A[key] + (B[key] - A[key]) * k;
      return o;
    }
    var fwd = new T.Vector3(), camRight = new T.Vector3(), camUp = new T.Vector3(), sunW = new T.Vector3();

    function frame(now) {
      var t = ((now || performance.now()) - state.t0) / 1000;
      shared.uTime.value = t;
      state.sx += (state.px - state.sx) * 0.05; state.sy += (state.py - state.sy) * 0.05;
      var S = shot(state.s), portrait = camera.aspect < 1;
      shared.uDusk.value = S.dusk;

      // The drift: a slow turn plus a gentle sway of the horizon, like a
      // handheld lens circling under the card.
      var yaw = S.yaw + t * 0.035 + state.sx * 0.06;
      var pitch = (S.pitch + Math.sin(t * 0.23) * 2.5 - state.sy * 2) * Math.PI / 180;
      fwd.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
      camera.position.set(0, 0, 0);
      camera.up.set(0, 1, 0);
      camera.lookAt(fwd);
      camera.rotateZ(Math.sin(t * 0.17) * 0.06);
      camera.updateMatrixWorld();
      camRight.setFromMatrixColumn(camera.matrixWorld, 0);
      camUp.setFromMatrixColumn(camera.matrixWorld, 1);

      var dist = S.dist * (portrait ? 0.78 : 1);
      holder.position.copy(fwd).multiplyScalar(dist);
      holder.position.addScaledVector(camRight, portrait ? S.pcx : S.cx);
      holder.position.addScaledVector(camUp, (portrait ? S.pcy : S.cy) + Math.sin(t * 1.1) * 0.07);
      holder.quaternion.copy(camera.quaternion);

      // Tap: the card flips to its back (the phone number) and the rings burst.
      state.flip += ((state.flipped ? Math.PI : 0) - state.flip) * 0.08;
      var since = t - state.tapAt;
      var jolt = since < 0.6 ? Math.sin(since / 0.6 * Math.PI) * 0.35 : 0;
      card.position.z = jolt;
      card.rotation.set(
        S.rx + state.sy * 0.2 + Math.sin(t * 0.9) * 0.05,
        S.ry + state.flip + state.sx * 0.3 + Math.sin(t * 0.6) * 0.08,
        S.rz + Math.sin(t * 0.5) * 0.03
      );
      var sheen = ((card.rotation.y % (Math.PI * 2)) + Math.PI) / (Math.PI * 2) * 2.4 - 0.4 + Math.sin(t * 0.35) * 0.3;
      front.material.uniforms.uSheen.value = sheen; backFace.material.uniforms.uSheen.value = 1.6 - sheen;

      var facing = 1 - Math.min(1, Math.abs(Math.sin(card.rotation.y)) * 1.6);
      var burst = since < 1.6 ? 1 - since / 1.6 : 0;
      for (var i = 0; i < rings.length; i++) {
        var k = ((t * (0.5 + burst * 1.5)) + i / rings.length) % 1;
        var s = 1.0 + k * (2.0 + burst * 2.5);
        rings[i].scale.set(s * 1.25, s, 1);
        rings[i].material.opacity = (1 - k) * facing * (0.28 + burst * 0.7 + S.dusk * 0.25);
      }

      motes.position.y = -((t * 0.5) % 20);
      motes.rotation.y = t * 0.01;
      palms.forEach(function (p, n) { p.rotation.z = Math.sin(t * 0.7 + n) * 0.012; });

      sunW.copy(shared.uSun.value).multiplyScalar(100).project(camera);
      var vis = sunW.z < 1 && Math.abs(sunW.x) < 1.6 && Math.abs(sunW.y) < 1.6 ? 1 - Math.max(Math.abs(sunW.x), Math.abs(sunW.y)) / 1.6 : 0;
      postU.uSunPos.value.set(sunW.x, sunW.y, vis * (1 - S.dusk * 0.4));

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    }

    var minGap = small ? 31 : 0, lastDraw = 0;
    function loop(now) {
      if (!state.running) return;
      if (now - lastDraw >= minGap) { lastDraw = now; frame(now); }
      requestAnimationFrame(loop);
    }
    frame(state.t0);

    return {
      setSection: function (s) { state.s = Math.min(Math.max(s, 0), SHOTS.length - 1); },
      setPointer: function (x, y) { state.px = x; state.py = y; },
      tap: function () {
        state.tapAt = (performance.now() - state.t0) / 1000;
        state.flipped = state.flipped ? 0 : 1;
        if (!state.running) frame();
        return state.flipped;
      },
      start: function () { if (!state.running) { state.running = true; requestAnimationFrame(loop); } },
      stop: function () { state.running = false; },
      frame: function () { frame(performance.now()); },
      resize: resize
    };
  }

  window.TWScene = { create: create };
})();
