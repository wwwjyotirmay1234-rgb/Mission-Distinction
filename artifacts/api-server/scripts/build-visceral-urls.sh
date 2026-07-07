#!/usr/bin/env bash
# build-visceral-urls.sh
# Uses Wikimedia Commons API to find real gross anatomy specimen image URLs
# for each visceral organ, then writes /tmp/visceral_urls.json

set -euo pipefail
OUT="/tmp/visceral_urls.json"

# Query Commons text search for images matching a query, return JSON array of download URLs
# Args: query (string), max_results (int)
search_commons() {
  local query="$1"
  local max="${2:-10}"
  local ua="MissionDistinction/1.0"

  # Step 1: text search for file pages
  local search_url="https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$query")&srnamespace=6&srlimit=${max}&format=json"
  local search_result
  search_result=$(curl -s --max-time 15 -A "$ua" "$search_url" 2>/dev/null)

  # Extract file titles
  local titles
  titles=$(echo "$search_result" | python3 -c "
import json, sys
data = json.load(sys.stdin)
hits = data.get('query', {}).get('search', [])
titles = [h['title'].replace('File:', '') for h in hits if h['title'].lower().endswith(('.jpg', '.jpeg', '.png'))]
print('\n'.join(titles[:$max]))
" 2>/dev/null)

  if [[ -z "$titles" ]]; then
    echo "[]"
    return
  fi

  # Step 2: resolve each title to a download URL
  local urls=()
  while IFS= read -r title; do
    [[ -z "$title" ]] && continue
    local enc
    enc=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$title")
    local info_url="https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc}&prop=imageinfo&iiprop=url|size|mime&format=json"
    local info
    info=$(curl -s --max-time 10 -A "$ua" "$info_url" 2>/dev/null)
    local url size mime
    url=$(echo "$info" | python3 -c "
import json, sys
data = json.load(sys.stdin)
pages = list(data.get('query', {}).get('pages', {}).values())
if pages:
  ii = pages[0].get('imageinfo', [{}])
  if ii:
    print(ii[0].get('url', ''))
" 2>/dev/null)
    size=$(echo "$info" | python3 -c "
import json, sys
data = json.load(sys.stdin)
pages = list(data.get('query', {}).get('pages', {}).values())
if pages:
  ii = pages[0].get('imageinfo', [{}])
  if ii: print(ii[0].get('size', 0))
else: print(0)
" 2>/dev/null)
    mime=$(echo "$info" | python3 -c "
import json, sys
data = json.load(sys.stdin)
pages = list(data.get('query', {}).get('pages', {}).values())
if pages:
  ii = pages[0].get('imageinfo', [{}])
  if ii: print(ii[0].get('mime', ''))
else: print('')
" 2>/dev/null)

    if [[ -n "$url" ]] && [[ "${size:-0}" -gt 30000 ]] && echo "$mime" | grep -q "^image/"; then
      urls+=("\"$url\"")
      echo "  ✓ $(echo "$title" | cut -c1-50): ${size} bytes" >&2
    fi
    sleep 0.3
  done <<< "$titles"

  if [[ ${#urls[@]} -eq 0 ]]; then
    echo "[]"
  else
    echo "[$(IFS=,; echo "${urls[*]}")]"
  fi
}

echo "Building visceral specimen image URL list..." >&2
echo "{" > "$OUT"

# Organ → search queries (multiple per organ for variety)
declare -A organ_queries=(
  ["Heart"]="human heart specimen gross anatomy photograph"
  ["Right Lung"]="human lung specimen gross anatomy photograph"
  ["Left Lung"]="lung lobe specimen photograph anatomy"
  ["Liver"]="human liver specimen gross anatomy photograph"
  ["Spleen"]="human spleen specimen gross anatomy photograph"
  ["Kidney"]="human kidney specimen gross anatomy photograph"
  ["Suprarenal Gland"]="adrenal gland specimen anatomy photograph"
  ["Stomach"]="human stomach specimen gross anatomy photograph"
  ["Duodenum"]="duodenum specimen gross anatomy photograph"
  ["Jejunum and Ileum"]="small intestine specimen gross anatomy photograph"
  ["Caecum and Appendix"]="cecum appendix specimen gross anatomy photograph"
  ["Colon"]="colon large intestine specimen gross anatomy photograph"
  ["Gallbladder"]="gallbladder specimen gross anatomy photograph"
  ["Pancreas"]="pancreas specimen gross anatomy photograph"
  ["Urinary Bladder"]="urinary bladder specimen gross anatomy photograph"
  ["Uterus"]="uterus specimen gross anatomy photograph"
  ["Ovary and Uterine Tube"]="ovary fallopian tube specimen gross anatomy photograph"
  ["Testis and Epididymis"]="testis epididymis specimen gross anatomy photograph"
  ["Prostate Gland"]="prostate gland specimen gross anatomy photograph"
)

first=true
for organ in "Heart" "Right Lung" "Left Lung" "Liver" "Spleen" "Kidney" "Suprarenal Gland" "Stomach" "Duodenum" "Jejunum and Ileum" "Caecum and Appendix" "Colon" "Gallbladder" "Pancreas" "Urinary Bladder" "Uterus" "Ovary and Uterine Tube" "Testis and Epididymis" "Prostate Gland"; do
  echo "[${organ}] searching..." >&2
  query="${organ_queries[$organ]}"
  urls=$(search_commons "$query" 8)
  
  if [[ "$first" == "true" ]]; then
    first=false
  else
    echo "," >> "$OUT"
  fi
  
  echo -n "  $(echo "$organ" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))"): $urls" >> "$OUT"
  echo "  → $(echo "$urls" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'URLs')" 2>/dev/null || echo "0 URLs")" >&2
  sleep 1
done

echo "" >> "$OUT"
echo "}" >> "$OUT"

echo "" >&2
echo "Saved to $OUT" >&2
total=$(python3 -c "import json; d=json.load(open('$OUT')); print(sum(len(v) for v in d.values()))")
echo "Total URLs: $total" >&2
