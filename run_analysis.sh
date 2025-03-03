#!/bin/bash

DISEASE="$1"

if [ -z "$DISEASE" ]; then
  echo "Usage: ./run_analysis.sh <disease_name>"
  exit 1
fi

echo "Fetching transcripts for: $DISEASE..."
npm run fetch -- "$DISEASE"

echo "Analyzing transcripts..."
npm run analyze -- "$DISEASE"
