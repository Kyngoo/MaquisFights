// ============================================================
//  MAQUIS FIGHTS — LÓGICA PRINCIPAL v3 (con Auth)
// ============================================================

const APP = {
  user:       null,   // auth user de Supabase
  profile:    null,   // fila de la tabla profiles
  collection: [],
  deck:       [],
  sel:        null,
  battlePlayer: null,
  battleEnemy:  null,
  turn:       'player',
  stunned:    false,
  starterOptions: [],
  starterSel: null,
  deckSel:    [],
  authMode:   'login',  // 'login' | 'register'
};

// ---- Utilidades ----
function dc(o){ return JSON.parse(JSON.stringify(o)); }
function resetPick(){ APP.sel = null; document.getElementById('fight-btn').disabled = true; }
function setLoading(txt){ document.getElementById('loading-txt').textContent = txt; }
function allCards(){ return [...PLAYER_CARDS, ...ENEMY_CARDS]; }
function cardById(id){ return allCards().find(c => c.id === id); }

// ============================================================
//  ROUTER — navegación por hash
// ============================================================
const ROUTES = {
  home:       { screen: 'screen-home',       load: () => updateHomeBadge() },
  auth:       { screen: 'screen-auth' },
  starter:    { screen: 'screen-starter' },
  loading:    { screen: 'screen-loading' },
  collection: { screen: 'screen-collection', load: () => renderMyCollection() },
  deck:       { screen: 'screen-deck',        load: () => renderDeck() },
  pick:       { screen: 'screen-pick',        load: () => { resetPick(); renderPick(); } },
  battle:     { screen: 'screen-battle' },
  result:     { screen: 'screen-result' },
  ranking:    { screen: 'screen-ranking',     load: () => loadRanking() },
  profile:    { screen: 'screen-profile',     load: () => loadProfile() },
};

// Muestra sólo la pantalla indicada; oculta el resto con !important
// para que ninguna regla CSS pueda interferir
function showScreen(screenId){
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.setProperty('display', 'none', 'important');
  });
  const el = document.getElementById(screenId);
  if(!el) return;
  el.classList.add('active');
  el.style.setProperty('display', 'flex', 'important');
}

// Navega a una ruta: actualiza el hash, muestra la pantalla y llama al loader
function navigate(route){
  const def = ROUTES[route];
  if(!def) return;
  showScreen(def.screen);
  // loading no tiene hash propio (es transitorio)
  if(route !== 'loading'){
    history.pushState({ route }, '', '#' + route);
  }
  if(def.load) def.load();
}

// Botón atrás del navegador
window.addEventListener('popstate', e => {
  const route = e.state?.route || window.location.hash.replace('#','') || 'auth';
  const def = ROUTES[route] || ROUTES['auth'];
  showScreen(def.screen);
  if(def.load) def.load();
});

// ============================================================
//  ARRANQUE
// ============================================================
window.addEventListener('load', async () => {
  showScreen('screen-loading');
  setLoading('Conectando...');
  try {
    const session = await dbGetSession();
    if(session){
      setLoading('Cargando tu partida...');
      APP.user = session.user;
      await loadUserData();
    } else {
      navigate('auth');
    }
  } catch(e){
    console.error(e);
    setLoading('Error de conexión. Revisa config.js');
  }
});

async function loadUserData(){
  APP.profile    = await dbGetProfile(APP.user.id);
  // Si el trigger de Supabase no creó el perfil, crearlo manualmente con el nickname de los metadatos
  if(!APP.profile){
    const nickname = APP.user.user_metadata?.nickname || APP.user.email?.split('@')[0] || 'Jugador';
    try {
      await dbCreateProfile(APP.user.id, nickname);
      APP.profile = await dbGetProfile(APP.user.id);
    } catch(e){ console.error('Error creando perfil:', e); }
  }
  APP.collection = await dbGetCollection(APP.user.id);
  APP.deck       = await dbGetDeck(APP.user.id);
  if(APP.collection.length === 0){
    showStarterPick();
  } else {
    navigate('home');
  }
}

// ============================================================
//  AUTH — tabs, registro, login
// ============================================================
function switchTab(mode){
  APP.authMode = mode;
  document.getElementById('tab-login').classList.toggle('active',    mode==='login');
  document.getElementById('tab-register').classList.toggle('active', mode==='register');
  document.getElementById('field-nickname').style.display = mode==='register' ? 'block' : 'none';
  document.getElementById('field-confirm').style.display  = mode==='register' ? 'block' : 'none';
  document.getElementById('field-nick-login').style.display = mode==='login' ? 'block' : 'none';
  const ab=document.getElementById('auth-btn'); if(ab && ab.querySelector('.gbtn-inner')) ab.querySelector('.gbtn-inner').textContent = mode==='login' ? 'ENTRAR →' : 'REGISTRARSE →';
  document.getElementById('auth-error').textContent = '';
  // limpiar campos
  ['auth-nickname','auth-nick-login','auth-password','auth-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
}

function togglePass(){
  const inp = document.getElementById('auth-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function submitAuth(){
  const errEl = document.getElementById('auth-error');
  const btn   = document.getElementById('auth-btn');
  errEl.textContent = '';

  const password = document.getElementById('auth-password').value.trim();

  if(APP.authMode === 'register'){
    const nickname = document.getElementById('auth-nickname').value.trim();
    const confirm  = document.getElementById('auth-confirm').value.trim();

    if(nickname.length < 3)   { errEl.textContent = 'Nickname mínimo 3 caracteres'; return; }
    if(!/^[a-zA-Z0-9_\-\.]+$/.test(nickname)) { errEl.textContent = 'Solo letras, números, _ y -'; return; }
    if(password.length < 6)   { errEl.textContent = 'Contraseña mínimo 6 caracteres'; return; }
    if(password !== confirm)  { errEl.textContent = 'Las contraseñas no coinciden'; return; }

    btn.disabled = true; btn.querySelector('.gbtn-inner').textContent = 'Creando cuenta...';
    try {
      const exists = await dbNicknameExists(nickname);
      if(exists){ errEl.textContent = 'Ese nickname ya está en uso'; btn.disabled=false; btn.querySelector('.gbtn-inner').textContent='REGISTRARSE →'; return; }
      APP.user = await dbRegister(nickname, password);
      // Pequeña espera para que el trigger cree el perfil
      await new Promise(r => setTimeout(r, 800));
      await loadUserData();
    } catch(e){
      errEl.textContent = friendlyError(e.message);
      btn.disabled=false; btn.querySelector('.gbtn-inner').textContent='REGISTRARSE →';
    }

  } else {
    const nickname = document.getElementById('auth-nick-login').value.trim();
    if(!nickname)            { errEl.textContent = 'Escribe tu nickname'; return; }
    if(password.length < 1) { errEl.textContent = 'Escribe tu contraseña'; return; }

    btn.disabled = true; btn.querySelector('.gbtn-inner').textContent = 'Entrando...';
    try {
      APP.user = await dbLogin(nickname, password);
      await loadUserData();
    } catch(e){
      errEl.textContent = friendlyError(e.message);
      btn.disabled=false; btn.querySelector('.gbtn-inner').textContent='ENTRAR →';
    }
  }
}

function friendlyError(msg){
  if(msg.includes('Invalid login')) return 'Nickname o contraseña incorrectos';
  if(msg.includes('already registered')) return 'Ese nickname ya está en uso';
  if(msg.includes('Password should')) return 'Contraseña mínimo 6 caracteres';
  if(msg.includes('Network')) return 'Error de red. Comprueba tu conexión';
  return msg;
}

async function logout(){
  await dbLogout();
  APP.user = null; APP.profile = null; APP.collection = []; APP.deck = [];
  switchTab('login');
  navigate('auth');
}

// ---- Enter en campos auth ----
document.addEventListener('DOMContentLoaded', () => {
  ['auth-nick-login','auth-nickname','auth-password','auth-confirm'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown', e => { if(e.key==='Enter') submitAuth(); });
  });
  // Iniciar en modo login
  switchTab('login');
});

// ============================================================
//  HOME
// ============================================================
function loadHome(){ navigate('home'); }

function updateHomeBadge(){
  const p = APP.profile;
  if(!p) return;
  document.getElementById('pb-nick').textContent   = p.nickname;
  document.getElementById('pb-level').textContent  = 'Nv.'+p.level;
  const av = document.getElementById('pb-avatar');
  if(av) av.textContent = p.nickname.slice(0,2).toUpperCase();
  const needed = xpForLevel(p.level);
  document.getElementById('pb-xpfill').style.width = Math.min(100, Math.round(p.xp/needed*100))+'%';
}

// ============================================================
//  STARTER PICK
// ============================================================
// ---- Carousel state ----
let CAR = { idx: 0, total: 0, dragging: false, startX: 0, diffX: 0 };

function showStarterPick(){
  const shuffled = [...PLAYER_CARDS].sort(() => Math.random()-.5);
  APP.starterOptions = shuffled.slice(0,3);
  APP.starterSel = null;
  CAR.idx = 0; CAR.total = APP.starterOptions.length;
  document.getElementById('starter-btn').disabled = true;
  renderCarousel();
  navigate('starter');
}

function renderCarousel(){
  const cards = APP.starterOptions;
  const carousel = document.getElementById('starter-carousel');
  const dots     = document.getElementById('starter-dots');

  // slides
  carousel.innerHTML = cards.map((c, i) => {
    const isActive = i === CAR.idx;
    const sel = APP.starterSel === c.id;
    return `<div class="starter-slide${isActive?' active':''}" data-idx="${i}">
      ${buildCard(c,'starter', sel)}
    </div>`;
  }).join('');

  // dots
  dots.innerHTML = cards.map((_,i) =>
    `<div class="sdot${i===CAR.idx?' active':''}"></div>`
  ).join('');

  // position
  carousel.style.transform = `translateX(-${CAR.idx * 100}%)`;

  // arrows
  const al = document.getElementById('arr-left');
  const ar = document.getElementById('arr-right');
  if(al) al.disabled = CAR.idx === 0;
  if(ar) ar.disabled = CAR.idx === CAR.total - 1;

  // touch/swipe
  setupCarouselTouch(carousel);
}

function carouselGo(idx){
  CAR.idx = Math.max(0, Math.min(CAR.total-1, idx));
  // auto-select the visible card
  const c = APP.starterOptions[CAR.idx];
  if(c){ APP.starterSel = c.id; document.getElementById('starter-btn').disabled = false; }
  renderCarousel();
}
function carouselNext(){ carouselGo(CAR.idx + 1); }
function carouselPrev(){ carouselGo(CAR.idx - 1); }

function setupCarouselTouch(el){
  el.ontouchstart = e => { CAR.dragging=true; CAR.startX=e.touches[0].clientX; CAR.diffX=0; el.style.transition='none'; };
  el.ontouchmove  = e => {
    if(!CAR.dragging) return;
    CAR.diffX = e.touches[0].clientX - CAR.startX;
    el.style.transform = `translateX(calc(-${CAR.idx*100}% + ${CAR.diffX}px))`;
  };
  el.ontouchend   = () => {
    CAR.dragging = false;
    el.style.transition = '';
    if(CAR.diffX < -50)      carouselNext();
    else if(CAR.diffX > 50)  carouselPrev();
    else renderCarousel();
  };
}

function pickStarter(id){
  // clicking a card selects it and we stay on that slide
  APP.starterSel = id;
  const idx = APP.starterOptions.findIndex(c=>c.id===id);
  if(idx>=0) CAR.idx = idx;
  document.getElementById('starter-btn').disabled = false;
  renderCarousel();
}

async function confirmStarter(){
  if(!APP.starterSel) return;
  const btn = document.getElementById('starter-btn');
  const inner = btn.querySelector('.gbtn-inner');
  btn.disabled = true;
  inner.textContent = 'Guardando...';
  try {
    // Si el trigger de Supabase aún no creó el perfil, esperamos o lo creamos nosotros
    if(!APP.profile){
      inner.textContent = 'Preparando...';
      for(let i = 0; i < 6; i++){
        await new Promise(r => setTimeout(r, 500));
        APP.profile = await dbGetProfile(APP.user.id);
        if(APP.profile) break;
      }
      if(!APP.profile){
        const nick = APP.user.user_metadata?.nickname || APP.user.email?.split('@')[0] || 'Jugador';
        await dbCreateProfile(APP.user.id, nick);
        APP.profile = await dbGetProfile(APP.user.id);
      }
    }
    if(!APP.profile) throw new Error('No se pudo crear el perfil. Vuelve a intentarlo.');
    await dbAddCard(APP.user.id, APP.starterSel);
    APP.collection = [APP.starterSel];
    APP.deck = [APP.starterSel];
    await dbSaveDeck(APP.user.id, APP.deck);
    navigate('home');
  } catch(e){
    console.error('confirmStarter error:', e);
    btn.disabled = false;
    inner.textContent = '✦ ELEGIR ESTA CARTA ✦';
    alert('Error: ' + e.message);
  }
}

// ============================================================
//  COLECCIÓN
// ============================================================
function renderMyCollection(){
  const cards = APP.collection.map(id => cardById(id)).filter(Boolean);
  document.getElementById('coll-count').textContent = cards.length+' cartas';
  document.getElementById('coll-grid').innerHTML = cards.length
    ? cards.map(c => buildCard(c,'view',false)).join('')
    : emptyMsg('SIN CARTAS AÚN');
}

function emptyMsg(txt){
  return `<div style="grid-column:1/-1;padding:2rem;text-align:center;color:rgba(255,255,255,.3);font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;">${txt}</div>`;
}

// ============================================================
//  MAZO
// ============================================================
function renderDeck(){
  APP.deckSel = [...APP.deck];
  renderDeckGrid();
}
function renderDeckGrid(){
  const cards = APP.collection.map(id => cardById(id)).filter(Boolean);
  document.getElementById('deck-count').textContent = APP.deckSel.length+'/3';
  document.getElementById('deck-grid').innerHTML = cards.length
    ? cards.map(c => buildCard(c,'deck', APP.deckSel.includes(c.id))).join('')
    : emptyMsg('NO TIENES CARTAS');
}
function toggleDeck(id){
  const idx = APP.deckSel.indexOf(id);
  if(idx>=0){ APP.deckSel.splice(idx,1); }
  else if(APP.deckSel.length<3){ APP.deckSel.push(id); }
  renderDeckGrid();
}
async function saveDeck(){
  APP.deck = [...APP.deckSel];
  try {
    await dbSaveDeck(APP.user.id, APP.deck);
    navigate('home');
  } catch(e){ alert('Error guardando mazo: '+e.message); }
}

// ============================================================
//  PICK BATALLA
// ============================================================
function renderPick(){
  const deckCards = APP.deck.map(id => cardById(id)).filter(Boolean);
  document.getElementById('pick-grid').innerHTML = deckCards.length
    ? deckCards.map(c => buildCard(c,'pick', APP.sel===c.id)).join('')
    : emptyMsg('TU MAZO ESTÁ VACÍO — VE A ⚙ MI MAZO');
}
function pickCard(id){
  APP.sel = id;
  document.getElementById('fight-btn').disabled = false;
  renderPick();
}

// ============================================================
//  PERFIL
// ============================================================
async function loadProfile(){
  const p = APP.profile;
  document.getElementById('prof-avatar').textContent = p.nickname.slice(0,2).toUpperCase();
  document.getElementById('prof-nick').textContent   = p.nickname;
  document.getElementById('prof-level').textContent  = 'Nivel '+p.level;
  const needed = xpForLevel(p.level);
  document.getElementById('prof-xpfill').style.width = Math.min(100,Math.round(p.xp/needed*100))+'%';
  document.getElementById('prof-xplbl').textContent  = p.xp+' / '+needed+' XP';
  try {
    const [stats, history] = await Promise.all([dbGetStats(APP.user.id), dbGetBattleHistory(APP.user.id)]);
    document.getElementById('st-total').textContent  = stats.total;
    document.getElementById('st-wins').textContent   = stats.wins;
    document.getElementById('st-losses').textContent = stats.losses;
    document.getElementById('st-cards').textContent  = APP.collection.length;
    const bh = document.getElementById('battle-history');
    bh.innerHTML = history.length
      ? history.map(b => {
          const pc = cardById(b.player_card), ec = cardById(b.enemy_card);
          return `<div class="bh-row"><span class="bh-result ${b.result}">${b.result==='win'?'VICTORIA':'DERROTA'}</span><div class="bh-info">${pc?pc.name:'?'} vs ${ec?ec.name:'?'}</div><span class="bh-xp">+${b.xp_earned} XP</span></div>`;
        }).join('')
      : '<div style="font-size:13px;color:rgba(255,255,255,.3);padding:.5rem 0">Sin batallas aún</div>';
  } catch(e){ console.error(e); }
}

// ============================================================
//  RENDER CARTA
// ============================================================
function buildCard(card, mode, selected){
  const fadeMap = {legendario:'#1a1200',epico:'#120020',raro:'#001520',comun:'#141414'};
  const fade  = fadeMap[card.rarity]||'#141414';
  const stars = RARITY_STARS[card.rarity]||'';
  const imgHtml = card.image
    ? `<img class="card-photo" src="${card.image}" alt="${card.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="card-emo" style="display:none">${card.emoji}</div>`
    : `<div class="card-emo">${card.emoji}</div>`;
  const statsHtml = Object.entries(card.stats).map(([k,v])=>`
    <div class="stat-row">
      <span class="sname">${k}</span>
      <div class="strack"><div class="sfill" style="width:${v}%;background:${BAR_COLORS[k]||'linear-gradient(90deg,#aaa,#fff)'}"></div></div>
      <span class="snum">${v}</span>
    </div>`).join('');
  const alliesHtml  = card.aliados&&card.aliados.length  ? `<div style="margin-top:6px"><div class="slbl">ALIADOS</div><div class="chips-row">${card.aliados.map(a=>`<span class="achip">${a}</span>`).join('')}</div></div>` : '';
  const enemiesHtml = card.enemigos&&card.enemigos.length ? `<div style="margin-top:4px"><div class="slbl">ENEMIGOS</div><div class="chips-row">${card.enemigos.map(e=>`<span class="echip">${e}</span>`).join('')}</div></div>` : '';
  const deckBadge   = (mode==='deck'&&selected) ? '<div class="deck-badge">EN MAZO</div>' : '';
  const clickFns    = {pick:`onclick="pickCard(${card.id})"`, starter:`onclick="pickStarter(${card.id})"`, deck:`onclick="toggleDeck(${card.id})"`};
  const clickFn     = clickFns[mode]||'';
  return `<div class="pcard ${card.rarity}${selected?' selected':''}${mode==='deck'&&selected?' in-deck':''}${mode==='view'?' no-pick':''}" ${clickFn} style="--fade-to:${fade}">
    <div class="card-img-zone">
      <div class="card-dots"></div><div class="card-glow"></div>
      <div class="card-top"><span class="rpill">${stars} ${card.rarity.toUpperCase()}</span><span class="hppill">❤ ${card.maxHp}</span></div>
      ${deckBadge}${imgHtml}
    </div>
    <div class="card-body">
      <div class="cname-row"><div class="cname">${card.name}</div>${card.age?`<div class="cage">${card.age}</div>`:''}</div>
      <div class="crole">${card.role}</div>
      <div class="chips">
        ${card.kryptonita?`<div class="chip krypto"><span class="cl">☠ KRYPTONITA</span><span class="cv">${card.kryptonita}</span></div>`:''}
        ${card.special?`<div class="chip spec"><span class="cl">⚡ HABILIDAD</span><span class="cv">${card.special}</span></div>`:''}
      </div>
      <div class="div"></div>${statsHtml}${alliesHtml}${enemiesHtml}
    </div>
  </div>`;
}

// ============================================================
//  BATALLA
// ============================================================
function getMainStat(c){ return Math.max(...Object.values(c.stats)); }
function calcDmg(a,sk){ return Math.round(getMainStat(a)*sk.power*(0.85+Math.random()*0.3)); }

function startBattle(){
  const p = dc(cardById(APP.sel));
  const e = dc(ENEMY_CARDS[Math.floor(Math.random()*ENEMY_CARDS.length)]);
  p.mana=0;p.maxMana=3;e.mana=0;e.maxMana=3;
  APP.battlePlayer=p;APP.battleEnemy=e;APP.turn='player';APP.stunned=false;
  showScreen('screen-battle');
  document.getElementById('log-box').innerHTML='';
  updateArena();renderSkillBtns();
  addLog(`¡${p.name} VS ${e.name}! ¡QUE EMPIECE!`,'lsys');
}

function updateArena(){
  const p=APP.battlePlayer,e=APP.battleEnemy;
  document.getElementById('b-p-emoji').textContent=p.image?'':p.emoji;
  document.getElementById('b-p-name').textContent=p.name;
  document.getElementById('b-p-hp').textContent=`HP: ${Math.max(0,p.hp)} / ${p.maxHp}`;
  document.getElementById('b-p-bar').style.width=Math.max(0,p.hp/p.maxHp*100)+'%';
  document.getElementById('b-e-emoji').textContent=e.image?'':e.emoji;
  document.getElementById('b-e-name').textContent=e.name;
  document.getElementById('b-e-hp').textContent=`HP: ${Math.max(0,e.hp)} / ${e.maxHp}`;
  document.getElementById('b-e-bar').style.width=Math.max(0,e.hp/e.maxHp*100)+'%';
  renderMana('b-p-mana',p.mana,p.maxMana);
  renderMana('b-e-mana',e.mana,e.maxMana);
  const tb=document.getElementById('turn-badge');
  tb.textContent=APP.turn==='player'?'TU TURNO':'TURNO RIVAL';
  tb.className='turn-badge '+(APP.turn==='player'?'p':'e');
}

function renderMana(id,mana,max){
  const el=document.getElementById(id);el.innerHTML='';
  for(let i=0;i<max;i++){const d=document.createElement('div');d.className='mpip'+(i<mana?' on':'');el.appendChild(d);}
}

function renderSkillBtns(){
  const p=APP.battlePlayer,isP=APP.turn==='player';
  document.getElementById('skills-grid').innerHTML=p.skills.map(sk=>`
    <button class="skbtn" onclick="useSkill('${sk.id}')" ${(!isP||p.mana<sk.cost)?'disabled':''}>
      <span class="skn">${sk.name}<span class="skc">${sk.cost>0?'●'.repeat(sk.cost):'FREE'}</span></span>
      <span class="skd">${sk.desc||({attack:'Ataque',special:'Especial',heal:'Curación',ultimate:'Ultimátum'}[sk.type]||sk.type)}</span>
    </button>`).join('');
}

function addLog(msg,cls=''){
  const lb=document.getElementById('log-box');
  const p=document.createElement('p');p.className='lline '+cls;p.textContent=msg;lb.prepend(p);
}

function useSkill(sid){
  if(APP.turn!=='player')return;
  const p=APP.battlePlayer,e=APP.battleEnemy;
  const sk=p.skills.find(s=>s.id===sid);
  if(!sk||p.mana<sk.cost)return;
  p.mana-=sk.cost;
  if(['attack','special','ultimate'].includes(sk.type)){
    const dmg=calcDmg(p,sk);e.hp-=dmg;
    addLog(`${p.name} usa ${sk.name} → ${dmg} de daño!`,'lhit');
    if(sk.type==='special'){addLog('✦ Rival aturdido!','lspec');APP.stunned=true;}
    if(sk.type==='ultimate') addLog('☄ ¡ULTIMÁTUM!','lspec');
  } else if(sk.type==='heal'){
    p.hp=Math.min(p.maxHp,p.hp+sk.power);
    addLog(`${p.name} se cura ${sk.power} HP!`,'lheal');
  }
  p.mana=Math.min(p.maxMana,p.mana+1);
  updateArena();
  if(e.hp<=0){endBattle(true);return;}
  APP.turn='enemy';renderSkillBtns();updateArena();
  setTimeout(enemyTurn,1000);
}

function enemyTurn(){
  const p=APP.battlePlayer,e=APP.battleEnemy;
  if(APP.stunned){APP.stunned=false;addLog(`${e.name} está aturdido!`,'lmiss');e.mana=Math.min(e.maxMana,e.mana+1);APP.turn='player';updateArena();renderSkillBtns();return;}
  const avail=e.skills.filter(s=>e.mana>=s.cost);
  const sk=pickEnemySkill(e,avail);
  e.mana-=sk.cost;
  if(sk.type==='heal'){e.hp=Math.min(e.maxHp,e.hp+sk.power);addLog(`${e.name} se cura ${sk.power} HP!`,'lheal');}
  else{const dmg=calcDmg(e,sk);p.hp-=dmg;addLog(`${e.name} usa ${sk.name} → ${dmg} de daño!`,'lhit');}
  e.mana=Math.min(e.maxMana,e.mana+1);
  updateArena();
  if(p.hp<=0){endBattle(false);return;}
  APP.turn='player';renderSkillBtns();updateArena();
}

function pickEnemySkill(e,avail){
  if(!avail.length)return e.skills[0];
  const heal=avail.find(s=>s.type==='heal');
  const ult =avail.find(s=>s.type==='ultimate');
  if(heal&&e.hp/e.maxHp<0.35&&Math.random()<0.7)return heal;
  if(ult&&Math.random()<0.25)return ult;
  return avail[Math.floor(Math.random()*avail.length)];
}

async function endBattle(win){
  const xpEarned=win?XP_WIN:XP_LOSS;
  showScreen('screen-result');
  document.getElementById('r-icon').textContent =win?'🏆':'💀';
  document.getElementById('r-title').textContent=win?'¡VICTORIA!':'DERROTA';
  document.getElementById('r-sub').textContent  =win?`${APP.battlePlayer.name} destruyó a ${APP.battleEnemy.name}`:`${APP.battleEnemy.name} te eliminó.`;
  document.getElementById('xp-earned-box').style.display='inline-block';
  document.getElementById('xp-earned-txt').textContent=`+${xpEarned} XP`;
  document.getElementById('levelup-banner').style.display='none';
  try{
    await dbSaveBattle(APP.user.id,APP.battlePlayer.id,APP.battleEnemy.id,win?'win':'loss',xpEarned);
    let xp=APP.profile.xp+xpEarned, lvl=APP.profile.level;
    if(xp>=xpForLevel(lvl)){xp-=xpForLevel(lvl);lvl++;document.getElementById('new-level').textContent=lvl;document.getElementById('levelup-banner').style.display='block';}
    APP.profile.xp=xp;APP.profile.level=lvl;
    await dbUpdateXP(APP.user.id,xp,lvl);
    updateHomeBadge();
  }catch(e){console.error(e);}
}

// ============================================================
//  RANKING
// ============================================================
async function loadRanking(){
  const list = document.getElementById('ranking-list');
  list.innerHTML = '<div class="ranking-loading">Cargando...</div>';
  try {
    const rows = await dbGetRanking(50);
    if(!rows.length){
      list.innerHTML = '<div class="ranking-loading">Sin jugadores aún</div>';
      return;
    }

    const myNick = APP.profile?.nickname;
    const myPos  = rows.findIndex(r => r.nickname === myNick);

    let html = '';
    rows.forEach((r, i) => {
      const pos    = i + 1;
      const posClass = pos===1?'p1':pos===2?'p2':pos===3?'p3':'pn';
      const rowClass = pos<=3 ? `pos-${pos}` : '';
      const posIcon  = pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':pos;
      const isMe     = r.nickname === myNick;
      const needed   = xpForLevel(r.level);
      html += `<div class="ranking-row ${rowClass}">
        <div class="rank-pos ${posClass}">${posIcon}</div>
        <div class="rank-player">
          <span class="rank-nick${isMe?' is-me':''}">${r.nickname}${isMe?' ◀':''}</span>
          <span class="rank-sub">NIVEL ${r.level}</span>
        </div>
        <div class="rank-level">Nv.${r.level}</div>
        <div class="rank-xp">${r.xp} XP</div>
      </div>`;
    });

    // Si el jugador actual no está en top 50, mostrar su posición abajo
    if(myPos === -1 && APP.profile){
      html += `<div style="height:60px"></div>`;
    }

    list.innerHTML = html;

    // Si estoy fuera del top visible, añadir fila sticky al fondo
    if(myPos === -1 && APP.profile){
      const p = APP.profile;
      list.insertAdjacentHTML('beforeend', `
        <div class="ranking-me-row">
          <div class="rank-pos pn">?</div>
          <div class="rank-player">
            <span class="rank-nick is-me">${p.nickname} ◀</span>
            <span class="rank-sub">NIVEL ${p.level}</span>
          </div>
          <div class="rank-level">Nv.${p.level}</div>
          <div class="rank-xp">${p.xp} XP</div>
        </div>`);
    }

  } catch(e){
    list.innerHTML = `<div class="ranking-loading">Error cargando ranking</div>`;
    console.error(e);
  }
}
