#!/usr/bin/env bash
# Verifica FR-001..FR-003 / SC-001 de specs/001-plataforma-gcp-dominio:
# las 4 variantes de dominio × http/https terminan en https://amigoinvisible.com.ar
# con la misma ruta y query, certificado válido y como máximo 2 redirecciones.
set -uo pipefail

PRINCIPAL="amigoinvisible.com.ar"
HOSTS=("amigoinvisible.com.ar" "www.amigoinvisible.com.ar" "amigueinvisible.com.ar" "www.amigueinvisible.com.ar")
RUTA="/prueba?x=1"
ESPERADA="https://${PRINCIPAL}${RUTA}"
MAX_SALTOS=2

fallas=0
printf "%-48s %-6s %-6s %s\n" "URL pedida" "HTTP" "Saltos" "URL final"
for host in "${HOSTS[@]}"; do
  for esquema in http https; do
    url="${esquema}://${host}${RUTA}"
    # curl falla (exit ≠ 0) si algún certificado de la cadena de redirecciones no es válido.
    if ! salida=$(curl -sS -o /dev/null -L --max-redirs 5 --max-time 20 \
        -w '%{http_code} %{num_redirects} %{url_effective}' "$url" 2>&1); then
      printf "%-48s %s\n" "$url" "ERROR: ${salida}"
      fallas=$((fallas + 1))
      continue
    fi
    read -r codigo saltos final <<<"$salida"
    estado="ok"
    if [[ "$final" != "$ESPERADA" ]]; then estado="URL final incorrecta"; fi
    if (( saltos > MAX_SALTOS )); then estado="demasiados saltos"; fi
    # La ruta de prueba no existe: 404 es la respuesta esperada de la app.
    if [[ "$codigo" != "404" && "$codigo" != "200" ]]; then estado="código inesperado"; fi
    printf "%-48s %-6s %-6s %s %s\n" "$url" "$codigo" "$saltos" "$final" "$([[ $estado == ok ]] && echo '✔' || echo "✘ $estado")"
    [[ "$estado" == "ok" ]] || fallas=$((fallas + 1))
  done
done

echo
if (( fallas == 0 )); then
  echo "Todo bien: las 8 URLs terminan en ${ESPERADA}"
else
  echo "${fallas} URL(s) con problemas"
  exit 1
fi
