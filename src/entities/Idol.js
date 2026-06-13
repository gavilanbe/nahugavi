import * as THREE from 'three';
import { makeBeam } from './common.js';

// EL coleccionable: un sol dorado con cara. Mario tiene estrellas, Banjo
// tiene jiggies, Nahu & Gavi tienen SOLES DE ORO. Gestiona su aparición en
// el altar y la coreografía de recogida (baile + fanfarria + amanecer).

export class Idol {
  constructor(G, ents) {
    this.G = G;
    this.ents = ents;
    this.idol = null;
    this._anim = null;
  }

  makeSolMesh() {
    const mat = this.ents.mat;
    const goldBright = new THREE.MeshLambertMaterial({ color: '#ffd95e', emissive: '#b87a14', emissiveIntensity: 0.55 });
    const g = new THREE.Group();
    // núcleo de doble disco (le da bisel al canto)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.24, 14), mat.gold);
    core.rotation.x = Math.PI / 2;
    core.castShadow = true;
    g.add(core);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), goldBright);
    face.rotation.x = Math.PI / 2;
    g.add(face);
    // 10 rayos gruesos alternando largo/corto, como un sol estampado
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const len = i % 2 === 0 ? 0.52 : 0.3;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.15, len, 4), i % 2 ? mat.goldD : mat.gold);
      ray.position.set(Math.cos(a) * (0.6 + len / 2), Math.sin(a) * (0.6 + len / 2), 0);
      ray.rotation.z = a - Math.PI / 2;
      ray.castShadow = true;
      g.add(ray);
    }
    // la cara: ojos somnoliento-felices + sonrisa, por AMBOS lados
    for (const side of [1, -1]) {
      const zf = 0.17 * side;
      const ey1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.05), mat.dark);
      ey1.position.set(-0.2, 0.12, zf);
      const ey2 = ey1.clone(); ey2.position.x = 0.2;
      const smile = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), mat.dark);
      smile.position.set(0, -0.18, zf);
      const sm1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.05), mat.dark);
      sm1.position.set(-0.18, -0.13, zf);
      const sm2 = sm1.clone(); sm2.position.x = 0.18;
      g.add(ey1, ey2, smile, sm1, sm2);
    }
    return g;
  }

  spawn() {
    const G = this.G;
    const altar = G.world.poi.altar;
    const g = this.makeSolMesh();
    // halo brillante
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8),
      new THREE.MeshBasicMaterial({ color: '#ffce4a', transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(halo);
    this.halo = halo;
    g.scale.setScalar(1.25);
    g.position.set(altar.x, altar.y + 2.0, altar.z);
    G.scene.add(g);
    // pilar de luz vertical — se lee como EL premio desde cualquier parte
    this.beam = makeBeam(G.scene, altar.x, altar.y + 1.5, altar.z, '#ffe49a', 0.55, 11);
    this.beam.material.opacity = 0.16;
    // anillo de brillo en el suelo
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.6, 20),
      new THREE.MeshBasicMaterial({ color: '#ffce4a', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(altar.x, altar.y + 0.08, altar.z);
    G.scene.add(ring);
    this.ring = ring;
    this.idol = { mesh: g, x: altar.x, y: altar.y + 2.0, z: altar.z, taken: false };
    G.fx.burst(altar.x, altar.y + 2, altar.z, '#ffce4a', 26, 6);
    G.fx.pop(altar.x, altar.y + 2, altar.z, '#fff2c8', 1.8);
    G.audio.questJingle();
  }

  update(dt) {
    const G = this.G;
    const t = G.time;
    const i = this.idol;
    if (i && !i.taken) {
      const p = G.player;
      i.mesh.position.y = i.y + Math.sin(t * 1.5) * 0.25;
      i.mesh.rotation.y = t * 1.8;
      this.halo.scale.setScalar(1 + Math.sin(t * 3.4) * 0.22);
      this.beam.material.opacity = 0.13 + Math.sin(t * 2.6) * 0.05;
      this.ring.scale.setScalar(1 + Math.sin(t * 2.6) * 0.12);
      this.ring.rotation.z = t * 0.4;
      if (Math.hypot(p.pos.x - i.x, p.pos.z - i.z) < 1.7 && Math.abs(p.pos.y + 1 - i.mesh.position.y) < 2.2) {
        this.take();
      }
    }
    if (this._anim) this._anim(dt);
  }

  // ============ ¡JIGGY GET! ============
  take() {
    const G = this.G;
    const ents = this.ents;
    const p = G.player;
    const i = this.idol;
    i.taken = true;
    ents.counts.idol = 1;
    ents.quest.onIdolTaken();
    G.scene.remove(this.beam);
    G.scene.remove(this.ring);
    G.ui.showIdol();
    G.audio.jiggyFanfare();               // la fanfarria de Nahu & Gavi
    p.startJiggy(4.8);                    // baile coreografiado
    G.cinema = { t: 0, ang: p.heading };  // cámara cinemática frontal
    G.fx.pop(p.pos.x, p.pos.y + 1.5, p.pos.z, '#ffce4a', 1.6);
    G.fx.burst(p.pos.x, p.pos.y + 2, p.pos.z, '#ffce4a', 22, 6);

    const idolMesh = i.mesh;
    const start = { x: idolMesh.position.x, y: idolMesh.position.y, z: idolMesh.position.z };
    const banner = ents.quest.idolBanner;
    let ct = 0, sparkT = 0, bannerDone = false, screechDone = false, growlDone = false;
    this._anim = (dt) => {
      ct += dt;
      // vuela a las garras de Nahu y rebota con sus saltos
      const k = Math.min(1, ct / 0.45);
      const danceK = Math.min(1, Math.max(0, ct - 0.4) / 2.3);
      const hop = Math.abs(Math.sin(Math.max(0, ct - 0.4) * 9)) * 0.38 * (1 - danceK * 0.85);
      const tx = p.pos.x, tz = p.pos.z, ty = p.pos.y + 3.1 + hop;
      idolMesh.position.x = start.x + (tx - start.x) * k;
      idolMesh.position.z = start.z + (tz - start.z) * k;
      idolMesh.position.y = start.y + (ty - start.y) * k;
      idolMesh.rotation.y += dt * (4 + (1 - danceK) * 6);
      // lluvia de chispas doradas durante el baile
      sparkT -= dt;
      if (sparkT <= 0 && ct < 4.2) {
        sparkT = 0.22;
        G.fx.burst(tx + (Math.random() - 0.5) * 1.6, ty + 0.4, tz + (Math.random() - 0.5) * 1.6, '#ffe07a', 3, 2);
      }
      // beats visuales sincronizados con la firma del dúo en la fanfarria
      if (!screechDone && ct > 3.0) { screechDone = true; G.fx.pop(tx, p.pos.y + 2.4, tz, '#bfe8ff', 1.1); }
      if (!growlDone && ct > 3.45) { growlDone = true; G.fx.pop(tx, p.pos.y + 1.0, tz, '#ff9a5a', 1.1); G.shake(0.15); }
      if (!bannerDone && ct > 3.9) {
        bannerDone = true;
        G.ui.banner(banner.title, banner.sub, 3.2);
        G.shake(0.25);
      }
      if (ct > 4.7) {
        G.fx.pop(idolMesh.position.x, idolMesh.position.y, idolMesh.position.z, '#fff2c8', 2.2);
        G.fx.burst(idolMesh.position.x, idolMesh.position.y, idolMesh.position.z, '#ffce4a', 34, 8);
        G.scene.remove(idolMesh);
        this._anim = null;
        G.cinema = null;
        G.moodTarget = 1;   // amanece
        setTimeout(() => ents.quest.finalDialog(), 800);
      }
    };
  }
}
