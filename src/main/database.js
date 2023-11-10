const LanguageDB = require("../database/languageDB");

// Create and export an instance of the database
const db = new LanguageDB();

// It's a good practice to close the database connection when your Electron app is about to exit.
process.on("exit", () => {
  db.close();
});

module.exports = db;
