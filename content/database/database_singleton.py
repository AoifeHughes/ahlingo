# -*- coding: utf-8 -*-
from typing import Optional
from .database_manager import LanguageDB


class DatabaseManager:
    """
    Singleton class for managing database connections.
    Ensures only one instance of LanguageDB exists throughout the application.
    """

    _instance: Optional["DatabaseManager"] = None
    _db: Optional[LanguageDB] = None

    def __new__(cls) -> "DatabaseManager":
        """
        Create a new instance of DatabaseManager if one doesn't exist.
        Returns the existing instance otherwise.
        """
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._db = None
        return cls._instance

    def get_db(
        self, db_path: str = "database/languageLearningDatabase.db"
    ) -> LanguageDB:
        """
        Get the database instance. Initialize it if it doesn't exist.

        Args:
            db_path: Path to the SQLite database file

        Returns:
            LanguageDB: The database instance
        """
        if self._db is None:
            self._db = LanguageDB(db_path)
        return self._db

    def close(self):
        """Close the database connection if it exists."""
        if self._db is not None:
            self._db.close()
            self._db = None
