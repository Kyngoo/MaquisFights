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
  if(error) throw error;
  return data; // null si el perfil aún no existe (trigger pendiente)
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
    .upsert({ player_id: playerId, card_id: cardId });
  if(error) throw error;
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
    .upsert({ player_id: playerId, card_ids: cardIds });
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
  // Top jugadores por nivel desc, luego xp desc
  const { data, error } = await getDB()
    .from('profiles')
    .select('nickname, level, xp')
    .order('level', { ascending: false })
    .order('xp',    { ascending: false })
    .limit(limit);
  if(error) throw error;
  return data;
}
