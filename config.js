// ============================================================
//  CARD CLASH — CONFIGURACIÓN SUPABASE
//  1. Ve a https://supabase.com y crea un proyecto gratis
//  2. En Settings → API copia tu URL y anon key
//  3. Pega los valores aquí
// ============================================================

const SUPABASE_URL = 'https://mgcizeoreaucrxfieqwi.supabase.co';   // <-- cambia esto
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nY2l6ZW9yZWF1Y3J4ZmllcXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0ODUwODEsImV4cCI6MjA4OTA2MTA4MX0.QEhR2YR6xWty_u0-haHCB8Rnn8TCZgRBcrpr44ovo3Q';                        // <-- cambia esto

// XP que se gana por batalla
const XP_WIN = 30;
const XP_LOSS = 10;

// XP necesario para subir de nivel
function xpForLevel(lvl) { return lvl * 100; }

