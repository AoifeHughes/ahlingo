#!/bin/bash

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found, please install it to run this script."
    exit
fi

# Check if a file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <json_file>"
    exit 1
fi

# File name from the argument
FILE=$1

# Process the JSON and output to a text file
jq -r '.[] | "<s>### Instruction:\n" + .instruction + "\n<s>### Response:\n" + .output' "$FILE" > llm.cpp.txt

echo "Processing complete. Output saved to llm.cpp.txt"
