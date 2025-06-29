/**
 * Get the correct database path for both development and production Electron apps
 * This function is called from the main process, not the renderer
 */
export function getDatabasePath(): string {
  // In the renderer process, we'll use IPC to get the database path from the main process
  // This is just a placeholder that returns a string for TypeScript compatibility
  // The actual path will be provided via IPC communication
  return 'ipc://database-path';
}