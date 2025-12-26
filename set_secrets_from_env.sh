#!/bin/bash

ENV_FILE=${1:-.env}

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: File '$ENV_FILE' not found."
    exit 1
fi

echo "Reading secrets from $ENV_FILE..."

# Read the file line by line
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    if [ -n "$key" ] && [ -n "$value" ]; then
        echo "Setting secret: $key"
        # Pipe the value to the firebase command
        echo -n "$value" | firebase functions:secrets:set "$key"
    fi
done < "$ENV_FILE"

echo "Done!"
