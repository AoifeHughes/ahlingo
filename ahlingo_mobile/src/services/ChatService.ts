/**
 * Chat Service
 *
 * Handles all chat-related database operations using the modern database utilities
 */

import { executeQuery, executeSqlSingle, rowsToArray, getSingleRow } from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';
import { migrateChatNameColumn } from './ChatMigrationService';

// Ensure migrations are run on app startup
let migrationsRun = false;
const ensureMigrations = async (): Promise<void> => {
  if (!migrationsRun) {
    await migrateChatNameColumn();
    migrationsRun = true;
  }
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
  try {
    await ensureMigrations();

    const result = await executeSqlSingle(
      SQL_QUERIES.CREATE_CHAT,
      [userId, language, difficulty, model, chatName],
      TIMEOUTS.QUERY_MEDIUM
    );

    if (result && result.insertId) {
      return result.insertId;
    }

    return null;
  } catch (error) {
    console.error('Failed to create chat:', error);
    return null;
  }
};

export const getUserChats = async (userId: number): Promise<ChatDetail[]> => {
  try {
    await ensureMigrations();

    const result = await executeSqlSingle(
      SQL_QUERIES.GET_USER_CHATS,
      [userId],
      TIMEOUTS.QUERY_MEDIUM
    );

    if (result && result.rows) {
      return rowsToArray<ChatDetail>(result.rows);
    }

    return [];
  } catch (error) {
    console.error('Failed to get user chats:', error);
    return [];
  }
};

export const getChatById = async (chatId: number): Promise<ChatDetail | null> => {
  try {
    await ensureMigrations();

    const result = await executeSqlSingle(
      SQL_QUERIES.GET_CHAT_BY_ID,
      [chatId],
      TIMEOUTS.QUERY_SHORT
    );

    return getSingleRow<ChatDetail>(result);
  } catch (error) {
    console.error('Failed to get chat by ID:', error);
    return null;
  }
};

export const updateChatTimestamp = async (chatId: number): Promise<void> => {
  try {
    await ensureMigrations();

    await executeSqlSingle(
      SQL_QUERIES.UPDATE_CHAT_TIMESTAMP,
      [chatId],
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat timestamp:', error);
    throw error;
  }
};

export const updateChatModel = async (chatId: number, model: string): Promise<void> => {
  try {
    await ensureMigrations();

    await executeSqlSingle(
      SQL_QUERIES.UPDATE_CHAT_MODEL,
      [model, chatId],
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat model:', error);
    throw error;
  }
};

export const updateChatName = async (chatId: number, chatName: string): Promise<void> => {
  try {
    await ensureMigrations();

    await executeSqlSingle(
      SQL_QUERIES.UPDATE_CHAT_NAME,
      [chatName, chatId],
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to update chat name:', error);
    throw error;
  }
};

export const deleteChat = async (chatId: number, userId: number): Promise<void> => {
  try {
    await ensureMigrations();

    // Delete chat messages first
    await executeSqlSingle(
      SQL_QUERIES.DELETE_CHAT_MESSAGES,
      [chatId],
      TIMEOUTS.QUERY_MEDIUM
    );

    // Then delete the chat
    await executeSqlSingle(
      SQL_QUERIES.DELETE_CHAT,
      [chatId, userId],
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
};

export const addChatMessage = async (
  chatId: number,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<void> => {
  try {
    await ensureMigrations();

    // Add the message
    await executeSqlSingle(
      SQL_QUERIES.ADD_CHAT_MESSAGE,
      [chatId, role, content],
      TIMEOUTS.QUERY_SHORT
    );

    // Update chat timestamp
    await executeSqlSingle(
      SQL_QUERIES.UPDATE_CHAT_TIMESTAMP,
      [chatId],
      TIMEOUTS.QUERY_SHORT
    );
  } catch (error) {
    console.error('Failed to add chat message:', error);
    throw error;
  }
};

export const getChatMessages = async (chatId: number): Promise<ChatMessage[]> => {
  try {
    await ensureMigrations();

    const result = await executeSqlSingle(
      SQL_QUERIES.GET_CHAT_MESSAGES,
      [chatId],
      TIMEOUTS.QUERY_MEDIUM
    );

    if (result && result.rows) {
      return rowsToArray<ChatMessage>(result.rows);
    }

    return [];
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return [];
  }
};

export const getRecentChatForUser = async (userId: number): Promise<ChatDetail | null> => {
  try {
    await ensureMigrations();

    const result = await executeSqlSingle(
      SQL_QUERIES.GET_RECENT_CHAT_FOR_USER,
      [userId],
      TIMEOUTS.QUERY_SHORT
    );

    return getSingleRow<ChatDetail>(result);
  } catch (error) {
    console.error('Failed to get recent chat for user:', error);
    return null;
  }
};
