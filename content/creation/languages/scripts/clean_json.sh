#!/bin/bash

process_json_file() {
    local file=$1
    local temp_file=$(mktemp)

    # Remove everything from '//' to the end of the line and extract JSON object
    sed -e 's/\/\/.*$//' -e '/{/,/}/!d' "$file" > "$temp_file"

    # Check if the processing resulted in a non-empty file
    if [ -s "$temp_file" ]; then
        # Add square brackets to make it a valid JSON array
        echo '[' > "$temp_file"
        sed -e 's/\/\/.*$//' -e '/{/,/}/!d' "$file" >> "$temp_file"
        echo ']' >> "$temp_file"

        # Validate and format JSON file
        if jq '.' "$temp_file" > /dev/null 2>&1; then
            # If valid, pretty-print (format) the JSON and replace the original file
            jq '.' "$temp_file" > "$file"
            rm "$temp_file"
        else
            # If invalid, print an error and delete the temp file
            echo "Invalid JSON after processing: $file"
            rm "$temp_file"
        fi
    else
        # Processing failed, possibly no JSON object present or file is empty after comment removal
        echo "No valid JSON object found in file: $file"
        rm "$temp_file"
    fi
}

# Find all .json files and process them
find ../ -name "*.json" -type f | while read file; do
    echo "Processing file: $file"
    process_json_file "$file"
done
