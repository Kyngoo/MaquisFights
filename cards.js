// ============================================================
//  CARD CLASH — DATOS DE CARTAS
//  Edita este archivo para añadir/modificar personajes
// ============================================================

// ---- COLORES DE BARRAS ----
const BAR_COLORS = {
  PODER:       'linear-gradient(90deg,#ff4500,#ff8c00)',
  FLOW:        'linear-gradient(90deg,#00b0e6,#00cfff)',
  RESPECT:     'linear-gradient(90deg,#b8860b,#ffd700)',
  TROLLEO:     'linear-gradient(90deg,#8b00ff,#c800ff)',
  FUERZA:      'linear-gradient(90deg,#ff4500,#ff8c00)',
  RABIA:       'linear-gradient(90deg,#00b0e6,#00cfff)',
  VELOCIDAD:   'linear-gradient(90deg,#b8860b,#ffd700)',
  AGRESIVIDAD: 'linear-gradient(90deg,#ff4500,#c800ff)',
  INTELIGENCIA:'linear-gradient(90deg,#00cfff,#8b00ff)',
  CARISMA:     'linear-gradient(90deg,#ff69b4,#ff1493)',
  SUERTE:      'linear-gradient(90deg,#00ff88,#00b44f)',
  MAGIA:       'linear-gradient(90deg,#7b00ff,#ff00cc)',
  LOCURA:      'linear-gradient(90deg,#ff0090,#ff4500)',
};

const RARITY_STARS = {
  legendario:'★★★★★', epico:'★★★★', raro:'★★★', comun:'★★'
};

// ============================================================
//  CARTAS DE JUGADORES  (las que puedes elegir)
// ============================================================
const PLAYER_CARDS = [

  // ---- PLANTILLA: copia este bloque para añadir un personaje ----
  {
    id: 1,
    name: 'DJ ORTIZ',           // Nombre (mayúsculas queda mejor)
    role: 'BDM Beats · Maestro del Flow',
    emoji: '🎧',                // Emoji de respaldo si no hay foto
    image: null,                // URL de foto PNG con fondo recortado (o null)
    rarity: 'legendario',       // legendario / epico / raro / comun
    hp: 130, maxHp: 130,
    age: '40 palos',
    kryptonita: 'Ensalada 🥗',
    special: 'Consolador de Lado',
    aliados: ['Cipri', 'Dinoteta', 'Maquis'],
    enemigos: ['Julio', 'Scruffy', 'Fat C'],
    stats: {
      PODER:   80,
      FLOW:    90,
      RESPECT: 65,
      TROLLEO: 55,
    },
    skills: [
      { id:'atk', name:'Scratch Fatal',   desc:'Ataque con el plato',    type:'attack',   cost:0, power:1.0 },
      { id:'sp1', name:'Drop Letal',       desc:'Daño masivo + aturde',   type:'special',  cost:2, power:1.9 },
      { id:'sp2', name:'Cerveza Mahou',    desc:'Cura 35 HP',             type:'heal',     cost:1, power:35  },
      { id:'sp3', name:'Set de 4 Horas',   desc:'Ultimátum devastador',   type:'ultimate', cost:3, power:2.8 },
    ]
  },

  {
    id: 2,
    name: 'RPELIRROJO',
    role: 'Streamer · Rebelde con Causa',
    emoji: '🏏',
    image: null,
    rarity: 'epico',
    hp: 105, maxHp: 105,
    age: '27 años',
    kryptonita: 'Carnet de conducir 🪪',
    special: 'Golpe de Gomaespuma',
    aliados: ['Alien', 'Dinoteta', 'Cipri'],
    enemigos: ['DjOrtiz', 'Maquis'],
    stats: {
      FUERZA:      80,
      RABIA:       65,
      VELOCIDAD:   60,
      AGRESIVIDAD: 75,
    },
    skills: [
      { id:'atk', name:'Gomaespumazo',  desc:'Ataque básico',          type:'attack',   cost:0, power:1.0 },
      { id:'sp1', name:'Rabia Roja',    desc:'Daño x2 + crítico',      type:'special',  cost:2, power:2.1 },
      { id:'sp2', name:'Energy Drink',  desc:'Cura 25 HP',             type:'heal',     cost:1, power:25  },
      { id:'sp3', name:'Berserker Mode',desc:'Destrucción total',      type:'ultimate', cost:3, power:3.0 },
    ]
  },

  // ---- AÑADE MÁS PERSONAJES AQUÍ ----
  // {
  //   id: 3,
  //   name: 'NOMBRE_COLEGA',
  //   role: 'Su trabajo · Apodo',
  //   emoji: '🔥',
  //   image: 'https://i.imgur.com/TUIMAGEN.png',  // <-- URL foto
  //   rarity: 'raro',
  //   hp: 100, maxHp: 100,
  //   age: 'X años',
  //   kryptonita: 'Su miedo 😱',
  //   special: 'Nombre habilidad',
  //   aliados: ['Amigo1'],
  //   enemigos: ['Enemigo1'],
  //   stats: {
  //     PODER:   70,
  //     FLOW:    60,
  //     RESPECT: 80,
  //     TROLLEO: 50,
  //   },
  //   skills: [
  //     { id:'atk', name:'Ataque base',  desc:'Daño simple',    type:'attack',   cost:0, power:1.0 },
  //     { id:'sp1', name:'Habilidad 1',  desc:'Descripción',    type:'special',  cost:2, power:1.8 },
  //     { id:'sp2', name:'Curación',     desc:'Recupera vida',  type:'heal',     cost:1, power:30  },
  //     { id:'sp3', name:'Ultimátum',    desc:'Golpe final',    type:'ultimate', cost:3, power:2.8 },
  //   ]
  // },

];

// ============================================================
//  CARTAS ENEMIGAS  (rivales controlados por la IA)
// ============================================================
const ENEMY_CARDS = [

  {
    id: 101,
    name: 'EL ALGORITMO',
    role: 'IA · Sin Piedad',
    emoji: '🤖',
    image: null,
    rarity: 'legendario',
    hp: 160, maxHp: 160,
    age: 'Eterno',
    kryptonita: 'Desenchufar 🔌',
    special: 'Singularidad',
    aliados: [],
    enemigos: ['Todos'],
    stats: { PODER:95, FLOW:90, RESPECT:40, TROLLEO:50 },
    skills: [
      { id:'atk', name:'Procesamiento', desc:'',type:'attack',  cost:0, power:1.2 },
      { id:'sp1', name:'Overheat',       desc:'',type:'special', cost:2, power:2.1 },
      { id:'sp2', name:'Reinicio',       desc:'',type:'heal',    cost:1, power:45  },
      { id:'sp3', name:'Singularidad',   desc:'',type:'ultimate',cost:3, power:3.3 },
    ]
  },

  {
    id: 102,
    name: 'JEFE ANTIGUO',
    role: 'Manager · Microgestor Pro',
    emoji: '👔',
    image: null,
    rarity: 'epico',
    hp: 135, maxHp: 135,
    age: '52 años',
    kryptonita: 'KPIs negativos 📉',
    special: 'Reunión de 3 horas',
    aliados: [],
    enemigos: ['Todo el equipo'],
    stats: { PODER:75, FLOW:55, RESPECT:85, TROLLEO:60 },
    skills: [
      { id:'atk', name:'Email en CC',     desc:'',type:'attack',  cost:0, power:1.1 },
      { id:'sp1', name:'Microgestión',     desc:'',type:'special', cost:2, power:1.8 },
      { id:'sp2', name:'Subida de Sueldo', desc:'',type:'heal',    cost:1, power:38  },
      { id:'sp3', name:'Reestructuración', desc:'',type:'ultimate',cost:3, power:2.6 },
    ]
  },

  {
    id: 103,
    name: 'INTERN REBELDE',
    role: 'Becario · Caos Ambulante',
    emoji: '😈',
    image: null,
    rarity: 'raro',
    hp: 85, maxHp: 85,
    age: '20 años',
    kryptonita: 'Código legacy 💀',
    special: 'Merge sin Review',
    aliados: [],
    enemigos: ['Senior Devs'],
    stats: { PODER:70, FLOW:95, RESPECT:30, TROLLEO:99 },
    skills: [
      { id:'atk', name:'Pull Request',   desc:'',type:'attack',  cost:0, power:0.9 },
      { id:'sp1', name:'Merge sin Review',desc:'',type:'special', cost:2, power:2.2 },
      { id:'sp2', name:'Café Doble',      desc:'',type:'heal',    cost:1, power:22  },
      { id:'sp3', name:'Reescribir Todo', desc:'',type:'ultimate',cost:3, power:2.9 },
    ]
  },

];
