// Database configuration constants
export const DATABASE_CONFIG = {
  NAME: 'languageLearningDatabase.db',
  // Increment this version number whenever you update the database schema or content
  // The app will automatically replace the old database with the new one
  VERSION: 1,
} as const;

// Timeout constants
export const TIMEOUTS = {
  CONNECTION: 3000,
  QUERY_SHORT: 2000,
  QUERY_MEDIUM: 5000,
  QUERY_LONG: 7000,
  QUERY_EXTENDED: 10000,
} as const;

// SQL Query constants
export const SQL_QUERIES = {
  // Table introspection
  GET_TABLES:
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  GET_TABLE_INFO: (tableName: string) => `PRAGMA table_info("${tableName}");`,
  COUNT_ROWS: (tableName: string) =>
    `SELECT COUNT(*) as count FROM ${tableName}`,

  // User queries
  GET_USER_BY_NAME: 'SELECT id FROM users WHERE name = ?',
  CREATE_USER:
    'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
  UPDATE_USER_LOGIN:
    'UPDATE users SET last_login = datetime("now") WHERE name = ?',
  GET_RECENT_USER: 'SELECT name FROM users ORDER BY last_login DESC LIMIT 1',

  // Settings queries
  GET_USER_SETTINGS:
    'SELECT setting_name, setting_value FROM user_settings WHERE user_id = ?',
  UPSERT_USER_SETTING:
    'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',

  // Base data queries
  GET_LANGUAGES: 'SELECT * FROM languages ORDER BY language',
  GET_DIFFICULTIES: 'SELECT * FROM difficulties ORDER BY difficulty_level',
  GET_TOPICS: 'SELECT * FROM topics ORDER BY topic',

  // Exercise filtering templates
  GET_TOPICS_BY_TYPE: (exerciseType: string) => {
    const exerciseTableMap = {
      'pairs': 'pair_exercises pe',
      'conversation': 'conversation_exercises ce',
      'translation': 'translation_exercises te',
      'fill_in_blank': 'fill_in_blank_exercises fibe'
    };
    const joinTable = exerciseTableMap[exerciseType as keyof typeof exerciseTableMap] || 'pair_exercises pe';

    return `
      SELECT DISTINCT t.id, t.topic
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      JOIN ${joinTable} ON ei.id = ${joinTable.split(' ')[1]}.exercise_id
      WHERE l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = '${exerciseType}'
      ORDER BY t.topic
    `;
  },

  GET_RANDOM_EXERCISE: (exerciseType: string) => {
    const exerciseTableJoins = {
      'pairs': 'JOIN pair_exercises pe ON ei.id = pe.exercise_id',
      'conversation': 'JOIN conversation_exercises ce ON ei.id = ce.exercise_id',
      'translation': 'JOIN translation_exercises te ON ei.id = te.exercise_id',
      'fill_in_blank': 'JOIN fill_in_blank_exercises fibe ON ei.id = fibe.exercise_id'
    };
    const dataJoin = exerciseTableJoins[exerciseType as keyof typeof exerciseTableJoins] || 'JOIN pair_exercises pe ON ei.id = pe.exercise_id';

    return `
      SELECT DISTINCT ei.* FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      ${dataJoin}
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = '${exerciseType}'
      ORDER BY RANDOM()
      LIMIT 1
    `;
  },

  // Exercise data queries
  GET_PAIR_EXERCISES:
    'SELECT * FROM pair_exercises WHERE exercise_id = ? ORDER BY id',
  GET_CONVERSATION_EXERCISES:
    'SELECT * FROM conversation_exercises WHERE exercise_id = ? ORDER BY id',
  GET_TRANSLATION_EXERCISES:
    'SELECT * FROM translation_exercises WHERE exercise_id = ? ORDER BY id',
  GET_FILL_IN_BLANK_EXERCISES:
    'SELECT * FROM fill_in_blank_exercises WHERE exercise_id = ? ORDER BY id',
  GET_EXERCISES_BY_LESSON:
    'SELECT * FROM exercises_info WHERE lesson_id = ? AND exercise_type = "pairs" ORDER BY id',

  // Conversation specific queries
  GET_CONVERSATION_SUMMARY:
    'SELECT summary FROM conversation_summaries WHERE exercise_id = ?',
  GET_RANDOM_SUMMARIES:
    'SELECT summary FROM conversation_summaries WHERE exercise_id != ? ORDER BY RANDOM() LIMIT ?',
  GET_TOPIC_FOR_EXERCISE:
    'SELECT t.topic FROM exercises_info ei JOIN topics t ON ei.topic_id = t.id WHERE ei.id = ?',

  // Stats and progress queries
  RECORD_EXERCISE_ATTEMPT:
    'INSERT INTO user_exercise_attempts (user_id, exercise_id, is_correct, attempt_date) VALUES (?, ?, ?, datetime("now"))',

  GET_USER_STATS_BY_TOPIC: `
    SELECT
      t.topic,
      t.id as topic_id,
      COUNT(DISTINCT uea.exercise_id) as attempted_exercises,
      COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as correct_exercises,
      (
        -- Count non-pairs exercises normally
        COALESCE((
          SELECT COUNT(DISTINCT ei2.id)
          FROM exercises_info ei2
          JOIN languages l2 ON ei2.language_id = l2.id
          JOIN difficulties d2 ON ei2.difficulty_id = d2.id
          WHERE ei2.topic_id = t.id
            AND ei2.exercise_type != 'pairs'
            AND l2.language = ?
            AND d2.difficulty_level = ?
        ), 0) +
        -- Count pairs exercises only if they have data
        COALESCE((
          SELECT COUNT(DISTINCT pe.exercise_id)
          FROM exercises_info ei3
          JOIN languages l3 ON ei3.language_id = l3.id
          JOIN difficulties d3 ON ei3.difficulty_id = d3.id
          INNER JOIN pair_exercises pe ON ei3.id = pe.exercise_id
          WHERE ei3.topic_id = t.id
            AND ei3.exercise_type = 'pairs'
            AND l3.language = ?
            AND d3.difficulty_level = ?
        ), 0)
      ) as total_exercises
    FROM topics t
    LEFT JOIN exercises_info ei ON t.id = ei.topic_id
    LEFT JOIN languages l ON ei.language_id = l.id
    LEFT JOIN difficulties d ON ei.difficulty_id = d.id
    LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
    WHERE l.language = ? AND d.difficulty_level = ?
    GROUP BY t.id, t.topic
    HAVING (
      -- Count non-pairs exercises normally
      COALESCE((
        SELECT COUNT(DISTINCT ei2.id)
        FROM exercises_info ei2
        JOIN languages l2 ON ei2.language_id = l2.id
        JOIN difficulties d2 ON ei2.difficulty_id = d2.id
        WHERE ei2.topic_id = t.id
          AND ei2.exercise_type != 'pairs'
          AND l2.language = ?
          AND d2.difficulty_level = ?
      ), 0) +
      -- Count pairs exercises only if they have data
      COALESCE((
        SELECT COUNT(DISTINCT pe.exercise_id)
        FROM exercises_info ei3
        JOIN languages l3 ON ei3.language_id = l3.id
        JOIN difficulties d3 ON ei3.difficulty_id = d3.id
        INNER JOIN pair_exercises pe ON ei3.id = pe.exercise_id
        WHERE ei3.topic_id = t.id
          AND ei3.exercise_type = 'pairs'
          AND l3.language = ?
          AND d3.difficulty_level = ?
      ), 0)
    ) > 0
    ORDER BY t.topic
  `,

  GET_USER_PROGRESS_SUMMARY: `
    SELECT
      COUNT(DISTINCT uea.exercise_id) as total_attempted,
      COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as total_correct,
      (
        -- Count non-pairs exercises normally
        COALESCE((
          SELECT COUNT(DISTINCT ei2.id)
          FROM exercises_info ei2
          JOIN languages l2 ON ei2.language_id = l2.id
          JOIN difficulties d2 ON ei2.difficulty_id = d2.id
          WHERE ei2.exercise_type != 'pairs'
            AND l2.language = ?
            AND d2.difficulty_level = ?
        ), 0) +
        -- Count pairs exercises only if they have data
        COALESCE((
          SELECT COUNT(DISTINCT pe.exercise_id)
          FROM exercises_info ei3
          JOIN languages l3 ON ei3.language_id = l3.id
          JOIN difficulties d3 ON ei3.difficulty_id = d3.id
          INNER JOIN pair_exercises pe ON ei3.id = pe.exercise_id
          WHERE ei3.exercise_type = 'pairs'
            AND l3.language = ?
            AND d3.difficulty_level = ?
        ), 0)
      ) as total_available
    FROM exercises_info ei
    JOIN languages l ON ei.language_id = l.id
    JOIN difficulties d ON ei.difficulty_id = d.id
    LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
    WHERE l.language = ? AND d.difficulty_level = ?
  `,

  GET_FAILED_EXERCISES: `
    SELECT DISTINCT
      ei.id as exercise_id,
      ei.exercise_name,
      ei.exercise_type,
      t.topic,
      t.id as topic_id,
      d.difficulty_level,
      l.language,
      MAX(uea.attempt_date) as last_failed_date
    FROM user_exercise_attempts uea
    JOIN exercises_info ei ON uea.exercise_id = ei.id
    JOIN topics t ON ei.topic_id = t.id
    JOIN difficulties d ON ei.difficulty_id = d.id
    JOIN languages l ON ei.language_id = l.id
    WHERE uea.user_id = ?
      AND uea.is_correct = 0
      AND ei.id NOT IN (
        SELECT exercise_id
        FROM user_exercise_attempts
        WHERE user_id = ? AND is_correct = 1
      )
    GROUP BY ei.id, ei.exercise_name, ei.exercise_type, t.topic, t.id, d.difficulty_level, l.language
    ORDER BY last_failed_date DESC
  `,

  // Chat queries
  CREATE_CHAT:
    'INSERT INTO chat_details (user_id, language, difficulty, model, chat_name, created_at, last_updated) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',

  GET_USER_CHATS: `
    SELECT id, user_id, language, difficulty, model, chat_name, created_at, last_updated
    FROM chat_details
    WHERE user_id = ?
    ORDER BY last_updated DESC
  `,

  GET_CHAT_BY_ID:
    'SELECT id, user_id, language, difficulty, model, chat_name, created_at, last_updated FROM chat_details WHERE id = ?',

  UPDATE_CHAT_TIMESTAMP:
    'UPDATE chat_details SET last_updated = datetime("now") WHERE id = ?',

  UPDATE_CHAT_MODEL:
    'UPDATE chat_details SET model = ?, last_updated = datetime("now") WHERE id = ?',

  UPDATE_CHAT_NAME:
    'UPDATE chat_details SET chat_name = ?, last_updated = datetime("now") WHERE id = ?',

  DELETE_CHAT:
    'DELETE FROM chat_details WHERE id = ? AND user_id = ?',

  ADD_CHAT_MESSAGE:
    'INSERT INTO chat_histories (chat_id, role, content, timestamp) VALUES (?, ?, ?, datetime("now"))',

  GET_CHAT_MESSAGES: `
    SELECT id, chat_id, role, content, timestamp
    FROM chat_histories
    WHERE chat_id = ?
    ORDER BY timestamp ASC
  `,

  DELETE_CHAT_MESSAGES:
    'DELETE FROM chat_histories WHERE chat_id = ?',

  GET_RECENT_CHAT_FOR_USER: `
    SELECT id, user_id, language, difficulty, model, chat_name, created_at, last_updated
    FROM chat_details
    WHERE user_id = ?
    ORDER BY last_updated DESC
    LIMIT 1
  `,

  // Smart randomization queries
  GET_EXERCISES_EXCLUDING_RECENT: (exerciseType: string) => {
    const exerciseTableJoins = {
      'pairs': 'JOIN pair_exercises pe ON ei.id = pe.exercise_id',
      'conversation': 'JOIN conversation_exercises ce ON ei.id = ce.exercise_id',
      'translation': 'JOIN translation_exercises te ON ei.id = te.exercise_id',
      'fill_in_blank': 'JOIN fill_in_blank_exercises fibe ON ei.id = fibe.exercise_id'
    };
    const dataJoin = exerciseTableJoins[exerciseType as keyof typeof exerciseTableJoins] || 'JOIN pair_exercises pe ON ei.id = pe.exercise_id';

    return `
      SELECT DISTINCT ei.*, t.topic as topic_name
      FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      JOIN topics t ON ei.topic_id = t.id
      ${dataJoin}
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = ?
        AND ei.id NOT IN (${Array(10).fill('?').join(',')})
      ORDER BY RANDOM()
      LIMIT 1
    `;
  },

  GET_ALL_EXERCISES_FOR_SMART_SELECTION: (exerciseType: string) => {
    const exerciseTableJoins = {
      'pairs': 'JOIN pair_exercises pe ON ei.id = pe.exercise_id',
      'conversation': 'JOIN conversation_exercises ce ON ei.id = ce.exercise_id',
      'translation': 'JOIN translation_exercises te ON ei.id = te.exercise_id',
      'fill_in_blank': 'JOIN fill_in_blank_exercises fibe ON ei.id = fibe.exercise_id'
    };
    const dataJoin = exerciseTableJoins[exerciseType as keyof typeof exerciseTableJoins] || 'JOIN pair_exercises pe ON ei.id = pe.exercise_id';

    return `
      SELECT DISTINCT ei.*, t.topic as topic_name
      FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      JOIN topics t ON ei.topic_id = t.id
      ${dataJoin}
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = ?
      ORDER BY ei.id
    `;
  },

  GET_MIXED_EXERCISES_WITH_PRIORITY: (userId: number | null) => {
    if (userId) {
      return `
        SELECT ei.*, t.topic as topic_name,
               CASE WHEN uea.exercise_id IS NULL THEN 0 ELSE 1 END as attempted_priority
        FROM exercises_info ei
        JOIN languages l ON ei.language_id = l.id
        JOIN difficulties d ON ei.difficulty_id = d.id
        JOIN topics t ON ei.topic_id = t.id
        LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
        WHERE l.language = ?
          AND d.difficulty_level = ?
          AND ei.exercise_type IN ('pairs', 'conversation', 'translation', 'fill_in_blank')
        ORDER BY attempted_priority, RANDOM()
      `;
    } else {
      return `
        SELECT ei.*, t.topic as topic_name, 0 as attempted_priority
        FROM exercises_info ei
        JOIN languages l ON ei.language_id = l.id
        JOIN difficulties d ON ei.difficulty_id = d.id
        JOIN topics t ON ei.topic_id = t.id
        WHERE l.language = ?
          AND d.difficulty_level = ?
          AND ei.exercise_type IN ('pairs', 'conversation', 'translation', 'fill_in_blank')
        ORDER BY RANDOM()
      `;
    }
  },
} as const;
