# Implementation Plan: SEO

**Branch**: `006-seo` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

## Summary

Metadatos por página con la API de metadata de Next (título, descripción, `alternates.canonical`, `robots`), datos estructurados JSON-LD en la portada, sección de preguntas frecuentes en la portada (fuente única `lib/content/faq.ts`, de la 003), página estática `/como-funciona` y sitemap actualizado.

## Decisiones

- **R1. Canonical por página** y no en el layout: si se pone en el layout, todas las páginas declararían la portada como canónica.
- **R2. `noindex, follow`** en `/ingresar`, `/registro` e `/ingresar/link`: se siguen los links pero no aparecen en resultados.
- **R3. Sin `FAQPage`**: Google lo dejó de mostrar en mayo de 2026 (Search Engine Journal, "Google drops FAQ rich results"). El texto visible sí sirve para búsquedas con preguntas.
- **R4. JSON-LD** como `<script type="application/ld+json">` en el Server Component de la portada; el JSON se arma con una función pura testeable.
- **R5. Search Console**: verificado por DNS (TXT `google-site-verification`, cargado entre Google y Cloudflare). El sitemap se envía a mano después del deploy.

## Constitution Check

| Principio | Estado |
|---|---|
| I. Privacidad del sorteo | ✅ Solo páginas públicas; lo privado sigue fuera de `robots.txt` y del sitemap. |
| II. Español rioplatense | ✅ |
| III. Costo cero | ✅ Páginas estáticas. |
| IV. Un ecosistema | ✅ Search Console es de Google. |
| V. Spec primero | ✅ |
| VI. Tests donde duele | ✅ Unit test del JSON-LD y del sitemap. |
| VII. Simple | ✅ Sin dependencias. |

## Project Structure

```text
app/layout.tsx                 # título por defecto
app/page.tsx                   # título, canonical, JSON-LD, preguntas frecuentes, link a Cómo funciona
app/como-funciona/page.tsx     # guía paso a paso
app/sitemap.ts                 # páginas públicas
app/{ingresar,registro}/page.tsx, app/ingresar/link/page.tsx   # noindex
lib/seo.ts                     # siteUrl, JSON-LD y lista de páginas públicas
tests/unit/seo.test.ts
```
