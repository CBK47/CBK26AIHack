#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <zip_path> <path_slug> [display_name]"
  exit 1
fi

ZIP_PATH="$1"
RAW_SLUG="$2"
DISPLAY_NAME="${3:-$2}"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Zip not found: $ZIP_PATH"
  exit 1
fi

SLUG="$(printf '%s' "$RAW_SLUG" | sed 's/[^a-zA-Z0-9_-]/-/g' | cut -c1-30)"
if [[ -z "$SLUG" ]]; then
  echo "Invalid slug after sanitization."
  exit 1
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPLOAD_DIR="$BASE_DIR/uploads"
INDEX_FILE="$UPLOAD_DIR/deployments_index.json"
DOMAIN="drop.aihack26.xyz"

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

unzip -q "$ZIP_PATH" -d "$TMP_DIR"

SOURCE_DIR=""
for candidate in "$TMP_DIR/app/dist" "$TMP_DIR/dist" "$TMP_DIR/app" "$TMP_DIR"; do
  if [[ -f "$candidate/index.html" ]]; then
    SOURCE_DIR="$candidate"
    break
  fi
done

if [[ -z "$SOURCE_DIR" ]]; then
  INDEX_FOUND="$(find "$TMP_DIR" -maxdepth 6 -type f -name 'index.html' | head -n 1 || true)"
  if [[ -n "$INDEX_FOUND" ]]; then
    SOURCE_DIR="$(dirname "$INDEX_FOUND")"
  fi
fi

if [[ -z "$SOURCE_DIR" || ! -f "$SOURCE_DIR/index.html" ]]; then
  echo "No deployable index.html found in zip."
  exit 1
fi

TARGET_DIR="$UPLOAD_DIR/$SLUG"
mkdir -p "$TARGET_DIR"
rsync -a --delete "$SOURCE_DIR"/ "$TARGET_DIR"/

# Rewrite absolute asset references (e.g. "/hero.jpg") to site-local relative
# paths (e.g. "./hero.jpg") so subpath hosting under /<slug>/ works correctly.
while IFS= read -r rel; do
  case "$rel" in
    *.html|*.js|*.css|*.map) continue ;;
  esac

  pattern="$(printf '%s' "$rel" | sed -e 's/[.[\*^$()+?{}|]/\\&/g' -e 's/[&]/\\&/g')"
  replacement="$(printf '%s' "$rel" | sed -e 's/[&]/\\&/g')"

  while IFS= read -r text_file; do
    sed -i '' \
      -e "s#\"/$pattern\"#\"./$replacement\"#g" \
      -e "s#'/$pattern'#'./$replacement'#g" \
      -e "s#url(/$pattern)#url(./$replacement)#g" \
      "$text_file"
  done < <(find "$TARGET_DIR" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' \))
done < <(
  cd "$TARGET_DIR"
  find . -type f ! -name '.DS_Store' | sed 's#^\./##' | sort
)

# Generic cleanup for absolute media/font URLs that may not map 1:1 to files
# in the extracted tree but still need to resolve under /<slug>/.
while IFS= read -r text_file; do
  perl -0777 -i -pe 's#"/([^"]+\.(?:jpg|jpeg|png|webp|gif|svg|mp4|webm|woff2?|ttf|otf))"#"./$1"#g' "$text_file"
  perl -0777 -i -pe "s#'/([^']+\\.(?:jpg|jpeg|png|webp|gif|svg|mp4|webm|woff2?|ttf|otf))'#'./\$1'#g" "$text_file"
  perl -0777 -i -pe 's#url\(\s*/([^)[:space:]]+\.(?:jpg|jpeg|png|webp|gif|svg|mp4|webm|woff2?|ttf|otf))\s*\)#url(./$1)#g' "$text_file"
done < <(find "$TARGET_DIR" -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' \))

FILES_JSON="$(
  cd "$TARGET_DIR"
  find . -type f ! -name '.DS_Store' | sed 's#^\./##' | sort | jq -R . | jq -s .
)"

if [[ ! -f "$INDEX_FILE" ]]; then
  echo "{}" > "$INDEX_FILE"
fi

CREATED_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
EXPIRES_TS="$(($(date +%s) + 259200))"
TMP_INDEX="$(mktemp)"

jq \
  --arg slug "$SLUG" \
  --arg name "$DISPLAY_NAME" \
  --arg created "$CREATED_UTC" \
  --argjson expires "$EXPIRES_TS" \
  --argjson files "$FILES_JSON" \
  '.[$slug] = {
    path: $slug,
    name: $name,
    files: $files,
    wallet: "",
    created: $created,
    expires: $expires,
    status: "live",
    unlisted: false
  }' \
  "$INDEX_FILE" > "$TMP_INDEX"

mv "$TMP_INDEX" "$INDEX_FILE"

echo "Imported: $DISPLAY_NAME"
echo "Path: /$SLUG/"
echo "URL: https://$DOMAIN/$SLUG/"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
