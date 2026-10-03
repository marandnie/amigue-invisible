# Feature Specification: Contacto, Acerca de y Política de privacidad

**Feature Branch**: `003-contacto-acerca-de`

**Created**: 2026-10-03

**Status**: Aprobada

**Input**: Pedido de Marina: "No hay botón de contacto ni acerca de. Armá un requerimiento o spec al respecto." Ampliado en la clarificación con una política de privacidad formal.

**Depende de**: `001-plataforma-gcp-dominio` (dominio y sesión) y `002-sorteo-amigo-invisible` (envío de mails).

## Clarifications

### Session 2026-10-03

- Q: ¿El contacto es solo por formulario o también se muestra un email público? → A: **Solo formulario.** No se publica ninguna dirección de email. → FR-007.
- Q: ¿Quién firma la sección "Quién lo hace"? → A: **Marina Nieto.** → FR-016.
- Q: ¿Se hace ahora una política de privacidad formal? → A: **Sí**, entra en esta feature como página propia. → US4, FR-018, FR-020 a FR-027.

## Contexto

Hoy el sitio no tiene forma de saber quién está detrás ni de escribirle a alguien. El pie de página solo dice "Hecho en Buenos Aires para que nadie se quede sin regalo." Eso genera dos problemas:

- **Confianza**: a la gente le llega un link por WhatsApp de una app que no conoce y le pide crear una cuenta. Sin una página que explique qué es, quién la hace y qué pasa con sus datos, es razonable que desconfíe.
- **Soporte**: si alguien no puede entrar, no le llegó el mail o encontró un error, no tiene a quién avisarle. Quien organiza termina siendo el soporte de todo su grupo sin poder resolver nada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escribirle al equipo (Priority: P1)

Una persona (con o sin cuenta) tiene un problema o una sugerencia. Desde cualquier página toca "Contacto" en el pie, completa un formulario corto (nombre, email, motivo y mensaje) y lo manda. Ve una confirmación clara de que el mensaje llegó y de que le van a responder a su email.

**Why this priority**: es el único canal para enterarse de errores reales en producción y para que la gente no quede trabada. Funciona solo, sin la página "Acerca de".

**Independent Test**: sin iniciar sesión, entrar a la página de contacto desde el pie, mandar un mensaje y verificar que llega a la casilla del equipo con el email de quien escribe listo para responder.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión en cualquier página, **When** toca "Contacto" en el pie, **Then** ve el formulario de contacto.
2. **Given** el formulario completo y válido, **When** lo envía, **Then** ve "¡Listo! Recibimos tu mensaje. Te respondemos a <email>." y el mensaje llega a la casilla del equipo; al responder desde esa casilla, la respuesta va directo a la persona.
3. **Given** una persona con sesión iniciada, **When** abre el formulario, **Then** el nombre y el email ya vienen completos con los de su cuenta (y los puede cambiar).
4. **Given** un email mal escrito o un mensaje vacío, **When** intenta enviar, **Then** ve el error al lado del campo y no pierde lo que ya escribió.
5. **Given** que el envío falla por un problema del servidor, **When** intenta enviar, **Then** ve un mensaje de error que le sugiere reintentar, y el texto sigue en el formulario.

---

### User Story 2 - Saber qué es y quién está detrás (Priority: P2)

Alguien recibe una invitación por WhatsApp y antes de crear la cuenta quiere saber qué es esto. Toca "Acerca de" en el pie y encuentra, en una sola página corta y legible en el celular: qué hace la app, cómo funciona el sorteo, cómo se protege el secreto, qué datos se guardan y quién la hace.

**Why this priority**: baja la desconfianza de las personas invitadas (que son la mayoría de los usuarios) y responde de antemano las preguntas que si no llegarían por contacto.

**Independent Test**: desde una invitación abierta en el celular, llegar a "Acerca de" con un toque y leer la página completa sin hacer zoom ni scroll horizontal.

**Acceptance Scenarios**:

1. **Given** cualquier página del sitio, **When** se toca "Acerca de" en el pie, **Then** se abre la página con las secciones: qué es, cómo funciona, privacidad del sorteo, qué datos guardamos, quién lo hace, preguntas frecuentes.
2. **Given** la página "Acerca de", **When** se lee la sección de privacidad, **Then** dice explícitamente que nadie (ni quien organiza ni el equipo de la app) puede ver a quién le tocó a otra persona.
3. **Given** la página "Acerca de", **When** se llega al final, **Then** hay un acceso a "Contacto".

---

### User Story 3 - Contexto automático cuando escribo desde un grupo (Priority: P3)

Una persona que está viendo un grupo (como organizadora o participante) tiene un problema con ese grupo. Desde ahí llega a contacto y el formulario ya sabe de qué grupo se trata, así el equipo no tiene que preguntar.

**Why this priority**: ahorra idas y vueltas en los casos de soporte más comunes, pero el contacto funciona sin esto.

**Independent Test**: desde la página de un grupo, ir a contacto, mandar un mensaje y verificar que el mail recibido indica el grupo de referencia.

**Acceptance Scenarios**:

1. **Given** una persona con sesión en la página de un grupo, **When** va a contacto desde ahí, **Then** el formulario muestra "Sobre el grupo: <nombre>" y el mensaje recibido incluye una referencia a ese grupo.
2. **Given** ese mismo formulario, **When** la persona quita la referencia al grupo, **Then** el mensaje se envía sin ella.
3. **Given** una persona que no pertenece al grupo referenciado, **When** intenta forzar esa referencia, **Then** el mensaje se envía sin referencia y sin revelar nada del grupo.

---

### User Story 4 - Leer la política de privacidad (Priority: P2)

Antes de crear la cuenta, o en cualquier momento después, una persona quiere saber formalmente quién es responsable de sus datos, para qué se usan, dónde se guardan y cómo pedir que se borren. Toca "Privacidad" en el pie (o el link que aparece al crear la cuenta) y lee la política completa, con fecha de última actualización.

**Why this priority**: la app guarda nombres y emails de personas, incluso de invitados que no crearon cuenta. Cumplir la normativa de datos personales y explicarlo de forma clara da confianza y evita problemas. Se puede publicar sola, sin contacto ni "Acerca de" (aunque los derechos se ejercen por contacto).

**Independent Test**: desde la pantalla de registro, abrir la política, verificar que tiene todas las secciones de FR-021 y que se lee en el celular sin zoom.

**Acceptance Scenarios**:

1. **Given** cualquier página, **When** se toca "Privacidad" en el pie, **Then** se abre la política con su fecha de última actualización.
2. **Given** la pantalla de crear cuenta (con email o con Google), **When** se la mira antes de registrarse, **Then** aparece "Al crear tu cuenta aceptás la Política de privacidad" con link a la política.
3. **Given** la política, **When** se busca cómo borrar los datos, **Then** se explica qué derechos hay (acceso, rectificación, supresión), cómo ejercerlos (formulario de contacto, motivo "Mis datos personales") y en qué plazos se responde.
4. **Given** la política, **When** se lee la sección de la autoridad de control, **Then** figura el texto informativo que exige la normativa argentina.

---

### Edge Cases

- **Alguien pide a quién le tocó a otra persona** (o "el sorteo completo") por contacto: el equipo no puede verlo ni revelarlo. El formulario lo anticipa con un aviso, y la sección de preguntas frecuentes lo explica.
- **Alguien pega en el mensaje a quién le tocó a él**: el formulario avisa "No hace falta que nos cuentes a quién le regalás"; el contenido se trata como cualquier mensaje y no se guarda en el sitio más allá del envío.
- **Spam o bots**: el formulario resiste envíos automáticos sin obligar a las personas a resolver acertijos; se limita la cantidad de mensajes por persona/origen en un período.
- **Mensaje muy largo**: hay un límite visible de caracteres con contador.
- **Doble toque en "Enviar"** (conexión lenta en el celular): se envía un solo mensaje.
- **Navegador dentro de WhatsApp/Instagram**: el formulario funciona igual (no depende de abrir una app de mail).
- **Página de grupo eliminado** usada como referencia: el mensaje se envía sin referencia.
- **Persona invitada sin cuenta** pide que borren su nombre/email: se atiende igual que a alguien con cuenta (la política aclara que también aplica a quienes fueron agregados por un organizador).
- **Pedido de supresión de alguien que está en un grupo ya sorteado**: la política explica que se borran sus datos y que quien organiza puede tener que rehacer o reacomodar el sorteo.
- **Cambio en la política**: se actualiza la fecha visible; si el cambio es relevante (nueva finalidad, nuevo tipo de dato), se avisa a quienes tienen cuenta.

## Requirements *(mandatory)*

### Functional Requirements

**Navegación**

- **FR-001**: Todas las páginas del sitio MUST mostrar en el pie los accesos "Acerca de", "Contacto" y "Privacidad", visibles con y sin sesión iniciada.
- **FR-002**: Los accesos MUST ser fáciles de tocar en el celular (área táctil cómoda) y accesibles con teclado y lector de pantalla.
- **FR-003**: Las tres páginas MUST poder abrirse sin cuenta y sin iniciar sesión, y tener una dirección propia que se pueda compartir.

**Contacto**

- **FR-004**: El formulario MUST pedir: nombre (obligatorio), email (obligatorio, validado), motivo (obligatorio: "Problema para entrar", "Problema con un grupo o el sorteo", "Mis datos personales", "Sugerencia", "Otra cosa") y mensaje (obligatorio, máximo 2000 caracteres con contador).
- **FR-005**: Con sesión iniciada, nombre y email MUST venir precompletados con los de la cuenta y ser editables.
- **FR-006**: Al enviar, el mensaje MUST llegar a la casilla del equipo con nombre, email, motivo, mensaje, fecha y hora (es-AR), si la persona tenía sesión y, si corresponde, la referencia al grupo (FR-011). Responder desde la casilla MUST dirigirse al email de la persona.
- **FR-007**: El formulario MUST ser el único canal de contacto. El sitio MUST NOT mostrar ninguna dirección de email del equipo (tampoco en "Acerca de" ni en la política de privacidad).
- **FR-008**: El formulario MUST mostrar, antes del botón de enviar, el aviso: "Por privacidad, nadie (ni nosotros) puede ver a quién le tocó a cada persona, así que no podemos contarte resultados del sorteo."
- **FR-009**: El sistema MUST rechazar envíos automáticos sin pedir a las personas que resuelvan desafíos visibles, y MUST limitar a 5 mensajes por hora por persona/origen, con un mensaje amable si se supera.
- **FR-010**: El sistema MUST NOT guardar los mensajes en la base de datos del sitio ni enviar una copia automática a quien escribe (evita usar el formulario para mandar mails a terceros). Los registros técnicos MUST NOT incluir el contenido del mensaje.
- **FR-011**: Si la persona llega desde un grupo al que pertenece, el mensaje MUST poder incluir una referencia a ese grupo (nombre e identificador), y la persona MUST poder quitarla. La referencia MUST NOT incluir asignaciones, listas de deseos ni datos de otros participantes. Si la persona no pertenece al grupo, la referencia se descarta en silencio.
- **FR-012**: El botón de enviar MUST quedar deshabilitado mientras se envía, para evitar mensajes duplicados.

**Acerca de**

- **FR-013**: La página "Acerca de" MUST incluir, en este orden: (1) qué es la app, en dos o tres líneas; (2) cómo funciona, en tres pasos; (3) privacidad del sorteo; (4) qué datos guardamos y para qué; (5) quién lo hace; (6) preguntas frecuentes; (7) acceso a contacto.
- **FR-014**: La sección de privacidad MUST afirmar que el sorteo lo hace el servidor, que cada persona ve solo su propia asignación y que ni quien organiza ni el equipo de la app pueden ver las asignaciones ajenas.
- **FR-015**: La sección de datos MUST listar qué se guarda (nombre, email, grupos, listas de deseos, asignación propia), para qué se usa (solo para que funcione el sorteo y los avisos), que no se venden ni se comparten, y cómo pedir la baja de la cuenta (vía contacto).
- **FR-016**: La sección "Quién lo hace" MUST decir que la app la hace **Marina Nieto**, en Buenos Aires, como proyecto independiente, con un acceso a contacto.
- **FR-017**: Las preguntas frecuentes MUST cubrir al menos: ¿Es gratis? · ¿Quien organiza puede ver a quién me tocó? · ¿Qué pasa si alguien se baja después del sorteo? · No me llegó el mail, ¿qué hago? · ¿Puedo cambiar mi lista de deseos después del sorteo? · ¿Cómo borro mi cuenta?
- **FR-018**: La sección "Qué datos guardamos" de "Acerca de" MUST ser un resumen en lenguaje simple y terminar con un link a la Política de privacidad completa.
- **FR-019**: Todos los textos MUST estar en español rioplatense con voseo y lenguaje tradicional, coherentes con el tono del resto del sitio (cálido, sin tecnicismos).

**Política de privacidad**

- **FR-020**: El sitio MUST tener una página "Política de privacidad" con fecha de última actualización visible, accesible desde el pie, desde "Acerca de" y desde la pantalla de crear cuenta.
- **FR-021**: La política MUST incluir, como mínimo:
  1. **Responsable** de los datos: Marina Nieto, y cómo contactarla (formulario de contacto).
  2. **Qué datos se tratan**: de quien tiene cuenta (nombre, email, foto de perfil si entra con Google), de participantes agregados por un organizador aunque no tengan cuenta (nombre y email opcional), contenido de grupos y listas de deseos, asignación propia, mensajes de contacto, y datos técnicos mínimos (cookie de sesión, registros técnicos).
  3. **Para qué**: únicamente para organizar el sorteo, mandar los avisos de la app, responder consultas y mantener la seguridad del servicio. Sin publicidad, sin venta ni cesión de datos, sin perfiles de marketing.
  4. **Privacidad del sorteo**: nadie, ni el responsable, puede ver asignaciones ajenas.
  5. **Base**: el consentimiento al crear la cuenta, y, para participantes agregados por un organizador, la responsabilidad de quien organiza de contar con su acuerdo para cargar su nombre y email.
  6. **Proveedores que tratan datos** por cuenta del responsable (alojamiento, autenticación, envío de mails), con el **país** donde se alojan los datos, aclarando que hay transferencia internacional (fuera de Argentina) y con qué resguardos.
  7. **Cookies**: solo las necesarias para la sesión; sin cookies de publicidad ni de seguimiento de terceros.
  8. **Conservación**: cuánto tiempo se guardan los datos de grupos, cuentas y mensajes de contacto, y qué pasa al borrar un grupo o una cuenta.
  9. **Derechos** de acceso, rectificación, actualización y supresión, cómo ejercerlos (formulario, motivo "Mis datos personales") y los plazos de respuesta que fija la normativa.
  10. **Autoridad de control**: el texto informativo vigente que exige la normativa argentina sobre el organismo de control de datos personales y la posibilidad de presentar reclamos ante él.
  11. **Menores**: el servicio está pensado para mayores de edad; si un organizador agrega a un menor, lo hace bajo responsabilidad de sus padres o tutores.
  12. **Cambios** en la política y cómo se avisan.
- **FR-022**: La pantalla de crear cuenta (todas las variantes: email + contraseña, link por email y Google) MUST mostrar "Al crear tu cuenta aceptás la Política de privacidad", con link, antes del botón que crea la cuenta.
- **FR-023**: El formulario de agregar participantes (organizador) MUST recordar en una línea: "Cargá solo gente que esté de acuerdo en participar."
- **FR-024**: Los pedidos de acceso, rectificación y supresión MUST poder hacerse por el formulario de contacto, con o sin cuenta. Antes de entregar o borrar datos, el responsable MUST verificar que quien pide es titular del email (por ejemplo, respondiendo desde esa casilla).
- **FR-025**: Lo que la política afirma MUST ser cierto para el sitio en producción (proveedores, ubicación de los datos, cookies, plazos de conservación). Cualquier feature futura que cambie alguno de esos puntos MUST actualizar la política y su fecha.
- **FR-026**: Si un cambio en la política agrega una finalidad o un tipo de dato nuevo, el sistema MUST avisar a quienes tienen cuenta antes de que el cambio aplique.
- **FR-027**: La política MUST estar escrita en lenguaje claro (frases cortas, sin jerga legal innecesaria), con un resumen de 3 a 5 puntos al principio.


### Key Entities

- **Mensaje de contacto**: nombre, email, motivo, texto, fecha y hora, indicador de sesión y referencia opcional a un grupo. Es transitorio: se entrega a la casilla del equipo y no se conserva en el sitio.
- **Política de privacidad**: texto público con fecha de última actualización; cada versión relevante se puede identificar por su fecha.
- **Pedido sobre datos personales**: un mensaje de contacto con motivo "Mis datos personales"; se atiende a mano dentro de los plazos legales.
- **Referencia de grupo**: nombre e identificador de un grupo al que pertenece quien escribe. Nunca incluye datos de otras personas ni asignaciones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier página, una persona llega a "Contacto" o "Acerca de" con un solo toque.
- **SC-002**: Una persona completa y envía el formulario de contacto en menos de 2 minutos desde el celular.
- **SC-003**: El 100% de los mensajes enviados con éxito llegan a la casilla del equipo en menos de 5 minutos.
- **SC-004**: En pruebas con 5 personas que nunca usaron la app, al menos 4 pueden responder después de leer "Acerca de": "¿quien organiza puede ver a quién te tocó?" y "¿qué datos guardan de vos?".
- **SC-005**: Ningún mensaje recibido, registro técnico o pantalla de contacto contiene una asignación ajena (verificable revisando los mails de prueba y los registros).
- **SC-006**: Las tres páginas se leen completas en un celular de 360 px de ancho sin zoom ni scroll horizontal.
- **SC-007**: El 100% de las variantes de registro muestran el link a la política antes de crear la cuenta.
- **SC-008**: Una revisión punto por punto confirma que cada afirmación de la política (proveedores, país, cookies, plazos) coincide con lo que está en producción el día que se publica.

## Assumptions

- El equipo es Marina sola; "la casilla del equipo" es una casilla que ella elige y se configura como secreto, no en el código.
- Se reutiliza el mismo proveedor de mail que ya usa la app (feature 002) para entregar los mensajes; no hace falta un servicio nuevo.
- La política la redacta el equipo a partir de esta spec; se recomienda una revisión por alguien con conocimientos legales antes de publicarla. Esta spec no reemplaza asesoramiento legal.
- Puede corresponder inscribir la base de datos ante el organismo de control; ese trámite es administrativo, queda fuera del código y se verifica antes de publicar.
- Los plazos legales concretos de respuesta y el texto obligatorio sobre la autoridad de control se toman de la normativa vigente al momento de implementar.
- No hay términos y condiciones de uso en esta feature; solo política de privacidad.
- La baja de cuenta se pide por contacto y se hace a mano; un botón de "borrar mi cuenta" queda fuera de alcance.
- El nombre "Contacto" alcanza; no se agrega chat en vivo, WhatsApp de soporte ni sistema de tickets.
- El pie actual ("Hecho en Buenos Aires…") se conserva y se le suman los accesos.
- Sin versión en inglés (constitución, principio II).

## Fuera de alcance

- Chat en vivo, bot de soporte o centro de ayuda con buscador.
- Panel para ver o responder mensajes dentro de la app.
- Botón de autoservicio para borrar la cuenta.
- Página de prensa, blog o novedades.
- Términos y condiciones de uso.
- Banner de consentimiento de cookies (no hace falta mientras solo se usen cookies necesarias).
- Exportación automática de datos o borrado de cuenta en autoservicio.
