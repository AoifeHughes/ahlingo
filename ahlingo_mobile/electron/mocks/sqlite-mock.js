// Mock implementation of react-native-sqlite-storage for Electron
// In a production app, you would use a proper SQLite implementation for Electron
// such as better-sqlite3 or sql.js

const SQLite = {
  DEBUG: () => {},
  enablePromise: (enable) => {
    console.log('SQLite promise mode:', enable);
  },
  openDatabase: (config) => {
    console.warn('SQLite mock: Database operations are not implemented in Electron build');
    return {
      transaction: (fn) => {
        console.warn('SQLite mock: transaction called');
        return Promise.resolve();
      },
      executeSql: (sql, params) => {
        console.warn('SQLite mock: executeSql called:', sql);
        return Promise.resolve([]);
      },
      close: () => {
        console.warn('SQLite mock: close called');
        return Promise.resolve();
      }
    };
  }
};

export default SQLite;
