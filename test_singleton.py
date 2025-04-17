# -*- coding: utf-8 -*-
"""
Test script to verify the singleton database manager works correctly.
"""
from content.database.database_singleton import DatabaseManager

def test_singleton():
    """Test that the DatabaseManager is a singleton."""
    # Create two instances of the DatabaseManager
    db_manager1 = DatabaseManager()
    db_manager2 = DatabaseManager()
    
    # Verify they are the same instance
    print(f"Are db_manager1 and db_manager2 the same instance? {db_manager1 is db_manager2}")
    
    # Get database connections from both managers
    db1 = db_manager1.get_db()
    db2 = db_manager2.get_db()
    
    # Verify they are the same database connection
    print(f"Are db1 and db2 the same instance? {db1 is db2}")
    
    # Test some database operations
    username = db1.get_most_recent_user()
    print(f"Most recent user: {username}")
    
    # Get available languages
    languages = db1.get_languages()
    print(f"Available languages: {languages}")
    
    # Get available difficulty levels
    difficulties = db1.get_difficulty_levels()
    print(f"Available difficulty levels: {difficulties}")
    
    # Test user settings
    settings = db1.get_user_settings(username)
    print(f"User settings: {settings}")
    
    # Close the database connection
    db_manager1.close()
    
    # Verify that db_manager2's connection is also closed
    try:
        db2.get_languages()
        print("Database connection is still open!")
    except Exception as e:
        print(f"Database connection is closed as expected: {e}")
    
    # Test reopening the connection
    db3 = db_manager2.get_db()
    print(f"Reopened database connection successfully: {db3 is not None}")
    
    return True

if __name__ == "__main__":
    print("Testing DatabaseManager singleton...")
    test_singleton()
    print("Test completed.")
