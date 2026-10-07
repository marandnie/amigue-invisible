# Feature Specification: Analítica de visitas

**Feature Branch**: `007-analitica-web`

**Created**: 2026-10-07

**Status**: Draft

**Input**: Marina quiere ver cuánta gente visita la web. El dominio está en Cloudflare en modo *DNS only*, así que la analítica de tráfico de Cloudflare queda vacía. Google Analytics se descartó en la 004.

**Depende de**: `003-contacto-acerca-de` (política de privacidad) y `006-seo` (páginas públicas).

## Clarifications

### Session 2026-10-07

- Q: ¿Con qué herramienta? → A: **Cloudflare Web Analytics** (gratis, sin cookies, funciona sin proxy, se ve en el mismo Cloudflare).
- Q: La política de privacidad (003, FR-026) obliga a avisar por mail a quienes tienen cuenta si se agrega una finalidad nueva. ¿Se avisa? → [NEEDS CLARIFICATION: opción A, mandar un aviso corto por mail antes del deploy; opción B, no avisar porque la medición es solo en páginas públicas, sin cookies y sin datos que guardemos nosotros. Recomendación: **A**, son pocas cuentas y es lo que prometimos.]

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver las visitas (Priority: P1)

Marina entra a Cloudflare → Web Analytics y ve, para `amigoinvisible.com.ar`: visitas por día, páginas más vistas, de dónde llegan (Google, WhatsApp, directo), país y tipo de dispositivo.

**Independent Test**: abrir la portada desde un celular y ver la visita en el panel en pocos minutos.

**Acceptance Scenarios**:

1. **Given** alguien abre una página pública, **When** pasan unos minutos, **Then** la visita aparece en Cloudflare Web Analytics.
2. **Given** alguien con bloqueador de anuncios, **When** abre una página, **Then** la página funciona igual (la visita puede no contarse).

### User Story 2 - Medir sin exponer nada privado (Priority: P1)

Las páginas privadas y los links de invitación nunca se miden, para que ningún token, id de grupo ni dato personal salga del sitio.

**Acceptance Scenarios**:

1. **Given** una página de invitación (`/invitaciones/<token>`), un grupo, "Mis grupos" o "Mi perfil", **When** se abre, **Then** no se carga el script de analítica.
2. **Given** alguien que entra por la portada y después navega a un grupo sin recargar, **When** cambia de página, **Then** la navegación al grupo no se mide.

## Requirements *(mandatory)*

- **FR-001**: El script de Cloudflare Web Analytics MUST cargarse solo en las páginas públicas: `/`, `/como-funciona`, `/acerca`, `/contacto`, `/privacidad`, `/ingresar` y `/registro`.
- **FR-002**: MUST NOT medirse las navegaciones dentro de la app después de la carga inicial (sin seguimiento de SPA), para que nunca se registre una ruta privada.
- **FR-003**: Sin el token configurado, la app MUST funcionar igual y no cargar el script (desarrollo, emuladores).
- **FR-004**: El token MUST configurarse fuera del código de la app, en `apphosting.yaml`. No es secreto: queda visible en el HTML.
- **FR-005**: La política de privacidad MUST actualizarse antes del deploy: Cloudflare como proveedor (EE. UU.), la medición agregada de visitas como finalidad, los datos que procesa y la nueva fecha. Lo de cookies sigue igual (no se agregan).
- **FR-006**: Si la clarificación lo decide, MUST avisarse por mail a quienes tienen cuenta antes de que el cambio aplique (003, FR-026).

## Success Criteria *(mandatory)*

- **SC-001**: Las visitas a la portada aparecen en el panel dentro de las 24 h del deploy.
- **SC-002**: Revisando el HTML de `/invitaciones/<token>`, `/grupos/<id>`, `/mis-grupos` y `/perfil`, ninguno carga `beacon.min.js`.
- **SC-003**: Costo adicional: USD 0.

## Fuera de alcance

- Eventos personalizados (registros, sorteos hechos): ya están los avisos de la 004.
- Proxy de Cloudflare (nube naranja): rompería el certificado y las redirecciones de App Hosting.
- Banner de cookies: no hace falta, no se agregan cookies.
