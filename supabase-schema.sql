-- =============================================
-- NTC Coach — Schéma Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Table des sessions de chat
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id   TEXT NOT NULL,
  messages    JSONB DEFAULT '[]',
  score       JSONB DEFAULT '{"correct":0,"total":0}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes rapides par module
CREATE INDEX IF NOT EXISTS idx_sessions_module ON sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);

-- Table des scores par compétence
CREATE TABLE IF NOT EXISTS scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id   TEXT NOT NULL,
  correct     INTEGER DEFAULT 0,
  total       INTEGER DEFAULT 0,
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_module ON scores(module_id);

-- Vue agrégée pour le tableau de progression
CREATE OR REPLACE VIEW progression AS
SELECT
  module_id,
  SUM(correct)::INTEGER  AS total_correct,
  SUM(total)::INTEGER    AS total_questions,
  CASE
    WHEN SUM(total) > 0
    THEN ROUND((SUM(correct)::NUMERIC / SUM(total)) * 100, 1)
    ELSE 0
  END AS success_rate,
  COUNT(*)::INTEGER AS nb_sessions,
  MAX(created_at) AS last_activity
FROM scores
GROUP BY module_id;

-- RLS désactivé pour l'instant (pas d'auth)
-- À activer quand on ajoutera l'authentification
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Auth & profils utilisateurs
-- À exécuter dans l'éditeur SQL Supabase
-- =============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  score        JSONB DEFAULT '{"correct":0,"total":0,"byModule":{}}',
  parcours     JSONB DEFAULT '{}',
  game_stars   JSONB DEFAULT '{}',
  game_xp      INTEGER DEFAULT 0,
  exam_date    TEXT DEFAULT '',
  chat_history JSONB DEFAULT '[]',
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture profil propre"  ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Écriture profil propre" ON user_profiles FOR ALL    USING (auth.uid() = id);

-- Streak + SRS (added 2026-05-21)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak JSONB DEFAULT '{"count":0,"lastDate":"","longest":0}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS srs    JSONB DEFAULT '{}';
