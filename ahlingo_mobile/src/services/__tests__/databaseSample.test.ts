import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const testDbPath = path.resolve(__dirname, '../../../test-fixtures/databases/testLanguageLearningDatabase.db');

const query = (sql: string) =>
  execFileSync('sqlite3', [testDbPath, sql], { encoding: 'utf-8' }).trim();

describe('test fixture database', () => {
  it('exists and contains the expected tables', () => {
    expect(fs.existsSync(testDbPath)).toBe(true);
    const tables = query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    expect(tables).toContain('languages');
    expect(tables).toContain('exercises_info');
  });

  it('has the minimal language/difficulty data', () => {
    const languages = query('SELECT language FROM languages ORDER BY id;').split('\n');
    expect(languages).toEqual(['French', 'Spanish']);
    const difficulties = query('SELECT difficulty_level FROM difficulties ORDER BY id;').split('\n');
    expect(difficulties).toEqual(['Beginner', 'Intermediate']);
  });

  it('contains exercise rows for each type', () => {
    const counts = query("SELECT exercise_type, COUNT(*) FROM exercises_info GROUP BY exercise_type ORDER BY exercise_type;");
    expect(counts).toContain('conversation|1');
    expect(counts).toContain('fill_in_blank|1');
    expect(counts).toContain('pairs|1');
    expect(counts).toContain('translation|1');
  });
});
