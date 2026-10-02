#!/usr/bin/env bash
# Prueba de punta a punta del flujo de sesión (US3) contra los emuladores de Auth y Firestore.
# Requiere haber hecho `npm run build` con .env.local (valores de .env.example).
# Correr con: npm run test:smoke
set -euo pipefail

PORT=3100
BASE="http://localhost:${PORT}"
AUTH="http://127.0.0.1:9099"
FS="http://127.0.0.1:8080"
PROJECT="demo-amigo-invisible"
JAR=$(mktemp)
fallas=0

npx next start -p "$PORT" > /tmp/amigo-next.log 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true; rm -f "$JAR"' EXIT
for _ in $(seq 1 40); do curl -s -o /dev/null "$BASE" && break; sleep 0.5; done

check() { # descripción, condición
  if eval "$2"; then echo "✔ $1"; else echo "✘ $1"; fallas=$((fallas + 1)); fi
}

signup() {
  curl -s -X POST "${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"una-contrasena-larga\",\"returnSecureToken\":true}" |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.idToken+" "+j.localId)})'
}

read -r TOKEN UID_ANA < <(signup "ana@example.com")

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/sesion" -H 'Content-Type: application/json' -d "{\"idToken\":\"$TOKEN\"}")
check "POST /api/sesion sin Origin → 403" '[[ $code == 403 ]]'

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/sesion" -H "Origin: https://malo.com" -H 'Content-Type: application/json' -d "{\"idToken\":\"$TOKEN\"}")
check "POST /api/sesion desde otro sitio → 403" '[[ $code == 403 ]]'

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/sesion" -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"idToken":"no-es-un-token-valido-para-nada"}')
check "POST /api/sesion con token inválido → 401" '[[ $code == 401 ]]'

code=$(curl -s -c "$JAR" -o /dev/null -w '%{http_code}' -X POST "$BASE/api/sesion" -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"idToken\":\"$TOKEN\"}")
check "POST /api/sesion válido → 200" '[[ $code == 200 ]]'
check "deja la cookie __session HttpOnly" 'grep -q "#HttpOnly_localhost.*__session" "$JAR"'

loc=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE/mis-grupos")
check "/mis-grupos sin sesión → login con next ($loc)" '[[ $loc == 307*"/ingresar?next=%2Fmis-grupos" ]]'

body=$(curl -s -b "$JAR" "$BASE/mis-grupos")
check "/mis-grupos con sesión saluda a la persona" '[[ $body == *"Hola, ana"* ]]'

doc=$(curl -s -H 'Authorization: Bearer owner' "${FS}/v1/projects/${PROJECT}/databases/(default)/documents/users/${UID_ANA}")
check "se creó el perfil users/{uid}" '[[ $doc == *"ana@example.com"* && $doc == *"createdAt"* ]]'

loc=$(curl -s -b "$JAR" -o /dev/null -w '%{redirect_url}' "$BASE/ingresar?next=//malo.com")
check "/ingresar con sesión y next externo → /mis-grupos ($loc)" '[[ $loc == "$BASE/mis-grupos" ]]'

body=$(curl -s "$BASE/")
check "landing en español" '[[ $body == *"El sorteo, sin papelitos."* && $body == *"lang=\"es-AR\""* ]]'

out=$(curl -s -w ' %{http_code}' "$BASE/no-existe")
check "404 en español" '[[ $out == *"No encontramos esa página"*" 404" ]]'

sleep 1.2 # la revocación de Firebase tiene granularidad de 1 segundo
cp "$JAR" "${JAR}.vieja"
code=$(curl -s -b "$JAR" -c "$JAR" -o /dev/null -w '%{http_code}' -X DELETE "$BASE/api/sesion" -H "Origin: $BASE")
check "DELETE /api/sesion → 200" '[[ $code == 200 ]]'

loc=$(curl -s -b "${JAR}.vieja" -o /dev/null -w '%{http_code}' "$BASE/mis-grupos")
check "la cookie vieja ya no sirve después de salir" '[[ $loc == 307 ]]'
rm -f "${JAR}.vieja"

echo
if (( fallas == 0 )); then echo "Smoke test OK"; else echo "${fallas} chequeo(s) fallaron"; tail -20 /tmp/amigo-next.log; exit 1; fi
