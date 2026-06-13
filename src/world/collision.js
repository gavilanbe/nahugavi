// Colisión simple por primitivas, suficiente para un plataformas N64:
//  - cyls:  cilindros infinitos (o con topY) que empujan en horizontal
//  - pads:  discos pisables (copas de árbol, nenúfares, altares...)
//  - boxes: AABBs pisables (ramas, cajas...)
// El terreno base lo da heightAt; groundAt lo combina con pads y boxes.

export class Colliders {
  constructor(heightAt) {
    this.heightAt = heightAt;
    this.cyls = [];
    this.pads = [];
    this.boxes = [];
  }

  addCyl(c) { this.cyls.push(c); return c; }
  addPad(p) { this.pads.push(p); return p; }
  addBox(b) { this.boxes.push(b); return b; }
  removeBox(b) {
    const i = this.boxes.indexOf(b);
    if (i >= 0) this.boxes.splice(i, 1);
  }

  // altura de suelo bajo (x,z) teniendo en cuenta pads y boxes alcanzables
  groundAt(x, z, playerY) {
    let g = this.heightAt(x, z);
    for (const p of this.pads) {
      if (Math.hypot(x - p.x, z - p.z) <= p.r && p.y <= playerY + 0.45 && p.y > g) g = p.y;
    }
    for (const b of this.boxes) {
      if (x >= b.minX - 0.25 && x <= b.maxX + 0.25 && z >= b.minZ - 0.25 && z <= b.maxZ + 0.25
          && b.maxY <= playerY + 0.45 && b.maxY > g) g = b.maxY;
    }
    return g;
  }

  // empuje horizontal fuera de los cilindros
  pushOut(pos, radius) {
    for (const c of this.cyls) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const min = c.r + radius;
      if (d < min && d > 0.0001 && pos.y < (c.topY ?? Infinity)) {
        pos.x = c.x + (dx / d) * min;
        pos.z = c.z + (dz / d) * min;
      }
    }
  }
}
