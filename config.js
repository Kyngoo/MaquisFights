// ============================================================
//  CARD CLASH — CONFIGURACIÓN SUPABASE
//  1. Ve a https://supabase.com y crea un proyecto gratis
//  2. En Settings → API copia tu URL y anon key
//  3. Pega los valores aquí
// ============================================================

const SUPABASE_URL  = 'https://TU_PROYECTO.supabase.co';   // <-- cambia esto
const SUPABASE_ANON = 'TU_ANON_KEY';                        // <-- cambia esto

// XP que se gana por batalla
const XP_WIN  = 30;
const XP_LOSS = 10;

// XP necesario para subir de nivel
function xpForLevel(lvl){ return lvl * 100; }

