# Implementation Plan: Analítica de visitas

**Branch**: `007-analitica-web` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

## Summary

Un componente cliente `<WebAnalytics />` en el layout lee la ruta actual y, solo si es pública (lista en `lib/analytics.ts`), inserta el script de Cloudflare Web Analytics con `data-cf-beacon='{"token": "...", "spa": false}'`. El token sale de `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` (en `apphosting.yaml`, disponible en el build). Se actualiza la política de privacidad.

## Decisiones (research)

- **R1. Cloudflare Web Analytics** y no GA4: sin cookies, no guarda datos personales en el sitio, funciona con el dominio en *DNS only* insertando el script. Fuente: developers.cloudflare.com/web-analytics.
- **R2. Solo páginas públicas y `spa: false`**: Cloudflare no registra *query strings*, pero sí la ruta. Los links de invitación llevan el token en la ruta (`/invitaciones/<token>`) y los grupos su id. Con `spa: false`, una vez cargado el script no sigue las navegaciones del lado del cliente, así que nunca ve una ruta privada. Costo: las navegaciones entre páginas públicas sin recarga no se cuentan (subestimación aceptable).
- **R3. Decisión por ruta en el cliente** (`usePathname`): el layout es compartido; el componente decide en la primera carga. Si la primera carga es privada, el script no se inserta nunca en esa visita.
- **R4. Token público**: el script lo expone en el HTML, así que va como variable común, no en Secret Manager (sin riesgo de rollout fallido).
- **R5. Retención**: Cloudflare guarda los datos sin muestrear 7 días y después los agrega (FAQ de Web Analytics). Se declara en la política.

## Constitution Check

| Principio | Estado |
|---|---|
| I. Privacidad del sorteo | ✅ Nunca se miden rutas privadas ni de invitación (R2). |
| II. Español rioplatense | ✅ |
| III. Costo cero | ✅ Gratis. |
| IV. Un ecosistema | ⚠️ Cloudflare ya está como DNS; se suma Web Analytics. Ver Complexity Tracking. |
| V. Spec primero | ✅ |
| VI. Tests donde duele | ✅ Unit test de qué rutas se miden. |
| VII. Simple | ✅ Un componente y una lista. |

## Project Structure

```text
lib/analytics.ts                  # rutas medibles y armado del data-cf-beacon (puro)
components/web-analytics.tsx      # componente cliente
app/layout.tsx                    # lo incluye
app/privacidad/page.tsx + lib/content/privacy.ts   # FR-005
apphosting.yaml                   # NEXT_PUBLIC_CF_ANALYTICS_TOKEN (BUILD)
tests/unit/analytics.test.ts
```

## Complexity Tracking

| Desvío | Por qué |
|---|---|
| Servicio fuera de Google Cloud (principio IV) | Cloudflare ya es el DNS del proyecto (permitido por la constitución); Web Analytics es gratis, sin cookies y no requiere proxy. GA4 fue descartado por Marina en la 004. |
