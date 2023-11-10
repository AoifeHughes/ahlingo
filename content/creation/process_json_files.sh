#!/bin/bash

# Target directory as a command-line argument
DIR="$1"

# Path to the JavaScript script
SCRIPT_PATH="../src/database/insert_into_db.js"

# Check if the target directory is provided
if [ -z "$DIR" ]; then
  echo "Usage: $0 path/to/french"
  exit 1
fi

# Recursively find all JSON files in the target directory and process them
find "$DIR" -name "*.json" | while read -r file; do
  node "$SCRIPT_PATH" "$file"
done
