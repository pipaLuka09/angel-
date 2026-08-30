// Portacredencial (badge holder) — built from primitives, named parts.
export function buildBadge(THREE) {
  const M = {
    rubber: new THREE.MeshStandardMaterial({ name:'rubber_black', color:0x1b1a1a, roughness:0.82, metalness:0.05 }),
    webbing: new THREE.MeshStandardMaterial({ name:'webbing_black', color:0x131313, roughness:0.95, metalness:0.0 }),
    plastic: new THREE.MeshStandardMaterial({ name:'plastic_white', color:0xe9e8e6, roughness:0.45, metalness:0.05 }),
    printRed: new THREE.MeshStandardMaterial({ name:'print_red', color:0xec3013, roughness:0.35, metalness:0.05 }),
    printDark: new THREE.MeshStandardMaterial({ name:'print_dark', color:0x201e1d, roughness:0.4, metalness:0.05 }),
    printWhite: new THREE.MeshStandardMaterial({ name:'print_white', color:0xf3f2f2, roughness:0.4, metalness:0.02 }),
  };

  function roundedRect(w, h, r) {
    const s = new THREE.Shape();
    const x = -w/2, y = -h/2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function plate(w, h, r, d, mat, name, bevel) {
    const g = new THREE.ExtrudeGeometry(roundedRect(w, h, r), bevel
      ? { depth:d, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel, bevelSegments:4, curveSegments:24 }
      : { depth:d, bevelEnabled:false, curveSegments:24 });
    g.center();
    const m = new THREE.Mesh(g, mat); m.name = name; return m;
  }

  const model = new THREE.Group();
  model.name = 'badge_holder';

  const CW = 0.062, CH = 0.092, FW = 0.080, FH = 0.110, FD = 0.007;

  const frameShape = roundedRect(FW, FH, 0.010);
  frameShape.holes.push(roundedRect(CW + 0.013, CH + 0.013, 0.008));
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
    depth: FD, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0018, bevelSegments: 4, curveSegments: 24
  });
  frameGeo.center();
  const frame = new THREE.Mesh(frameGeo, M.rubber); frame.name = 'frame_rubber'; model.add(frame);

  const back = plate(FW - 0.006, FH - 0.006, 0.008, 0.0018, M.rubber, 'back_panel');
  back.position.z = -FD/2 + 0.0009; model.add(back);

  const insert = plate(CW + 0.012, CH + 0.012, 0.007, 0.0014, M.plastic, 'insert_white');
  insert.position.z = 0.0002; model.add(insert);

  const card = plate(CW, CH, 0.003, 0.0008, M.printRed, 'card_print');
  card.position.z = 0.0016; model.add(card);

  const darkField = plate(CW - 0.001, CH * 0.46, 0.002, 0.0006, M.printDark, 'card_field_dark');
  darkField.position.set(0, -CH/2 + CH*0.23 + 0.0005, 0.0023); model.add(darkField);

  const sweep = new THREE.Shape();
  sweep.moveTo(-CW/2, CH*0.16); sweep.lineTo(CW/2, CH*0.40);
  sweep.lineTo(CW/2, CH*0.48); sweep.lineTo(-CW/2, CH*0.24);
  const sweepMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(sweep, { depth:0.0005, bevelEnabled:false }), M.printDark);
  sweepMesh.name = 'card_sweep'; sweepMesh.position.z = 0.0021; model.add(sweepMesh);

  const mark = plate(CW * 0.62, 0.0075, 0.001, 0.0005, M.printWhite, 'card_wordmark');
  mark.position.set(0, CH*0.045, 0.0027); model.add(mark);

  const banner = plate(CW * 0.80, 0.0115, 0.001, 0.0006, M.printRed, 'card_banner');
  banner.position.set(0, -CH*0.155, 0.0029); model.add(banner);
  for (let i = 0; i < 2; i++) {
    const line = plate(CW * (i ? 0.58 : 0.46), 0.0026, 0.0006, 0.0004, M.printWhite, 'banner_line_' + (i+1));
    line.position.set(0, -CH*0.155 + (i ? -0.0032 : 0.0032), 0.0033); model.add(line);
  }
  for (let i = 0; i < 2; i++) {
    const line = plate(CW * (i ? 0.60 : 0.66), 0.0028, 0.0006, 0.0004, M.printWhite, 'role_line_' + (i+1));
    line.position.set(0, -CH*0.29 - i*0.0055, 0.0029); model.add(line);
  }

  const tab = plate(0.020, 0.014, 0.004, FD - 0.001, M.rubber, 'neck_tab', 0.0012);
  tab.position.set(0, FH/2 + 0.005, 0); model.add(tab);

  const clip = plate(0.017, 0.016, 0.003, 0.006, M.plastic, 'clip_block', 0.0008);
  clip.position.set(0, FH/2 + 0.012, 0.0015); model.add(clip);

  const STRAP_W = 0.019, STRAP_T = 0.0016;
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.010, STRAP_T, 8, 40, Math.PI), M.webbing);
  loop.name = 'strap_loop';
  loop.scale.set(1, 1, STRAP_W / (STRAP_T * 2));
  loop.position.set(0, FH/2 + 0.006, 0); loop.rotation.z = Math.PI; model.add(loop);

  function riser(x, y0, y1, name) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(STRAP_W * 0.5, y1 - y0, STRAP_T), M.webbing);
    m.name = name; m.position.set(x, (y0 + y1) / 2, 0); return m;
  }
  model.add(riser(-0.0052, FH/2 + 0.004, FH/2 + 0.016, 'strap_riser_left'));
  model.add(riser(0.0052, FH/2 + 0.004, FH/2 + 0.016, 'strap_riser_right'));

  const strapH = 0.105;
  const strap = new THREE.Mesh(new THREE.BoxGeometry(STRAP_W, strapH, STRAP_T), M.webbing);
  strap.name = 'lanyard_strap';
  strap.position.set(0, FH/2 + 0.016 + strapH/2, 0); model.add(strap);

  const fold = new THREE.Mesh(new THREE.BoxGeometry(STRAP_W + 0.0008, 0.005, STRAP_T * 2.2), M.webbing);
  fold.name = 'strap_fold';
  fold.position.set(0, FH/2 + 0.016 + strapH - 0.004, 0); model.add(fold);

  return { model, materials: M, roundedRect, plate, dims: { FW, FH, FD, strapH } };
}
