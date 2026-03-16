#!/bin/bash
# Usage: npm run new -- <project-name>

PROJECT_NAME="$1"
if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: npm run new -- <project-name>"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$ROOT_DIR/projects/$PROJECT_NAME"

if [ -d "$PROJECT_DIR" ]; then
  echo "Error: project '$PROJECT_NAME' already exists"
  exit 1
fi

mkdir -p "$PROJECT_DIR/assets"
cp "$ROOT_DIR/template/index.html" "$PROJECT_DIR/index.html"
touch "$PROJECT_DIR/init.md"

echo "Created project: projects/$PROJECT_NAME/"
echo "  - init.md     (write your outline here)"
echo "  - index.html  (AI will generate this)"
echo "  - assets/     (put images and files here)"
echo ""
echo "Start server:  npm start"
echo "View at:       http://localhost:8000/projects/$PROJECT_NAME/"
