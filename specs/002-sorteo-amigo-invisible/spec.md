# Feature Specification: Sorteo de amigo invisible

**Feature Branch**: `002-sorteo-amigo-invisible`

**Created**: 2026-09-30

**Status**: En implementación (US1–US6 hechas; falta US7 y los rebotes de US6)

**Input**: DESIGN.md (features 1–4: crear grupo e invitar, sorteo secreto, exclusiones y listas de deseos, presupuesto y datos del evento), adaptado a la constitución v1.0.0.

**Depende de**: `001-plataforma-gcp-dominio` (dominio, cuentas y sesión).

## Clarifications

### Session 2026-10-02

- Q: ¿Se puede rehacer el sorteo una vez hecho (por ejemplo, si alguien se baja)? → A: Sí, con **arreglo mínimo**. Si alguien se baja, solo cambia la persona que le regalaba a quien se fue: pasa a regalarle a quien le tocaba a esa persona. El resto queda igual. Para sumar a alguien después del sorteo se rehace todo, avisando a todos. Solo lo hace quien organiza. → US7, FR-016, FR-026 a FR-030.
- Q: ¿Quien organiza siempre entra en el sorteo? → A: No necesariamente. Existe la opción de solo organizar. → FR-004, US1.
- Q: ¿Lenguaje inclusivo o tradicional? → A: Tradicional. → FR-025.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organizar un grupo e invitar (Priority: P1)

Una persona con cuenta arma un grupo ("Navidad familia Nieto"): pone nombre, presupuesto, fecha, lugar y notas. Agrega a cada participante con su nombre (y opcionalmente su email) y obtiene un link de invitación personal para cada uno, que manda por WhatsApp o por donde quiera. Ve en todo momento quién ya se sumó y quién falta.

**Why this priority**: sin grupo y sin gente adentro no hay sorteo. Compartir por WhatsApp hace que esta historia funcione sola, sin depender del envío de mails (US6).

**Independent Test**: crear un grupo con 4 participantes, copiar los 4 links y ver la lista con estado "pendiente" para cada uno.

**Acceptance Scenarios**:

1. **Given** una persona logueada, **When** crea un grupo con nombre, presupuesto y fecha, **Then** queda como organizadora y ve la página del grupo.
2. **Given** un grupo sin sortear, **When** la organizadora agrega a "Tía Marta", **Then** aparece en la lista como "pendiente" con un botón para copiar su link y otro para compartirlo por WhatsApp.
3. **Given** un grupo sin sortear, **When** la organizadora pega una lista de nombres (uno por línea, con email opcional), **Then** se crean todos los participantes de una vez y avisa si hay nombres o emails repetidos.
4. **Given** un participante pendiente, **When** la organizadora lo saca del grupo o regenera su link, **Then** el link anterior deja de funcionar.
5. **Given** un grupo, **When** la organizadora edita presupuesto, fecha, lugar o notas, **Then** todos los participantes ven los datos nuevos.
6. **Given** una persona creando un grupo, **When** destilda "Yo también participo", **Then** queda como organizadora pero no entra en el sorteo ni tiene página de participante.

---

### User Story 2 - Sumarse a un grupo desde la invitación (Priority: P1)

Quien recibe el link lo abre en el celular, ve de qué grupo se trata (nombre, organizadora, presupuesto, fecha) y con un par de toques entra (o se crea la cuenta) y queda adentro.

**Why this priority**: es la primera impresión para la mayoría de la gente; si se traba acá, el grupo no se completa.

**Independent Test**: abrir un link de invitación en un celular sin sesión, crear cuenta y ver el grupo en "Mis grupos".

**Acceptance Scenarios**:

1. **Given** un link de invitación válido y una persona sin sesión, **When** lo abre, **Then** ve los datos del grupo y las opciones para entrar o crear cuenta, y al terminar vuelve a la invitación.
2. **Given** una persona logueada que abre un link válido, **When** toca "Me sumo", **Then** queda como participante y la organizadora ve su estado como "sumado".
3. **Given** un link vencido, revocado o ya usado por otra cuenta, **When** alguien lo abre, **Then** ve un mensaje claro y la sugerencia de pedirle un link nuevo a la organizadora.
4. **Given** una persona que ya está en el grupo, **When** abre otro link del mismo grupo, **Then** no se la agrega dos veces y se le avisa.

---

### User Story 3 - Sortear y descubrir a quién le regalo (Priority: P1)

Cuando ya se sumaron al menos 3 personas, la organizadora toca "Hacer el sorteo". A cada participante le toca otra persona, nunca a sí misma. Cada una entra a su página del grupo y descubre a quién le regala con un momento de revelación ("tocá para descubrir"). Nadie más puede saberlo.

**Why this priority**: es el corazón del producto.

**Independent Test**: con 4 participantes sumados, hacer el sorteo y verificar desde cada cuenta que ve una sola persona asignada, distinta de sí misma, y que entre todas las asignaciones cada persona recibe exactamente un regalo.

**Acceptance Scenarios**:

1. **Given** un grupo con ≥ 3 participantes sumados y sin sortear, **When** la organizadora hace el sorteo, **Then** cada participante tiene exactamente una persona asignada, nadie se tiene a sí mismo y cada participante es asignado exactamente una vez.
2. **Given** un grupo sorteado, **When** un participante entra a su página del grupo, **Then** ve solo a quién le regala (con su lista de deseos) y ningún otro par.
3. **Given** un grupo sorteado, **When** la organizadora entra a la página del grupo, **Then** ve que el sorteo se hizo y cuándo, pero no ve ninguna asignación salvo la propia (si participa).
4. **Given** un grupo con participantes pendientes, **When** la organizadora intenta sortear, **Then** se le avisa quiénes quedan afuera y tiene que confirmar.
5. **Given** un grupo con menos de 3 sumados, **When** se intenta sortear, **Then** la acción no está disponible y se explica por qué.
6. **Given** un grupo sorteado, **When** un participante intenta sumar o sacar gente, **Then** no puede. Solo la organizadora puede reacomodar (US7).

---

### User Story 4 - Lista de deseos (Priority: P2)

Cada participante arma su lista de deseos: ítems de texto con un link opcional (por ejemplo a Mercado Libre). Quien le tiene que regalar ve esa lista en su página. La lista se puede editar también después del sorteo.

**Why this priority**: mejora mucho la experiencia, pero se puede hacer un sorteo sin listas.

**Independent Test**: un participante carga 3 ítems; después del sorteo, quien lo tiene asignado ve esos 3 ítems y nadie más los ve desde su propia página.

**Acceptance Scenarios**:

1. **Given** un participante sumado, **When** agrega, edita o borra un ítem, **Then** su lista se actualiza.
2. **Given** un grupo sorteado, **When** quien regala abre su página, **Then** ve la lista actualizada de su persona asignada, con links que abren en otra pestaña.
3. **Given** un ítem con un link que no es `http(s)`, **When** se guarda, **Then** se rechaza con un mensaje claro.

---

### User Story 5 - Exclusiones (Priority: P2)

La organizadora puede marcar pares que no deben tocarse entre sí (por ejemplo, una pareja). Por defecto la exclusión es mutua. El sorteo las respeta y, si no hay forma de cumplirlas todas, lo dice claramente en lugar de fallar en silencio.

**Why this priority**: es muy común en grupos familiares, pero el sorteo básico funciona sin exclusiones.

**Independent Test**: con 4 participantes y la pareja A–B excluida, sortear 20 veces en un entorno de prueba: nunca A→B ni B→A.

**Acceptance Scenarios**:

1. **Given** un grupo sin sortear, **When** la organizadora excluye a A y B (mutua), **Then** el sorteo nunca asigna A→B ni B→A.
2. **Given** exclusiones imposibles de cumplir (por ejemplo, 3 personas todas excluidas entre sí), **When** se intenta sortear, **Then** no se sortea y se explica que las exclusiones son demasiado restrictivas.
3. **Given** exclusiones cargadas, **When** un participante mira el grupo, **Then** no ve las exclusiones de otras personas.

---

### User Story 6 - Avisos por mail (Priority: P3)

Si la organizadora cargó el email de un participante, la app le manda la invitación por mail. Cuando se hace el sorteo, todos los participantes reciben un mail avisando que ya pueden ver a quién le regalan, **sin decir a quién** (hay que entrar a la app).

**Why this priority**: WhatsApp cubre la invitación en la mayoría de los casos; el mail es comodidad.

**Independent Test**: agregar un participante con email → llega la invitación; hacer el sorteo → cada participante recibe el aviso sin el nombre asignado.

**Acceptance Scenarios**:

1. **Given** un participante con email cargado, **When** se lo agrega, **Then** recibe un mail en español con su link de invitación.
2. **Given** un grupo sorteado, **When** termina el sorteo, **Then** cada participante recibe un mail con un link a su página del grupo, que no incluye a quién le toca.
3. **Given** un mail que rebota, **When** la organizadora mira el grupo, **Then** ve que ese participante no recibió el mail.

---

### User Story 7 - Reacomodar después del sorteo (Priority: P3)

Ya se hizo el sorteo y alguien se baja, o hay que sumar a una persona que se olvidaron. La organizadora puede reacomodar tocando lo mínimo posible. Nadie, ni siquiera ella, se entera de las asignaciones de otros.

**Why this priority**: pasa seguido en grupos grandes, pero el sorteo funciona sin esto.

**Independent Test**: con 5 participantes sorteados, dar de baja a uno y verificar que cambió exactamente una asignación, que el resultado sigue siendo válido y que solo recibió aviso la persona afectada.

**Acceptance Scenarios**:

1. **Given** un grupo sorteado donde A le regala a X y X le regala a B, **When** la organizadora da de baja a X, **Then** A pasa a regalarle a B, el resto de las asignaciones no cambia y solo A recibe el aviso de que cambió su persona.
2. **Given** que el arreglo mínimo no es posible (A le regala a X y X le regala a A, o A tiene excluida a B), **When** la organizadora da de baja a X, **Then** se le ofrece rehacer todo el sorteo y, si confirma, se sortea de nuevo y se avisa a todos.
3. **Given** un grupo sorteado, **When** la organizadora suma a una persona nueva, **Then** se le avisa que hay que rehacer todo el sorteo. Si confirma y la persona ya se sumó, se sortea de nuevo y se avisa a todos.
4. **Given** un reacomodo, **When** la organizadora mira el grupo, **Then** ve que se reacomodó y cuándo, pero no a quién le cambió la asignación.
5. **Given** un grupo sorteado de 3 personas, **When** se baja una, **Then** el sorteo se anula, el grupo vuelve a "sin sortear" y se avisa a quienes quedan.

---

### Edge Cases

- Dos personas con el mismo nombre en un grupo: se distinguen (por ejemplo, con la inicial del email o un apodo).
- La organizadora se borra a sí misma del grupo: no se permite; primero tiene que borrar el grupo o transferirlo (transferir queda fuera de v1).
- Alguien reenvía su link de invitación y otra persona lo usa primero: la organizadora ve con qué email se sumó ese lugar y puede sacarlo y regenerar el link.
- Alguien adivina o modifica una URL para ver la página de otro participante: la ve solo si esa página es suya.
- Doble toque en "Hacer el sorteo" o dos pestañas a la vez: el sorteo ocurre una sola vez.
- Grupo de 50 personas con muchas exclusiones: el sorteo responde en segundos o explica por qué no puede.
- Una persona participa en varios grupos: "Mis grupos" los muestra separados por "organizo" y "participo".
- Se borra el grupo: desaparecen sus participantes, listas, exclusiones y asignaciones.
- Se baja alguien de un par recíproco (A↔X): el arreglo mínimo dejaría a A regalándose a sí mismo, así que se ofrece rehacer todo.
- Quien organiza no participa: los mínimos de 3 personas y todos los conteos son sobre participantes, sin contarla a ella.
- Se baja quien organiza: no se puede (ver arriba); primero borra el grupo.
- Link de lista de deseos malicioso (`javascript:`): se rechaza.

## Requirements *(mandatory)*

### Functional Requirements

**Grupos**

- **FR-001**: Una persona con cuenta MUST poder crear un grupo con nombre (obligatorio), presupuesto, moneda (ARS por defecto), fecha y hora del evento, lugar y notas (opcionales). Quien lo crea queda como organizadora.
- **FR-002**: La organizadora MUST poder editar los datos del grupo en cualquier momento y borrar el grupo entero.
- **FR-003**: "Mis grupos" MUST listar los grupos que la persona organiza y en los que participa, y las invitaciones pendientes asociadas a su email.
- **FR-004**: Quien organiza MUST poder elegir si participa del sorteo o solo organiza ("Yo también participo", tildado por defecto). Puede cambiarlo hasta el sorteo. Si no participa, no tiene página de participante, no recibe ni da regalo y, como todos, no ve asignaciones ajenas.

**Participantes e invitaciones**

- **FR-005**: La organizadora MUST poder agregar participantes de a uno (nombre y email opcional) o en lote (una línea por persona), mientras el grupo no esté sorteado.
- **FR-006**: Cada participante MUST tener un link de invitación personal, no adivinable, que vence a los 30 días y que la organizadora puede copiar, compartir por WhatsApp, regenerar o revocar.
- **FR-007**: Abrir un link válido MUST mostrar nombre del grupo, organizadora, presupuesto y fecha, y permitir sumarse después de entrar o crear cuenta, volviendo a la invitación.
- **FR-008**: Un link MUST poder usarse una sola vez; una cuenta MUST poder estar una sola vez en cada grupo.
- **FR-009**: La organizadora MUST ver el estado de cada participante (pendiente / sumado, y con qué email se sumó) y poder sacar participantes antes del sorteo.

**Sorteo**

- **FR-010**: El sorteo MUST estar disponible solo para la organizadora, con ≥ 3 participantes sumados y si el grupo no fue sorteado.
- **FR-011**: El sorteo MUST asignar a cada participante sumado exactamente una persona, distinta de sí misma, de modo que cada participante reciba exactamente un regalo y se respeten todas las exclusiones.
- **FR-012**: Si no existe asignación posible con las exclusiones, el sistema MUST NOT sortear y MUST explicar el motivo.
- **FR-013**: El sorteo MUST ser atómico: se completa entero o no ocurre, y MUST ocurrir una sola vez aunque se pida en paralelo.
- **FR-014**: Cada participante MUST poder ver solo su propia asignación. Ninguna persona (incluida la organizadora) MUST poder ver asignaciones ajenas por la interfaz, por URL ni accediendo a los datos directamente.
- **FR-015**: Las asignaciones MUST NOT aparecer en logs, mensajes de error, mails ni analytics.
- **FR-016**: Después del sorteo, el grupo MUST quedar cerrado para altas y bajas, salvo a través del reacomodo que hace quien organiza (FR-026 a FR-030).
- **FR-017**: Participantes pendientes al momento de sortear MUST quedar fuera del sorteo, previo aviso y confirmación de la organizadora.

**Listas de deseos**

- **FR-018**: Cada participante sumado MUST poder crear, editar y borrar ítems de su lista (texto de hasta 200 caracteres y link `http(s)` opcional), antes y después del sorteo.
- **FR-019**: Solo el propio participante y la persona que le regala (después del sorteo) MUST poder ver su lista.

**Exclusiones**

- **FR-020**: La organizadora MUST poder crear y quitar exclusiones entre participantes antes del sorteo; mutuas por defecto, con opción de que sean en un solo sentido.
- **FR-021**: Las exclusiones MUST ser visibles solo para la organizadora.

**Reacomodo después del sorteo**

- **FR-026**: Quien organiza MUST poder dar de baja a un participante de un grupo sorteado. El sistema MUST reasignar solo a quien le regalaba a esa persona, dándole el receptor de quien se va, siempre que el resultado cumpla FR-011 (nadie se regala a sí mismo y se respetan las exclusiones).
- **FR-027**: Si el arreglo mínimo no cumple FR-011, el sistema MUST ofrecer rehacer el sorteo completo y hacerlo solo con confirmación explícita.
- **FR-028**: Sumar un participante a un grupo sorteado MUST requerir rehacer el sorteo completo, con confirmación explícita, una vez que la persona nueva se haya sumado.
- **FR-029**: Al reacomodar, el sistema MUST avisar (en la app y por mail si hay email) solo a las personas cuya asignación cambió, sin revelarle a quien organiza quiénes son. Al rehacer todo, MUST avisar a todos.
- **FR-030**: Si después de una baja quedan menos de 3 participantes, el sorteo MUST anularse y el grupo MUST volver a "sin sortear", avisando a quienes quedan.

**Avisos**

- **FR-022**: Si el participante tiene email, el sistema MUST mandarle la invitación por mail al agregarlo (y al regenerar el link, si la organizadora lo pide).
- **FR-023**: Al completarse el sorteo, el sistema MUST mandar a cada participante un mail avisando que ya puede ver a quién le regala, sin revelar el nombre.
- **FR-024**: Todos los mails MUST estar en español y salir del dominio de la app.

**Lenguaje**

- **FR-025**: Los textos de la interfaz y de los mails MUST usar el español tradicional ("amigo invisible", "invitados", "el organizador"). El dominio `amigueinvisible.com.ar` solo redirige al principal.

### Key Entities

- **Persona usuaria**: quien tiene cuenta (definida en la 001). Puede organizar grupos y participar en varios.
- **Grupo**: un sorteo. Nombre, organizadora, si la organizadora participa, presupuesto, moneda, fecha y lugar del evento, notas, fecha del sorteo (vacía hasta que se hace) y fecha del último reacomodo.
- **Participante**: una persona dentro de un grupo. Nombre con el que la cargaron, email opcional, cuenta vinculada (vacía hasta que se suma), fecha en que se sumó.
- **Invitación**: link personal de un participante. Token no adivinable, vencimiento, uso, revocación.
- **Ítem de lista de deseos**: texto y link opcional, de un participante.
- **Exclusión**: "A no puede regalarle a B" dentro de un grupo (dirigida; las mutuas son dos exclusiones).
- **Asignación**: "A le regala a B", resultado del sorteo. Solo la ve A.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una organizadora crea un grupo de 8 personas y tiene los 8 links listos para compartir en menos de 3 minutos desde el celular.
- **SC-002**: Una persona invitada sin cuenta se suma a un grupo desde el link en menos de 2 minutos en el celular.
- **SC-003**: En pruebas automatizadas con 10.000 sorteos aleatorios (3 a 50 participantes, con y sin exclusiones), el 100 % cumple FR-011 o se reporta correctamente como imposible.
- **SC-004**: En pruebas automatizadas, ningún participante ni la organizadora logra leer una asignación ajena por ningún camino (interfaz, URL o acceso directo a los datos).
- **SC-005**: Un sorteo de 50 participantes con exclusiones se resuelve en menos de 3 segundos.
- **SC-006**: En la primera temporada, al menos el 90 % de los participantes invitados se suma antes de la fecha del sorteo.
- **SC-007**: En pruebas automatizadas de bajas sobre sorteos aleatorios, cuando el arreglo mínimo es posible cambia exactamente una asignación y el resultado sigue cumpliendo FR-011. Cuando no es posible, siempre se ofrece rehacer todo.

## Assumptions

- Invitaciones personales por link (como en DESIGN.md), pensadas para compartir por WhatsApp; el email es opcional.
- Máximo 50 participantes por grupo en v1.
- El presupuesto es informativo; no hay pagos ni cálculos.
- Se muestra la hora del evento en horario de Argentina.
- Los datos del grupo se conservan hasta que la organizadora lo borra; la limpieza automática queda fuera de v1.
- Con el arreglo mínimo, la persona reasignada puede deducir a quién le regalaba quien se bajó. Como esa persona ya no participa, se acepta.
- Fuera de alcance en v1: chat o preguntas anónimas entre quien regala y quien recibe, confirmar "regalo recibido", transferir la organización, varios sorteos por grupo, recordatorios automáticos.
- El proveedor de mails transaccionales se elige en el plan (ver research R9 de la feature 001).
