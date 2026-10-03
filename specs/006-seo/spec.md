# Feature Specification: SEO (que la app aparezca en Google)

**Feature Branch**: `006-seo`

**Created**: 2026-10-03

**Status**: Aprobada

**Input**: Plan SEO acordado con Marina: Search Console, ajustes técnicos, preguntas frecuentes en la portada y una página "Cómo funciona". Las guías de contenido ("Ideas de regalo por $5.000", "Amigo invisible para la oficina") quedan para más adelante.

**Depende de**: `003-contacto-acerca-de` (preguntas frecuentes, Acerca de y Privacidad).

## Contexto

La portada tiene unas 128 palabras y el título no dice cómo busca la gente ("sorteo amigo invisible online"). Las páginas de ingreso y registro no aportan en buscadores. En Argentina la búsqueda tiene dos picos: diciembre y el 20 de julio (Día del Amigo). Google tarda semanas en indexar, así que lo de esta feature tiene que estar publicado antes de mediados de noviembre.

Search Console ya está verificado (registro TXT en Cloudflare, 2026-10-03).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar la app al buscar (Priority: P1)

Alguien busca "sorteo amigo invisible online" o "cómo hacer un amigo invisible por WhatsApp" y en los resultados aparece Amigo Invisible con un título y una descripción que dicen claramente qué hace, que es gratis y que es por WhatsApp.

**Independent Test**: revisar en el HTML de la portada el título, la descripción, la URL canónica y los datos estructurados; validarlos con la Prueba de resultados enriquecidos de Google.

**Acceptance Scenarios**:

1. **Given** la portada, **When** un buscador la lee, **Then** encuentra un título con "sorteo de amigo invisible", una descripción que menciona WhatsApp y que es gratis, una URL canónica y datos estructurados del sitio y de la app.
2. **Given** las páginas de ingreso y registro, **When** un buscador las lee, **Then** le piden no indexarlas.
3. **Given** el sitemap, **When** un buscador lo lee, **Then** lista solo las páginas públicas con contenido: portada, Cómo funciona, Acerca de, Contacto y Privacidad.

### User Story 2 - Resolver dudas antes de entrar (Priority: P1)

Una persona llega a la portada y, sin crear cuenta, encuentra respuestas a las dudas más comunes (si es gratis, cómo se hace por WhatsApp, si quien organiza ve el sorteo, si hace falta cuenta, exclusiones, presupuesto).

**Acceptance Scenarios**:

1. **Given** la portada, **When** se baja hasta el final, **Then** hay una sección de preguntas frecuentes y un acceso a todas las preguntas en "Acerca de".
2. **Given** cualquier respuesta, **When** se la compara con la app, **Then** es cierta (misma fuente que la 003).

### User Story 3 - Guía paso a paso (Priority: P2)

Alguien que nunca organizó un amigo invisible quiere saber cómo se hace antes de empezar. Encuentra una página "Cómo funciona" con los pasos completos, desde crear la cuenta hasta después del sorteo, con consejos.

**Acceptance Scenarios**:

1. **Given** la portada, **When** se toca "Cómo funciona", **Then** se abre una guía con todos los pasos y un botón para empezar.
2. **Given** la guía, **When** se la lee en un celular de 360 px, **Then** se lee sin zoom ni scroll horizontal.

## Requirements *(mandatory)*

- **FR-001**: La portada MUST tener un título que incluya "sorteo de amigo invisible" y una descripción de hasta unos 160 caracteres que mencione WhatsApp y que es gratis.
- **FR-002**: Cada página pública indexable MUST declarar su URL canónica en `amigoinvisible.com.ar`.
- **FR-003**: Las páginas de ingreso, registro y confirmación del link MUST pedir no ser indexadas (las privadas ya están bloqueadas en `robots.txt`).
- **FR-004**: El sitemap MUST listar solo: `/`, `/como-funciona`, `/acerca`, `/contacto` y `/privacidad`.
- **FR-005**: La portada MUST incluir datos estructurados `WebSite` y `WebApplication` (gratuita, en español de Argentina).
- **FR-006**: La portada MUST mostrar una sección de preguntas frecuentes tomada de la misma fuente que "Acerca de", con un acceso a todas las preguntas.
- **FR-007**: El sitio MUST tener una página `/como-funciona` con la guía paso a paso, enlazada desde la portada y desde "Acerca de".
- **FR-008**: Ningún contenido nuevo MUST prometer algo que la app no hace (por ejemplo, reacomodar un sorteo).

## Fuera de alcance

- Marcado `FAQPage`: Google dejó de mostrar esos resultados enriquecidos en mayo de 2026; el contenido visible de las preguntas alcanza.
- Guías de contenido (ideas de regalo, amigo invisible en la oficina): feature futura.
- Publicidad paga, backlinks y redes sociales.

## Success Criteria *(mandatory)*

- **SC-001**: Search Console muestra las 5 páginas del sitemap como indexadas dentro de las 4 semanas de publicado.
- **SC-002**: La portada aparece en las impresiones de Search Console para búsquedas que incluyen "amigo invisible" antes del 15 de diciembre de 2026.
- **SC-003**: La prueba de resultados enriquecidos no muestra errores en los datos estructurados.
- **SC-004**: Costo adicional: USD 0.
