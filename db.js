// ============================================================
//  CARD CLASH — CAPA DE BASE DE DATOS v2 (Supabase Auth)
// ============================================================

let _sb = null;
function getDB(){
  if(_sb) return _sb;
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ---- AUTH ----

async function dbRegister(nickname, password){
  // Usamos nickname@cardclash.app como email ficticio (Supabase Auth requiere email)
  const fakeEmail = nickname.toLowerCase() + '@cardclash.app';
  const { data, error } = await getDB().auth.signUp({
    email: fakeEmail,
    password,
    options: { data: { nickname } }  // guardado en raw_user_meta_data → trigger lo pasa a profiles
  });
  if(error) throw error;
  // Si no hay sesión, el proyecto tiene "Confirm email" activado con emails ficticios → login directo
  if(!data.session){
    const { data: d2, error: e2 } = await getDB().auth.signInWithPassword({ email: fakeEmail, password });
    if(e2) throw new Error('Activa auto-confirm en Supabase: Authentication → Providers → Email → desmarcar "Confirm email"');
    return d2.user;
  }
  return data.user;
}

async function dbLogin(nickname, password){
  const fakeEmail = nickname.toLowerCase() + '@cardclash.app';
  const { data, error } = await getDB().auth.signInWithPassword({ email: fakeEmail, password });
  if(error) throw error;
  return data.user;
}

async function dbLogout(){
  await getDB().auth.signOut();
}

async function dbGetSession(){
  const { data } = await getDB().auth.getSession();
  return data.session;
}

async function dbNicknameExists(nickname){
  const { data } = await getDB()
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle();
  return !!data;
}

// ---- PERFIL ----

async function dbGetProfile(userId){
  const { data, error } = await getDB()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  // PGRST116 = 0 filas → perfil aún no existe, no es un error real
  if(error && error.code !== 'PGRST116') throw error;
  return data; // null si el perfil aún no existe (trigger pendiente)
}

async function dbCreateProfile(userId, nickname){
  const { error } = await getDB()
    .from('profiles')
    .insert({ id: userId, nickname, xp: 0, level: 1 });
  // Si ya existe (race condition con el trigger) ignorar el error de duplicado
  if(error && error.code !== '23505') throw error;
}

async function dbUpdateXP(userId, xp, level){
  const { error } = await getDB()
    .from('profiles')
    .update({ xp, level })
    .eq('id', userId);
  if(error) throw error;
}

// ---- COLECCIÓN ----

async function dbGetCollection(playerId){
  const { data, error } = await getDB()
    .from('collections')
    .select('card_id')
    .eq('player_id', playerId)
    .order('obtained_at', { ascending: true });
  if(error) throw error;
  return data.map(r => r.card_id);
}

async function dbAddCard(playerId, cardId){
  const { error } = await getDB()
    .from('collections')
    .upsert({ player_id: playerId, card_id: cardId }, { onConflict: 'player_id,card_id', ignoreDuplicates: true });
  // 409 = ya existe (duplicado), no es un error real
  if(error && error.status !== 409) throw error;
}

// ---- MAZO ----

async function dbGetDeck(playerId){
  const { data, error } = await getDB()
    .from('decks')
    .select('card_ids')
    .eq('player_id', playerId)
    .maybeSingle();
  if(error) throw error;
  return data ? data.card_ids : [];
}

async function dbSaveDeck(playerId, cardIds){
  const { error } = await getDB()
    .from('decks')
    .upsert({ player_id: playerId, card_ids: cardIds }, { onConflict: 'player_id' });
  if(error) throw error;
}

// ---- BATALLAS ----

async function dbSaveBattle(playerId, playerCardId, enemyCardId, result, xpEarned){
  const { error } = await getDB()
    .from('battles')
    .insert({ player_id: playerId, player_card: playerCardId, enemy_card: enemyCardId, result, xp_earned: xpEarned });
  if(error) throw error;
}

async function dbGetBattleHistory(playerId){
  const { data, error } = await getDB()
    .from('battles')
    .select('*')
    .eq('player_id', playerId)
    .order('played_at', { ascending: false })
    .limit(20);
  if(error) throw error;
  return data;
}

async function dbGetStats(playerId){
  const { data, error } = await getDB()
    .from('battles')
    .select('result')
    .eq('player_id', playerId);
  if(error) throw error;
  const wins = data.filter(b => b.result === 'win').length;
  return { wins, losses: data.length - wins, total: data.length };
}

// ---- RANKING ----

async function dbGetRanking(limit = 20){
  const { data, error } = await getDB()
    .from('profiles')
    .select('nickname, level, xp, cups, arena')
    .order('cups',  { ascending: false })
    .order('level', { ascending: false })
    .limit(limit);
  if(error) throw error;
  return data;
}

// ---- CARTAS ----

async function dbGetAllCards(){
  const { data, error } = await getDB()
    .from('cards')
    .select('*')
    .eq('active', true);
  if(error) throw error;
  return data;
}

// ---- PERFIL (cups, coins, arena) ----

async function dbUpdateProfile(userId, fields){
  const { error } = await getDB()
    .from('profiles')
    .update(fields)
    .eq('id', userId);
  if(error) throw error;
}

// ---- COFRES ----

async function dbGetChestTypes(){
  const { data, error } = await getDB()
    .from('chest_types')
    .select('*')
    .order('id');
  if(error) throw error;
  return data;
}

async function dbCanClaimDaily(userId){
  const today = new Date().toISOString().slice(0,10);
  const { data } = await getDB()
    .from('daily_claims')
    .select('claimed_at')
    .eq('player_id', userId)
    .eq('claimed_at', today)
    .maybeSingle();
  return !data; // true si puede reclamar
}

async function dbClaimDaily(userId){
  const today = new Date().toISOString().slice(0,10);
  const { error } = await getDB()
    .from('daily_claims')
    .insert({ player_id: userId, claimed_at: today });
  if(error) throw error;
}

async function dbSaveChestOpen(userId, chestTypeId, cardId, coinsEarned){
  const { error } = await getDB()
    .from('chest_history')
    .insert({ player_id: userId, chest_type: chestTypeId, card_id: cardId, coins_earned: coinsEarned });
  if(error) throw error;
}

// ---- MISIONES ----

async function dbGetMissions(){
  const { data, error } = await getDB()
    .from('missions')
    .select('*')
    .eq('active', true);
  if(error) throw error;
  return data;
}

async function dbGetPlayerMissions(userId){
  const { data, error } = await getDB()
    .from('player_missions')
    .select('*, missions(*)')
    .eq('player_id', userId);
  if(error) throw error;
  return data;
}

async function dbProgressMission(userId, missionId, progress, completed){
  const { error } = await getDB()
    .from('player_missions')
    .upsert({ player_id: userId, mission_id: missionId, progress, completed }, { onConflict: 'player_id,mission_id' });
  if(error) throw error;
}
