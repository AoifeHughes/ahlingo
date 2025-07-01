import SQLite, {
  Database as SQLiteDatabase,
} from 'react-native-sqlite-storage';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';
import { migrateChatNameColumn } from './SimpleDatabaseService';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
};

const safeCloseDatabase = async (db: SQLiteDatabase | null): Promise<void> => {
  if (!db) return;

  try {
    try {
      await withTimeout(db.executeSql('ROLLBACK'), 2000);
    } catch (rollbackError) {
      const errorMsg =
        rollbackError instanceof Error
          ? rollbackError.message
          : String(rollbackError);
      if (
        !errorMsg.includes('database is locked') &&
        !errorMsg.includes('not an error')
      ) {
        console.log(
          'Rollback not needed or failed (this is usually normal):',
          errorMsg
        );
      }
    }

    await new Promise(resolve => setTimeout(resolve, 50));
    await withTimeout(db.close(), 3000);
    console.log('✅ Database closed safely');
  } catch (closeError) {
    const errorMsg =
      closeError instanceof Error ? closeError.message : String(closeError);
    if (
      !errorMsg.includes('database is closed') &&
      !errorMsg.includes('invalid connection')
    ) {
      console.error('Error during safe database close:', errorMsg);
    }
  }
};

// Helper function to open database and ensure migrations are run
const openDatabaseWithMigrations = async (): Promise<SQLiteDatabase> => {
  const db = await withTimeout(
    SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    }),
    TIMEOUTS.CONNECTION
  );
  
  // Run migrations
  await migrateChatNameColumn(db);
  
  return db;
};

export interface ChatDetail {
  id: number;
  user_id: number;
  language: string;
  difficulty: string;
  model: string;
  chat_name?: string;
  created_at: string;
  last_updated?: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export const createChat = async (
  userId: number,
  language: string,
  difficulty: string,
  model: string = 'gpt-3.5-turbo',
  chatName: string = 'Unnamed chat'
): Promise<number | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    const result = await withTimeout(
      db.executeSql(SQL_QUERIES.CREATE_CHAT, [userId, language, difficulty, model, chatName]),
      TIMEOUTS.QUERY_MEDIUM
    );

    if (result && result[0] && result[0].insertId) {
      return result[0].insertId;
    }

    return null;
  } catch (error) {
    console.error('Failed to create chat:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getUserChats = async (userId: number): Promise<ChatDetail[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    const results = await withTimeout(
      db.executeSql(SQL_QUERIES.GET_USER_CHATS, [userId]),
      TIMEOUTS.QUERY_MEDIUM
    );

    const chats: ChatDetail[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        chats.push(results[0].rows.item(i));
      }
    }

    return chats;
  } catch (error) {
    console.error('Failed to get user chats:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getChatById = async (chatId: number): Promise<ChatDetail | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    const results = await withTimeout(
      db.executeSql(SQL_QUERIES.GET_CHAT_BY_ID, [chatId]),
      TIMEOUTS.QUERY_SHORT
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return null;
  } catch (error) {
    console.error('Failed to get chat by ID:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const updateChatTimestamp = async (chatId: number): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    await withTimeout(
      db.executeSql(SQL_QUERIES.UPDATE_CHAT_TIMESTAMP, [chatId]),
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat timestamp:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const updateChatModel = async (chatId: number, model: string): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    await withTimeout(
      db.executeSql(SQL_QUERIES.UPDATE_CHAT_MODEL, [model, chatId]),
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat model:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const updateChatName = async (chatId: number, chatName: string): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    await withTimeout(
      db.executeSql(SQL_QUERIES.UPDATE_CHAT_NAME, [chatName, chatId]),
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat name:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const deleteChat = async (chatId: number, userId: number): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    await withTimeout(
      db.executeSql(SQL_QUERIES.DELETE_CHAT_MESSAGES, [chatId]),
      TIMEOUTS.QUERY_MEDIUM
    );

    await withTimeout(
      db.executeSql(SQL_QUERIES.DELETE_CHAT, [chatId, userId]),
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const addChatMessage = async (
  chatId: number,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    await withTimeout(
      db.executeSql(SQL_QUERIES.ADD_CHAT_MESSAGE, [chatId, role, content]),
      TIMEOUTS.QUERY_SHORT
    );

    await withTimeout(
      db.executeSql(SQL_QUERIES.UPDATE_CHAT_TIMESTAMP, [chatId]),
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to add chat message:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getChatMessages = async (chatId: number): Promise<ChatMessage[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    const results = await withTimeout(
      db.executeSql(SQL_QUERIES.GET_CHAT_MESSAGES, [chatId]),
      TIMEOUTS.QUERY_MEDIUM
    );

    const messages: ChatMessage[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        messages.push(results[0].rows.item(i));
      }
    }

    return messages;
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getRecentChatForUser = async (userId: number): Promise<ChatDetail | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    db = await openDatabaseWithMigrations();

    const results = await withTimeout(
      db.executeSql(SQL_QUERIES.GET_RECENT_CHAT_FOR_USER, [userId]),
      TIMEOUTS.QUERY_SHORT
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return null;
  } catch (error) {
    console.error('Failed to get recent chat for user:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};