// Type declarations for react-native-sqlite-storage
declare module 'react-native-sqlite-storage' {
  export interface Transaction {
    executeSql(
      statement: string,
      params?: any[],
      success?: (tx: Transaction, results: ResultSet) => void,
      error?: (tx: Transaction, error: any) => void
    ): void;
  }

  export interface ResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item(index: number): any;
      raw(): any[];
    };
  }

  export interface Database {
    transaction(
      fn: (tx: Transaction) => void,
      error?: (error: any) => void,
      success?: () => void
    ): void;
    readTransaction(
      fn: (tx: Transaction) => void,
      error?: (error: any) => void,
      success?: () => void
    ): void;
    close(success?: () => void, error?: (error: any) => void): Promise<void>;
    executeSql(
      statement: string,
      params?: any[],
      success?: (results: ResultSet) => void,
      error?: (error: any) => void
    ): Promise<ResultSet[]>;
  }

  export interface SQLitePluginStatic {
    DEBUG(enabled: boolean): void;
    enablePromise(enabled: boolean): void;
    openDatabase(
      options: {
        name: string;
        location?: string;
        createFromLocation?: string;
        createFromResource?: string;
      },
      success?: (db: Database) => void,
      error?: (error: any) => void
    ): Promise<Database>;
    deleteDatabase(
      options: { name: string; location?: string },
      success?: () => void,
      error?: (error: any) => void
    ): void;
  }

  const SQLite: SQLitePluginStatic;
  export default SQLite;
  export { Database as SQLiteDatabase, Transaction, ResultSet };
}
