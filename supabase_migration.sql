-- ============================================================
--  MAQUIS FIGHTS — Migración v2
--  Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- ---- ARENAS ----
CREATE TABLE arenas (
  id            int  PRIMARY KEY,
  name          text NOT NULL,
  cups_required int  NOT NULL DEFAULT 0,
  description   text
);

INSERT INTO arenas VALUES
  (1, 'Arena del Barrio',     0,    'El inicio de todo'),
  (2, 'Arena Local',          300,  'Subes de nivel'),
  (3, 'Arena Élite',          700,  'La cosa se pone seria'),
  (4, 'Arena de los Pros',    1200, 'Solo los mejores'),
  (5, 'Arena Legendaria',     2000, 'Territorio épico'),
  (6, 'Arena Maquis',         3000, 'La cima');
-- Cambia los nombres cuando los tengas decididos

-- ---- CARDS ----
CREATE TABLE cards (
  id           int  PRIMARY KEY,
  name         text NOT NULL,
  role         text,
  emoji        text DEFAULT '🃏',
  image        text,
  rarity       text NOT NULL CHECK (rarity IN ('comun','raro','epico','legendario')),
  hp           int  NOT NULL,
  age          text,
  kryptonita   text,
  special      text,
  aliados      text[] DEFAULT '{}',
  enemigos     text[] DEFAULT '{}',
  stats        jsonb NOT NULL DEFAULT '{}',
  skills       jsonb NOT NULL DEFAULT '[]',
  arena_unlock int  NOT NULL DEFAULT 1 REFERENCES arenas(id),
  type         text NOT NULL DEFAULT 'player' CHECK (type IN ('player','enemy')),
  active       bool NOT NULL DEFAULT true
);

-- Migrar las 2 cartas actuales de cards.js
INSERT INTO cards VALUES
(
  1, 'DJ ORTIZ', 'BDM Beats · Maestro del Flow', '🎧', null, 'legendario',
  130, '40 palos', 'Ensalada 🥗', 'Consolador de Lado',
  ARRAY['Cipri','Dinoteta','Maquis'], ARRAY['Julio','Scruffy','Fat C'],
  '{"PODER":80,"FLOW":90,"RESPECT":65,"TROLLEO":55}',
  '[{"id":"atk","name":"Scratch Fatal","desc":"Ataque con el plato","type":"attack","cost":0,"power":1.0},{"id":"sp1","name":"Drop Letal","desc":"Daño masivo + aturde","type":"special","cost":2,"power":1.9},{"id":"sp2","name":"Cerveza Mahou","desc":"Cura 35 HP","type":"heal","cost":1,"power":35},{"id":"sp3","name":"Set de 4 Horas","desc":"Ultimátum devastador","type":"ultimate","cost":3,"power":2.8}]',
  1, 'player', true
),
(
  2, 'RPELIRROJO', 'Streamer · Rebelde con Causa', '🏏', null, 'epico',
  105, '27 años', 'Carnet de conducir 🪪', 'Golpe de Gomaespuma',
  ARRAY['Alien','Dinoteta','Cipri'], ARRAY['DjOrtiz','Maquis'],
  '{"FUERZA":80,"RABIA":65,"VELOCIDAD":60,"AGRESIVIDAD":75}',
  '[{"id":"atk","name":"Gomaespumazo","desc":"Ataque básico","type":"attack","cost":0,"power":1.0},{"id":"sp1","name":"Rabia Roja","desc":"Daño x2 + crítico","type":"special","cost":2,"power":2.1},{"id":"sp2","name":"Energy Drink","desc":"Cura 25 HP","type":"heal","cost":1,"power":25},{"id":"sp3","name":"Berserker Mode","desc":"Destrucción total","type":"ultimate","cost":3,"power":3.0}]',
  1, 'player', true
),
-- Cartas enemigas
(
  101, 'EL ALGORITMO', 'IA · Sin Piedad', '🤖', null, 'legendario',
  160, 'Eterno', 'Desenchufar 🔌', 'Singularidad',
  ARRAY[]::text[], ARRAY['Todos'],
  '{"PODER":95,"FLOW":90,"RESPECT":40,"TROLLEO":50}',
  '[{"id":"atk","name":"Procesamiento","desc":"","type":"attack","cost":0,"power":1.2},{"id":"sp1","name":"Overheat","desc":"","type":"special","cost":2,"power":2.1},{"id":"sp2","name":"Reinicio","desc":"","type":"heal","cost":1,"power":45},{"id":"sp3","name":"Singularidad","desc":"","type":"ultimate","cost":3,"power":3.3}]',
  1, 'enemy', true
),
(
  102, 'JEFE ANTIGUO', 'Manager · Microgestor Pro', '👔', null, 'epico',
  135, '52 años', 'KPIs negativos 📉', 'Reunión de 3 horas',
  ARRAY[]::text[], ARRAY['Todo el equipo'],
  '{"PODER":75,"FLOW":55,"RESPECT":85,"TROLLEO":60}',
  '[{"id":"atk","name":"Email en CC","desc":"","type":"attack","cost":0,"power":1.1},{"id":"sp1","name":"Microgestión","desc":"","type":"special","cost":2,"power":1.8},{"id":"sp2","name":"Subida de Sueldo","desc":"","type":"heal","cost":1,"power":38},{"id":"sp3","name":"Reestructuración","desc":"","type":"ultimate","cost":3,"power":2.6}]',
  1, 'enemy', true
),
(
  103, 'INTERN REBELDE', 'Becario · Caos Ambulante', '😈', null, 'raro',
  85, '20 años', 'Código legacy 💀', 'Merge sin Review',
  ARRAY[]::text[], ARRAY['Senior Devs'],
  '{"PODER":70,"FLOW":95,"RESPECT":30,"TROLLEO":99}',
  '[{"id":"atk","name":"Pull Request","desc":"","type":"attack","cost":0,"power":0.9},{"id":"sp1","name":"Merge sin Review","desc":"","type":"special","cost":2,"power":2.2},{"id":"sp2","name":"Café Doble","desc":"","type":"heal","cost":1,"power":22},{"id":"sp3","name":"Reescribir Todo","desc":"","type":"ultimate","cost":3,"power":2.9}]',
  1, 'enemy', true
);

-- ---- SKINS DE CARTAS ----
CREATE TABLE card_skins (
  id       serial PRIMARY KEY,
  card_id  int  NOT NULL REFERENCES cards(id),
  name     text NOT NULL,
  image    text,
  emoji    text
);

-- ---- TIPOS DE COFRE ----
CREATE TABLE chest_types (
  id             serial PRIMARY KEY,
  name           text  NOT NULL,
  cost_coins     int   NOT NULL DEFAULT 0,
  is_daily       bool  NOT NULL DEFAULT false,
  rarity_weights jsonb NOT NULL DEFAULT '{"comun":70,"raro":20,"epico":8,"legendario":2}',
  coins_min      int   NOT NULL DEFAULT 10,
  coins_max      int   NOT NULL DEFAULT 30
);

INSERT INTO chest_types (name, cost_coins, is_daily, rarity_weights, coins_min, coins_max) VALUES
  ('Cofre Diario',  0,   true,  '{"comun":60,"raro":25,"epico":12,"legendario":3}',  20, 60),
  ('Cofre Bronce',  100, false, '{"comun":55,"raro":28,"epico":13,"legendario":4}',  30, 80),
  ('Cofre Plata',   300, false, '{"comun":40,"raro":30,"epico":22,"legendario":8}',  60, 150),
  ('Cofre Oro',     700, false, '{"comun":20,"raro":30,"epico":35,"legendario":15}', 100, 300);

-- ---- MISIONES ----
CREATE TABLE missions (
  id            serial PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  type          text NOT NULL,
  target        int  NOT NULL DEFAULT 1,
  reward_coins  int  NOT NULL DEFAULT 0,
  reward_skin_id int REFERENCES card_skins(id),
  active        bool NOT NULL DEFAULT true
);

INSERT INTO missions (title, description, type, target, reward_coins) VALUES
  ('Primera Victoria',   'Gana tu primer combate',          'win_battles',  1,   50),
  ('En Racha',           'Gana 5 combates',                 'win_battles',  5,   150),
  ('Guerrero',           'Gana 20 combates',                'win_battles',  20,  400),
  ('Coleccionista',      'Consigue 5 cartas',               'collect_cards',5,   100),
  ('Abre Cofres',        'Abre 3 cofres',                   'open_chests',  3,   80),
  ('Sube de Arena',      'Alcanza la Arena 2',              'reach_arena',  2,   200);

-- ---- MODIFICAR PROFILES ----
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cups   int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS arena  int NOT NULL DEFAULT 1 REFERENCES arenas(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins  int NOT NULL DEFAULT 100;

-- ---- PROGRESO DE MISIONES ----
CREATE TABLE player_missions (
  id         serial PRIMARY KEY,
  player_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id int  NOT NULL REFERENCES missions(id),
  progress   int  NOT NULL DEFAULT 0,
  completed  bool NOT NULL DEFAULT false,
  claimed    bool NOT NULL DEFAULT false,
  UNIQUE(player_id, mission_id)
);

-- ---- SKINS DEL JUGADOR ----
CREATE TABLE player_skins (
  player_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skin_id   int  NOT NULL REFERENCES card_skins(id),
  PRIMARY KEY (player_id, skin_id)
);

-- ---- COFRES ABIERTOS ----
CREATE TABLE chest_history (
  id           serial PRIMARY KEY,
  player_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chest_type   int  NOT NULL REFERENCES chest_types(id),
  card_id      int  REFERENCES cards(id),
  coins_earned int  NOT NULL DEFAULT 0,
  opened_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- COFRE DIARIO (control anti-repetición) ----
CREATE TABLE daily_claims (
  player_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claimed_at date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (player_id, claimed_at)
);

-- ---- RLS: habilitar seguridad por fila ----
ALTER TABLE cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE arenas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chest_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_skins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chest_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_claims   ENABLE ROW LEVEL SECURITY;

-- Tablas públicas (lectura para todos los autenticados)
CREATE POLICY "cards_read"       ON cards       FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "arenas_read"      ON arenas      FOR SELECT TO authenticated USING (true);
CREATE POLICY "chest_types_read" ON chest_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "missions_read"    ON missions    FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "card_skins_read"  ON card_skins  FOR SELECT TO authenticated USING (true);

-- Tablas del jugador (solo su propio registro)
CREATE POLICY "pm_read"   ON player_missions FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "pm_insert" ON player_missions FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
CREATE POLICY "pm_update" ON player_missions FOR UPDATE TO authenticated USING (player_id = auth.uid());

CREATE POLICY "ps_read"   ON player_skins FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "ps_insert" ON player_skins FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE POLICY "ch_read"   ON chest_history FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "ch_insert" ON chest_history FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE POLICY "dc_read"   ON daily_claims FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "dc_insert" ON daily_claims FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
