-- Saved translation language per Discord member (leader 2026-11-23). Additive only.
-- Stores just the Discord user ID and a language code from the site's 15-language list.
CREATE SCHEMA IF NOT EXISTS avengers_translate_private;
CREATE TABLE IF NOT EXISTS avengers_translate_private.language_preferences (
  discord_user_id text PRIMARY KEY CHECK (discord_user_id ~ '^[0-9]{17,22}$'),
  language_code text NOT NULL CHECK (language_code IN ('en','es','de','hu','nl','fr','pt','uk','pl','tr','ar','ar-TN','vi','ja','zh-TW')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON SCHEMA avengers_translate_private FROM PUBLIC;
REVOKE ALL ON avengers_translate_private.language_preferences FROM PUBLIC;
-- The Discord interactions endpoint connects with the Kraken runtime role; give it
-- only this table, and only read/insert/update (no delete, nothing else new).
GRANT USAGE ON SCHEMA avengers_translate_private TO avengers_kraken_runtime;
GRANT SELECT, INSERT, UPDATE ON avengers_translate_private.language_preferences TO avengers_kraken_runtime;
