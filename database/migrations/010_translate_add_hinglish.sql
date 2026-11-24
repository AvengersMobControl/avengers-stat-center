-- Add Hinglish (hi-Latn) to saved translation languages (leader 2026-11-24). Widening only.
ALTER TABLE avengers_translate_private.language_preferences
  DROP CONSTRAINT IF EXISTS language_preferences_language_code_check,
  ADD CONSTRAINT language_preferences_language_code_check
    CHECK (language_code IN ('en','es','de','hu','nl','fr','pt','uk','pl','tr','ar','ar-TN','vi','ja','zh-TW','sv','hi','hi-Latn'));
