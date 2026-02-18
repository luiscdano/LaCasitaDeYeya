#!/usr/bin/env bash
set -euo pipefail

USERNAME="${1:-lacasitadeyeya}"
MAX_POSTS="${2:-10}"
PROFILE_URL="https://www.instagram.com/${USERNAME}/?hl=es"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DATA_DIR="${PROJECT_DIR}/shared/data"
IMAGES_DIR="${DATA_DIR}/instagram"
OUT_FILE="${DATA_DIR}/instagram-feed.json"

mkdir -p "${IMAGES_DIR}"

TMP_RAW="$(mktemp)"
TMP_ITEMS="$(mktemp)"
TMP_POSTS="$(mktemp)"
TMP_KEEP="$(mktemp)"

cleanup() {
  rm -f "${TMP_RAW}" "${TMP_ITEMS}" "${TMP_POSTS}" "${TMP_KEEP}"
}
trap cleanup EXIT

curl -sSf "https://www.instagram.com/api/v1/users/web_profile_info/?username=${USERNAME}" \
  -H 'x-ig-app-id: 936619743392459' \
  -H "User-Agent: ${UA}" \
  > "${TMP_RAW}"

jq -c --argjson max "${MAX_POSTS}" '
  .data.user.edge_owner_to_timeline_media.edges
  | map(.node)
  | map({
      id: (.id | tostring),
      shortcode: (.shortcode // ""),
      permalink: (if .is_video == true then "https://www.instagram.com/reel/\(.shortcode)/" else "https://www.instagram.com/p/\(.shortcode)/" end),
      image: (.display_url // .thumbnail_src // ""),
      caption: (.edge_media_to_caption.edges[0].node.text // ""),
      is_video: (.is_video // false),
      taken_at_timestamp: (.taken_at_timestamp // 0)
    })
  | map(select(.shortcode != "" and .image != ""))
  | .[:$max]
  | .[]
' "${TMP_RAW}" > "${TMP_ITEMS}"

while IFS= read -r post; do
  [ -z "${post}" ] && continue

  shortcode="$(printf '%s' "${post}" | jq -r '.shortcode')"
  image_url="$(printf '%s' "${post}" | jq -r '.image')"

  [ -z "${shortcode}" ] && continue
  [ -z "${image_url}" ] && continue

  local_name="${shortcode}.jpg"
  local_rel="shared/data/instagram/${local_name}"
  local_abs="${PROJECT_DIR}/${local_rel}"
  tmp_img="${local_abs}.tmp"

  if curl -sSfL "${image_url}" -H "User-Agent: ${UA}" -o "${tmp_img}"; then
    mv "${tmp_img}" "${local_abs}"
  else
    rm -f "${tmp_img}"
    if [ ! -f "${local_abs}" ]; then
      echo "No se pudo descargar imagen para ${shortcode}" >&2
      continue
    fi
  fi

  printf '%s\n' "${local_name}" >> "${TMP_KEEP}"
  printf '%s' "${post}" | jq -c --arg img "${local_rel}" '.image = $img' >> "${TMP_POSTS}"
done < "${TMP_ITEMS}"

if [ -d "${IMAGES_DIR}" ]; then
  while IFS= read -r -d '' existing; do
    base="$(basename "${existing}")"
    if ! grep -Fxq "${base}" "${TMP_KEEP}"; then
      rm -f "${existing}"
    fi
  done < <(find "${IMAGES_DIR}" -type f -print0)
fi

jq -s \
  --arg username "${USERNAME}" \
  --arg profile_url "${PROFILE_URL}" \
  --arg fetched_at "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{
    username: $username,
    profile_url: $profile_url,
    fetched_at: $fetched_at,
    posts: .
  }' "${TMP_POSTS}" > "${OUT_FILE}"

if ! jq -e '.posts | length > 0' "${OUT_FILE}" >/dev/null; then
  echo "No se encontraron publicaciones en el feed generado" >&2
  exit 1
fi

echo "Feed actualizado en ${OUT_FILE}"
