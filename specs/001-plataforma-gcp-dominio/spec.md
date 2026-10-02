# Feature Specification: Plataforma en producción con dominio propio

**Feature Branch**: `001-plataforma-gcp-dominio`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Deployar el proyecto en amigoinvisible.com.ar y amigueinvisible.com.ar, en GCP como el resto de los proyectos, sin Postgres ni RDS ni S3/CloudFront. amigoinvisible.com.ar es el dominio principal; el DNS va en Cloudflare."

## Contexto

Es la primera feature: un *walking skeleton* que deja la app publicada en su dominio definitivo, con login funcionando y deploy automático. Las features de producto (grupos, sorteo, wishlists, exclusiones) se construyen después encima de esta base (ver `specs/002-sorteo-amigo-invisible/`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar a la app por su dominio (Priority: P1)

Una persona escribe `amigoinvisible.com.ar` en el celular (o toca un link que le mandaron) y ve la página de inicio de Amigo Invisible, en español, con conexión segura (candado) y sin advertencias del navegador.

**Why this priority**: sin esto no existe el producto para nadie. Es lo mínimo para poder compartir un link.

**Independent Test**: abrir `https://amigoinvisible.com.ar` desde un celular con datos móviles y desde una compu; ver la landing en español con certificado válido.

**Acceptance Scenarios**:

1. **Given** el sitio publicado, **When** alguien entra a `https://amigoinvisible.com.ar`, **Then** ve la landing en español con certificado válido.
2. **Given** el sitio publicado, **When** alguien entra a `http://amigoinvisible.com.ar` (sin https), **Then** termina en `https://amigoinvisible.com.ar` sin error.
3. **Given** el sitio publicado, **When** alguien entra a una ruta que no existe, **Then** ve una página "no encontrado" en español con un link al inicio.

---

### User Story 2 - Los otros dominios llevan al principal (Priority: P1)

Quien escriba `amigueinvisible.com.ar`, `www.amigueinvisible.com.ar` o `www.amigoinvisible.com.ar` termina en `https://amigoinvisible.com.ar`, en la misma ruta que había pedido.

**Why this priority**: los dos dominios ya están pagos y alguien los va a usar; si no redirigen, se ven rotos. Tener un solo dominio canónico también evita problemas de sesión entre dominios.

**Independent Test**: abrir cada una de las cuatro variantes con una ruta (por ejemplo `/invitaciones/abc`) y verificar que el navegador termina en `https://amigoinvisible.com.ar/invitaciones/abc`.

**Acceptance Scenarios**:

1. **Given** los redirects configurados, **When** alguien entra a `https://amigueinvisible.com.ar/cualquier/ruta`, **Then** recibe una redirección permanente a `https://amigoinvisible.com.ar/cualquier/ruta`.
2. **Given** los redirects configurados, **When** alguien entra a `www.amigoinvisible.com.ar`, **Then** termina en `https://amigoinvisible.com.ar`.
3. **Given** los redirects configurados, **When** alguien entra a cualquier variante por `http://`, **Then** termina en `https://amigoinvisible.com.ar` con certificado válido en cada salto.

---

### User Story 3 - Crear cuenta, entrar y salir (Priority: P2)

Una persona puede crearse una cuenta y entrar de tres formas: con email y contraseña, con un link que le llega por mail, o con su cuenta de Google. Una vez adentro ve su panel (todavía vacío) y puede cerrar sesión.

**Why this priority**: todas las features de producto necesitan saber quién es quién. Validarlo en producción temprano evita sorpresas de dominio, cookies y redirecciones que solo aparecen en el dominio real.

**Independent Test**: en producción, crear una cuenta con cada uno de los tres métodos, llegar a "Mis grupos", cerrar sesión y volver a entrar.

**Acceptance Scenarios**:

1. **Given** una persona sin cuenta, **When** se registra con email y contraseña, **Then** recibe un mail de verificación en español y, al entrar, ve su panel.
2. **Given** una persona sin cuenta, **When** pide un link de acceso por mail y lo abre en el mismo dispositivo, **Then** queda logueada y ve su panel.
3. **Given** una persona con cuenta de Google, **When** elige "Continuar con Google", **Then** queda logueada y ve su panel, también desde el navegador del celular.
4. **Given** una persona sin sesión, **When** intenta abrir una página privada (por ejemplo "Mis grupos"), **Then** la lleva al login y, después de entrar, vuelve a la página que quería.
5. **Given** una persona logueada, **When** cierra sesión, **Then** ya no puede ver páginas privadas sin volver a entrar.
6. **Given** que los mails de la app salen del dominio propio, **When** llega cualquier mail de acceso o verificación, **Then** el remitente y los links usan `amigoinvisible.com.ar`.

---

### User Story 4 - Publicar cambios sin tocar nada a mano (Priority: P2)

Como responsable del proyecto, cuando integro un cambio a la rama principal, la versión nueva queda publicada sola en unos minutos. Si la versión nueva no compila, el sitio sigue funcionando con la anterior.

**Why this priority**: con SDD vamos a publicar feature por feature; el deploy tiene que ser aburrido.

**Independent Test**: integrar un cambio visible (por ejemplo un texto de la landing) y verificar que aparece en producción; integrar un cambio que rompe el build y verificar que el sitio sigue sirviendo la versión anterior.

**Acceptance Scenarios**:

1. **Given** un cambio integrado a la rama principal, **When** termina la publicación, **Then** el cambio se ve en `https://amigoinvisible.com.ar`.
2. **Given** un cambio que rompe el build, **When** falla la publicación, **Then** el sitio sigue respondiendo con la versión anterior y el fallo queda visible para el responsable.
3. **Given** una versión publicada con un problema, **When** el responsable pide volver atrás, **Then** puede reponer la versión anterior sin recompilar.

---

### User Story 5 - Costo acotado y avisos (Priority: P3)

Como responsable (y FinOps), quiero que el proyecto cueste prácticamente cero sin tráfico, tener un techo de gasto y enterarme por mail si el gasto se acerca a ese techo.

**Why this priority**: el tráfico va a ser muy estacional (noviembre–diciembre) y casi nulo el resto del año.

**Independent Test**: revisar que existe la alerta de presupuesto con destinatario correcto y que el cómputo tiene un máximo de instancias; después de una semana sin tráfico, el costo diario del proyecto es ~0.

**Acceptance Scenarios**:

1. **Given** el proyecto creado, **When** el gasto del mes llega al 50 %, 90 % y 100 % del presupuesto, **Then** llega un aviso por mail al responsable.
2. **Given** ningún visitante durante horas, **When** se revisa el cómputo, **Then** no hay instancias corriendo.

---

### Edge Cases

- Primer visitante después de horas sin tráfico: la página puede tardar más en responder (arranque en frío), pero no debe dar error ni timeout.
- El certificado de un dominio todavía se está emitiendo: ese dominio puede mostrar advertencia durante la ventana de emisión; el dominio principal debe estar listo antes de anunciar la app.
- Alguien abre el link de acceso por mail en otro dispositivo o navegador: se le pide confirmar su email antes de completar el login.
- Alguien intenta registrarse con un email que ya existe con otro método (por ejemplo, ya entró con Google): se le explica cómo entrar, sin crear una cuenta duplicada.
- Alguien pega una URL con `amigueinvisible` en WhatsApp: la vista previa debe funcionar igual (la redirección no rompe la vista previa del link).
- El dominio vence en NIC.ar: el vencimiento (17/04/2027) debe estar agendado con anticipación.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST servir la app en `https://amigoinvisible.com.ar` con un certificado TLS válido que se renueva solo.
- **FR-002**: El sistema MUST redirigir con código permanente (301/308) `www.amigoinvisible.com.ar`, `amigueinvisible.com.ar`, `www.amigueinvisible.com.ar` y el dominio por defecto de App Hosting (`*.hosted.app`) a `https://amigoinvisible.com.ar`, conservando ruta y query string.
- **FR-003**: El sistema MUST redirigir todo pedido `http://` a `https://`.
- **FR-004**: Toda la interfaz de esta feature (landing, login, registro, panel, errores) MUST estar en español de Argentina.
- **FR-005**: Las personas MUST poder registrarse y entrar con (a) email y contraseña, (b) link de acceso por mail, (c) cuenta de Google.
- **FR-006**: El registro con email y contraseña MUST enviar un mail de verificación; la contraseña MUST tener al menos 10 caracteres.
- **FR-007**: Una misma dirección de email MUST corresponder a una sola cuenta, sin importar el método de acceso.
- **FR-008**: Las páginas privadas MUST exigir sesión válida verificada en el servidor; sin sesión, MUST redirigir al login y volver a la página original al terminar.
- **FR-009**: La sesión MUST durar hasta 14 días sin necesidad de volver a entrar, y el cierre de sesión MUST invalidarla.
- **FR-010**: Los mails de acceso y verificación MUST salir con remitente del dominio `amigoinvisible.com.ar` y en español.
- **FR-011**: El sistema MUST guardar un perfil mínimo por persona (nombre para mostrar, email, fecha de alta) accesible solo por esa persona.
- **FR-012**: Integrar cambios a la rama principal MUST publicar la nueva versión automáticamente; un build fallido MUST NOT reemplazar la versión en línea.
- **FR-013**: El responsable MUST poder volver a una versión anterior publicada.
- **FR-014**: El proyecto MUST tener una alerta de presupuesto mensual con avisos al 50 %, 90 % y 100 %, y un límite máximo de instancias de cómputo.
- **FR-015**: El cómputo MUST escalar a cero instancias sin tráfico.
- **FR-016**: Ningún secreto (credenciales, claves) MUST quedar en el repositorio.

### Key Entities

- **Persona usuaria (perfil)**: quien tiene cuenta. Nombre para mostrar, email, métodos de acceso vinculados, fecha de alta. Es la base sobre la que la feature 002 cuelga grupos y participaciones.
- **Dominio**: cada uno de los cuatro nombres (dos dominios × con y sin `www`), con su rol (principal o redirección) y el estado de su certificado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Las 4 variantes de dominio × `http`/`https` (8 URLs) terminan en `https://amigoinvisible.com.ar` con certificado válido, en 2 saltos como máximo.
- **SC-002**: Con la app "tibia", la landing carga en menos de 2,5 s (p75) desde un celular con 4G en Buenos Aires; en arranque en frío, en menos de 6 s.
- **SC-003**: Una persona nueva completa registro + primer ingreso en menos de 2 minutos con cualquiera de los 3 métodos.
- **SC-004**: Desde que se integra un cambio hasta que está en producción pasan menos de 10 minutos.
- **SC-005**: Con menos de 1.000 visitas por mes, el costo mensual del proyecto en la nube es menor a USD 1 (sin contar el dominio).
- **SC-006**: Los mails de acceso llegan a la bandeja de entrada (no a spam) en Gmail y Outlook en las pruebas.

## Assumptions

- Los dos dominios ya están registrados en NIC.ar a nombre de la responsable del proyecto (registrados el 17/04/2025, vencen el 17/04/2027) y ella puede cambiar su delegación con Clave Fiscal.
- Se usa una cuenta de Google Cloud / Firebase nueva y dedicada a este proyecto, con facturación habilitada.
- Un arranque en frío de algunos segundos es aceptable a cambio de costo cero en reposo.
- Los tres métodos de acceso de DESIGN.md se mantienen en v1. No hay 2FA ni otros proveedores sociales.
- El panel "Mis grupos" puede estar vacío en esta feature; grupos e invitaciones son la feature 002.
- La app solo se ofrece en español; no hace falta selector de idioma.
- Cloudflare se usa solo como DNS (sin proxy/CDN delante de la app).
