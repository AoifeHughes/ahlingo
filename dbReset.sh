#!/bin/bash

# Define the paths
DB_DIRECTORY="./src/database"
DB_FILE="$DB_DIRECTORY/languageLearningDatabase.db"
POPULATE_SCRIPT="$DB_DIRECTORY/insert_into_db.js" # The Node.js script for populating the DB
JSON_DIRECTORY="./content/lessons" # The directory where your JSON files are located

# Step 1: Delete the existing database file
echo "Deleting existing database file..."
rm -f "$DB_FILE"

# The _initialize method in your LanguageDB class will create the tables
# when a new instance of the class is created as part of your populate script

# Step 2: Find all JSON files and populate the database
echo "Populating the database with JSON files..."
find "$JSON_DIRECTORY" -name "*.json" | while read json_file; do
  node "$POPULATE_SCRIPT" "$json_file"
done

echo "Database population complete."
