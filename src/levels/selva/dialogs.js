// Todo el texto de la Selva Susurrante: diálogos, pistas y banners.
// Marcadores de texto enriquecido: **dorado** y __magenta__.

export const INTRO = [
  { who: 'gavi', text: '¡DESPIERTA, Nahu! ¡Emergencia nivel pluma erizada! La hechicera __Zonza__ ha robado los nueve **Ídolos del Sol**.' },
  { who: 'nahu', text: 'Mmmm... cinco minutitos más, Gavi... el césped está en su punto...' },
  { who: 'gavi', text: '¿Ves ese cielo naranja? Lleva así TRES DÍAS. Sin los ídolos, este atardecer durará PARA SIEMPRE. ¡Hasta tus siestas corren peligro!' },
  { who: 'nahu', text: '¿¡MIS SIESTAS!? ...De acuerdo. Ahora es personal.' },
  { who: 'gavi', text: 'Así me gusta. **Tata Axol**, el chamán ajolote, nos espera en el __altar de piedra__. Sigue las columnas que brillan. Y NO te pares a oler las flores.' },
  { who: 'nahu', text: '(Voy a olerlas igual.)' },
];
export const INTRO_HINT = 'Busca a <b>Tata Axol</b> en el altar de piedra';

export const AXOL_GIVE = [
  { who: 'axol', text: 'Ahhh... Nahu y Gavi. Los esperaba, jovencitos. Hasta dormido los oí llegar. Sobre todo a ti, gavilán. Pío, pío, pío, todo el camino.' },
  { who: 'gavi', text: '¡Eso era información táctica en tiempo real! ...Tata Axol, venimos por el **Ídolo del Sol**. La selva entera bosteza.' },
  { who: 'axol', text: 'Lo sé, lo sé... Las Sombras de __Zonza__ esparcieron las **5 Orquídeas de Luna** de mi altar. Sin ellas, el ídolo duerme. Y créeme: nadie ronca como un ídolo de piedra.' },
  { who: 'axol', text: 'Una brilla en la copa del __Árbol Abuelo__... otra sobre el pilar de la __Laguna Espejo__... otra dentro del __Tronco Hueco__...' },
  { who: 'axol', text: '...otra en lo alto del __Mirador__, custodiada por Sombritas gruñonas. ¿Y la quinta? En una **caja dorada**... creo. A mi edad, la memoria es como mi caldo: con grumos.' },
  { who: 'nahu', text: '¿Hay caldo? Me apunto a lo que sea si hay caldo.' },
  { who: 'gavi', text: 'IGNÓRALO. Tú pon las garras, Nahu, que yo pongo el cerebro. Como siempre.' },
  { who: 'axol', text: 'Un consejo de viejo: a las Sombritas, un buen **ZARPAZO**. Y si el suelo queda lejos... mi truco favorito: **ALETEAR**. Bueno, el favorito de ustedes. Yo floto.' },
];
export const MISSION_BANNER = { title: '¡MISIÓN!', sub: 'Encuentra las 5 Orquídeas de Luna' };

// pistas de Gavi según cuántas orquídeas llevas
export const AXOL_TIPS = [
  'El __Árbol Abuelo__ se trepa saltando de rama en rama. Y ALETEANDO. Espacio en el aire, Nahu. ESPACIO. EN. EL. AIRE.',
  'Los nenúfares de la __Laguna Espejo__ se mecen. Salta con ritmo, no como un saco de mangos.',
  'En el __Mirador__ hay Sombritas. Zarpazo primero, preguntas después.',
  'La **caja dorada** se rompe igual que las normales. Con cariño. Y violencia.',
];

export function axolProgress(remaining, tip) {
  return [
    { who: 'axol', text: `Mmm... siento ${remaining > 1 ? `${remaining} orquídeas que aún lloran` : 'UNA última orquídea que llora'} por volver a casa, jovencito.` },
    { who: 'gavi', text: tip },
  ];
}

export const AXOL_DONE = [
  { who: 'axol', text: '¡Las **5 Orquídeas de Luna**! Jovencitos... sabía que este jaguar dormilón tenía madera de héroe.' },
  { who: 'nahu', text: 'Madera de cama, más bien. ¿Esto cuenta como horas extra?' },
  { who: 'gavi', text: 'Trabajas cero horas, Nahu. CERO.' },
  { who: 'axol', text: 'Silencio, jovencitos... Apártense del altar... ¡Oh, **Ídolo del Sol**... la selva te llama... DESPIERTAAA!' },
];
export const AXOL_DONE_HINT = '¡Recoge el <b>Ídolo del Sol</b>!';

export const AXOL_WAIT = [
  { who: 'axol', text: 'El ídolo te espera ahí flotando, jovencito. Los héroes no dejan las reliquias brillando por ahí. Atrae turistas.' },
];

export const FINAL = [
  { who: 'axol', text: 'Ahhh... ¿sienten ese calorcito en las branquias? La __Selva Susurrante__ vuelve a despertar. Lo lograron, jovencitos.' },
  { who: 'gavi', text: '¡Uno menos! Quedan **OCHO ídolos**, Nahu. Ocho. Lo digo despacio porque sé que estás contando con las garras.' },
  { who: 'nahu', text: '...zzz.' },
  { who: 'gavi', text: '¡NAHU! ¡¿EN SERIO?!' },
  { who: 'axol', text: 'Déjalo dormir, gavilán. Se lo ha ganado... Esta vez.' },
];

export const ORCHID_BANNER = (n) => ({ title: '¡ORQUÍDEA DE LUNA!', sub: `${n} de 5` });
export const ORCHIDS_DONE_HINT = '¡Llévaselas a <b>Tata Axol</b>!';
export const IDOL_BANNER = { title: '¡ÍDOLO DEL SOL!', sub: '1 de 9 — la selva despierta...' };
export const TALK_HINT = '<b>E</b> — Hablar con Tata Axol';

// pistas contextuales por proximidad: { x, z, r, text, dur }
export const PROXIMITY_TIPS = [
  { id: 'crates', x: 15, z: -17, r: 6, text: '<b>J</b> — ¡Zarpazo para romper cajas!', dur: 3 },
  { id: 'arbol', x: 26, z: 30, r: 9, text: 'Sube por las ramas — <b>ESPACIO</b> en el aire para aletear', dur: 3.5 },
];
