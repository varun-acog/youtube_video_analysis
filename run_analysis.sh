#!/bin/bash

DISEASE="$1"

if [ -z "$DISEASE" ]; then
  echo "Usage: ./run_analysis.sh <disease_name>"
  exit 1
fi

echo "Fetching transcripts for: $DISEASE..."

# Run youtube-fetcher.ts and store the result to a temporary file
TEMP_FILE=$(mktemp /tmp/youtube_data.XXXXXX)

npx tsx bin/youtube-fetcher.ts "$DISEASE" -n 10 > "$TEMP_FILE"

if [ $? -ne 0 ]; then
    echo "Error: youtube-fetcher.ts failed. Aborting."
    rm -f "$TEMP_FILE"  # Clean up the temp file
    exit 1
fi

echo "Analyzing transcripts..."

# Pass the content of the temp file to llm-analyzer.ts
npx tsx bin/llm-analyzer.ts < "$TEMP_FILE"

if [ $? -ne 0 ]; then
    echo "Error: llm-analyzer.ts failed."
fi

rm -f "$TEMP_FILE" #Clean the file after the process ends
exit 0