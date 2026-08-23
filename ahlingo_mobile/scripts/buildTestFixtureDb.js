const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Rebuilds the sqlite fixture used by src/services/__tests__/databaseSample.test.ts
// from its tracked .sql dump, so the test doesn't depend on a stray local .db file
// (the .db itself is gitignored — only the .sql source is checked in).
module.exports = async function buildTestFixtureDb() {
  const fixtureDir = path.resolve(__dirname, '..', 'test-fixtures', 'databases');
  const dbPath = path.join(fixtureDir, 'testLanguageLearningDatabase.db');
  const sqlPath = path.join(fixtureDir, 'testLanguageLearningDatabase.db.sql');

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  execFileSync('sqlite3', [dbPath, `.read ${sqlPath}`]);
};
