#!/usr/bin/env bash
set -euo pipefail

: "${BASE:?Falta BASE}"; : "${USER:?Falta USER}"; : "${PASS:?Falta PASS}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Instala $1 (e.g. brew install $1)"; exit 1; }; }
need curl; need jq; need grep; need tr; need head; need tee

OUT="scan_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"
JAR="$OUT/cookies.jar"

echo "==> Login (AJAX bodhi_login)…"
LOGIN_RES=$(curl -sS -c "$JAR" -b "$JAR" \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  -X POST "$BASE/wp-admin/admin-ajax.php?action=bodhi_login" \
  --data-urlencode "username=$USER" \
  --data-urlencode "password=$PASS")

echo "$LOGIN_RES" | jq . > "$OUT/login.json" || true
NONCE=$(echo "$LOGIN_RES" | jq -r 'try .nonce // empty')
if [[ -z "${NONCE}" ]]; then
  echo "ERROR: no obtuve nonce del login. Revisa credenciales o plugin."
  exit 1
fi
echo "Nonce: $NONCE"

HDR=(-b "$JAR" -H "X-WP-Nonce: $NONCE" -H "Accept: application/json")

echo "==> Índice REST…"
curl -sS "${HDR[@]}" "$BASE/wp-json" | tee "$OUT/root.json" >/dev/null

echo "==> Namespaces REST relacionados con Thrive…"
jq '.namespaces' "$OUT/root.json" > "$OUT/namespaces.json"
jq -r '.namespaces[] | select(test("thrive|apprentice|tva|tqb|tvo|tcm";"i"))' "$OUT/root.json" \
  | tee "$OUT/namespaces_thrive.txt"

echo "==> Rutas REST con palabras clave Thrive…"
jq -r '.routes | keys[] | select(test("thrive|apprentice|tva|tqb|tvo|tcm";"i"))' "$OUT/root.json" \
  | tee "$OUT/routes_thrive.txt"

echo "==> Tipos (CPT) disponibles…"
curl -sS "${HDR[@]}" "$BASE/wp-json/wp/v2/types" | tee "$OUT/types.json" >/dev/null
jq -r 'keys[]' "$OUT/types.json" | tee "$OUT/types_list.txt" >/dev/null
grep -E 'tva|apprentice|thrive' "$OUT/types_list.txt" || true > "$OUT/types_thrive.txt"

echo "==> Explorando namespaces Thrive (si existen)…"
while read -r NS; do
  [[ -z "$NS" ]] && continue
  curl -sS "${HDR[@]}" "$BASE/wp-json/$NS" | tee "$OUT/${NS//\//_}.json" >/dev/null || true
done < "$OUT/namespaces_thrive.txt"

echo "==> Explorando rutas detectadas…"
while read -r R; do
  [[ -z "$R" ]] && continue
  ROUTE="${R#/}"                                           # NO pisar PATH del sistema
  SAFE=$(echo "$ROUTE" | sed 's#[/?&=]#_#g')
  curl -sS "${HDR[@]}" "$BASE/$ROUTE" | head -c 2000 > "$OUT/route_${SAFE}.sample.json" || true
done < "$OUT/routes_thrive.txt"

echo "==> Muestreo de CPTs (3 items c/u, con context=edit y _embed)…"
while read -r T; do
  [[ -z "$T" ]] && continue
  URL="$BASE/wp-json/wp/v2/$T?per_page=3&context=edit&_embed=1"
  curl -sS "${HDR[@]}" "$URL" | tee "$OUT/cpt_${T}.json" >/dev/null || true
done < "$OUT/types_list.txt"

echo "==> Búsqueda global de 'thrive|apprentice' en payloads guardados…"
grep -RniE 'thrive|apprentice|tva|tqb|tvo|tcm' "$OUT" || true

echo "==> Resumen:"
echo " Carpeta: $OUT"
echo " - login.json              (respuesta AJAX con nonce)"
echo " - root.json               (índice REST global)"
echo " - namespaces_thrive.txt   (namespaces con match)"
echo " - routes_thrive.txt       (rutas con match)"
echo " - types.json / types_list.txt / types_thrive.txt"
echo " - cpt_*.json              (muestras de cada tipo wp/v2/*)"
echo " - <namespace>.json        (si hay namespaces Thrive)"
echo "Listo."
