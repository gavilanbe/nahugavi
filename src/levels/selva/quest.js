import {
  INTRO, INTRO_HINT, AXOL_GIVE, MISSION_BANNER, AXOL_TIPS, axolProgress,
  AXOL_DONE, AXOL_DONE_HINT, AXOL_WAIT, FINAL,
  ORCHID_BANNER, ORCHIDS_DONE_HINT, IDOL_BANNER, TALK_HINT, PROXIMITY_TIPS,
} from './dialogs.js';

// Máquina de estados de la misión de la Selva Susurrante:
//   none → given → done → finished
// Orquesta diálogos, banners y pistas; las entidades le notifican eventos
// (hablar con Axol, orquídea recogida, ídolo recogido) y ella decide.

export class SelvaQuest {
  constructor(G, ents) {
    this.G = G;
    this.ents = ents;
    this.state = 'none';
    this.idolBanner = IDOL_BANNER;
    this.talkHint = TALK_HINT;
    this._tipsDone = {};
  }

  intro() {
    this.G.ui.showDialog(INTRO, () => this.G.ui.showHint(INTRO_HINT, 4));
  }

  talkToAxol() {
    const G = this.G;
    if (this.state === 'none') {
      this.state = 'given';
      G.ui.showDialog(AXOL_GIVE, () => {
        G.ui.banner(MISSION_BANNER.title, MISSION_BANNER.sub);
        G.audio.questJingle();
      });
    } else if (this.state === 'given') {
      const n = this.ents.counts.orchids;
      if (n >= 5) {
        this.state = 'done';
        G.ui.showDialog(AXOL_DONE, () => {
          this.ents.idol.spawn();
          G.ui.showHint(AXOL_DONE_HINT, 4);
        });
      } else {
        G.ui.showDialog(axolProgress(5 - n, AXOL_TIPS[Math.min(n, AXOL_TIPS.length - 1)]));
      }
    } else if (this.state === 'done') {
      G.ui.showDialog(AXOL_WAIT);
    }
  }

  onOrchid(n) {
    this.G.ui.banner(ORCHID_BANNER(n).title, ORCHID_BANNER(n).sub);
    if (n >= 5) {
      setTimeout(() => this.G.ui.showHint(ORCHIDS_DONE_HINT, 4), 2200);
    }
  }

  // el ajolote enseña su "¡!" si tiene algo nuevo que decir
  axolHasNews() {
    return this.state === 'none' || (this.state === 'given' && this.ents.counts.orchids >= 5);
  }

  onIdolTaken() {
    this.state = 'finished';
  }

  finalDialog() {
    this.G.ui.showDialog(FINAL, () => this.G.victory());
  }

  // pistas contextuales por proximidad
  update() {
    const p = this.G.player;
    for (const tip of PROXIMITY_TIPS) {
      if (this._tipsDone[tip.id]) continue;
      if (Math.hypot(p.pos.x - tip.x, p.pos.z - tip.z) < tip.r) {
        this._tipsDone[tip.id] = true;
        this.G.ui.showHint(tip.text, tip.dur);
      }
    }
  }
}
