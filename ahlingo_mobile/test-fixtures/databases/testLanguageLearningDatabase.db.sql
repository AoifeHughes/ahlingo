PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE database_metadata (
  version INTEGER PRIMARY KEY
);
INSERT INTO database_metadata (version) VALUES (150);

CREATE TABLE languages (
  id INTEGER PRIMARY KEY,
  language TEXT NOT NULL UNIQUE
);
INSERT INTO languages (language) VALUES ('French'), ('Spanish');

CREATE TABLE difficulties (
  id INTEGER PRIMARY KEY,
  difficulty_level TEXT NOT NULL UNIQUE
);
INSERT INTO difficulties (difficulty_level) VALUES ('Beginner'), ('Intermediate');

CREATE TABLE topics (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL UNIQUE
);
INSERT INTO topics (topic) VALUES ('Basic greetings'), ('Travel essentials');

CREATE TABLE exercises_info (
  id INTEGER PRIMARY KEY,
  exercise_name TEXT NOT NULL UNIQUE,
  topic_id INTEGER NOT NULL,
  difficulty_id INTEGER NOT NULL,
  language_id INTEGER NOT NULL,
  exercise_type TEXT NOT NULL,
  lesson_id TEXT,
  has_been_validated BOOLEAN DEFAULT 0
);
INSERT INTO exercises_info (exercise_name, topic_id, difficulty_id, language_id, exercise_type, lesson_id, has_been_validated)
VALUES
  ('Pairs: Hello', 1, 1, 1, 'pairs', 'lesson-pairs', 1),
  ('Conversation: At the cafe', 2, 1, 1, 'conversation', 'lesson-convo', 1),
  ('Translation: Directions', 2, 2, 1, 'translation', 'lesson-translation', 1),
  ('Fill in the blank: Introductions', 1, 1, 1, 'fill_in_blank', 'lesson-fill', 1);

CREATE TABLE pair_exercises (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  language_1 TEXT NOT NULL,
  language_2 TEXT NOT NULL,
  language_1_content TEXT NOT NULL,
  language_2_content TEXT NOT NULL
);
INSERT INTO pair_exercises (exercise_id, language_1, language_2, language_1_content, language_2_content)
VALUES
  (1, 'English', 'French', 'Hello', 'Bonjour'),
  (1, 'English', 'French', 'Thank you', 'Merci');

CREATE TABLE conversation_exercises (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  conversation_order INTEGER,
  speaker TEXT NOT NULL,
  message TEXT NOT NULL
);
INSERT INTO conversation_exercises (exercise_id, conversation_order, speaker, message)
VALUES
  (2, 1, 'Alex', 'Bonjour !'),
  (2, 2, 'Julie', 'Bonjour, comment ça va ?');

CREATE TABLE translation_exercises (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  language_1 TEXT NOT NULL,
  language_2 TEXT NOT NULL,
  language_1_content TEXT NOT NULL,
  language_2_content TEXT NOT NULL
);
INSERT INTO translation_exercises (exercise_id, language_1, language_2, language_1_content, language_2_content)
VALUES (3, 'English', 'French', 'Where is the train station?', 'Où est la gare ?');

CREATE TABLE fill_in_blank_exercises (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  sentence TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  incorrect_1 TEXT NOT NULL,
  incorrect_2 TEXT NOT NULL,
  blank_position INTEGER NOT NULL,
  translation TEXT NOT NULL
);
INSERT INTO fill_in_blank_exercises (exercise_id, sentence, correct_answer, incorrect_1, incorrect_2, blank_position, translation)
VALUES (4, 'Bonjour, je _ Ana.', 'm''appelle', 'suis', 'ai', 2, 'Hello, I am Ana.');

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  last_login TEXT
);
INSERT INTO users (name, last_login) VALUES ('testuser', '2025-01-01T00:00:00Z');

CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  setting_name TEXT NOT NULL,
  setting_value TEXT NOT NULL
);
INSERT INTO user_settings (user_id, setting_name, setting_value)
VALUES
  (1, 'language', 'French'),
  (1, 'difficulty', 'Beginner'),
  (1, 'theme', 'frost');

CREATE TABLE user_exercise_attempts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  attempt_date TEXT NOT NULL
);
INSERT INTO user_exercise_attempts (user_id, exercise_id, is_correct, attempt_date)
VALUES (1, 1, 1, '2025-11-01T12:00:00Z');

CREATE TABLE conversation_summaries (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER NOT NULL,
  summary TEXT NOT NULL
);
INSERT INTO conversation_summaries (exercise_id, summary)
VALUES (2, 'Short greeting conversation.');

COMMIT;
