#!/bin/bash
set -euo pipefail

# set_secrets_from_env.sh
# 
# Purpose:
#   Read key=value pairs from a dotenv-style file and set corresponding
#   Firebase Cloud Functions secrets using the Firebase CLI.
#
# Usage:
#   ./set_secrets_from_env.sh [path/to/env-file]
#
#   - If no argument is provided, the script defaults to using a file named
#     ".env" in the current working directory.
#   - If an argument is provided, it is treated as the path to the env file.
#
# Parameters:
#   $1  Optional. Path to the .env file containing secrets in KEY=VALUE form.
#
# Behavior:
#   - Reads the specified env file line by line.
#   - Ignores comments (lines starting with "#") and blank lines.
#   - Trims surrounding whitespace from keys and values.
#   - For each non-empty KEY and VALUE, runs:
#       firebase functions:secrets:set KEY
#     piping VALUE to the command via stdin.
#
# Requirements:
#   - Firebase CLI must be installed and authenticated for the target project.
#
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
