# Feature Specification: Avisos de registro para la administradora

**Feature Branch**: `004-avisos-de-registro`

**Created**: 2026-10-03

**Status**: Aprobada

**Input**: Marina quiere saber quién se registra en la web: un mail en el momento de cada alta y un reporte semanal con los registrados. Google Analytics queda afuera por ahora.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aviso inmediato de cada alta (Priority: P1)

Cada vez que una persona nueva entra por primera vez a la web (con mail y contraseña, link por mail o Google), la administradora recibe un mail con su nombre, su mail, el método de ingreso, la fecha y hora del alta y cuántas personas hay registradas en total.

**Why this priority**: es lo que permite enterarse "al toque" de que la gente está usando la app.

**Independent Test**: crear una cuenta nueva en el entorno local y ver el mail (simulado en consola) dirigido a la administradora. Volver a ingresar con la misma cuenta y comprobar que no llega otro aviso.

**Acceptance Scenarios**:

1. **Given** una persona que nunca entró, **When** ingresa por primera vez, **Then** la administradora recibe un único aviso con nombre, mail, método y fecha.
2. **Given** una persona ya registrada, **When** vuelve a ingresar, **Then** no se manda ningún aviso.
3. **Given** que el envío del aviso falla, **When** la persona ingresa, **Then** el ingreso funciona igual.

---

### User Story 2 - Reporte semanal (Priority: P2)

Una vez por semana (lunes a la mañana, hora de Argentina) la administradora recibe un resumen con: las altas de los últimos 7 días (nombre, mail, fecha de alta, último ingreso, método), cuántas personas ingresaron en esos 7 días y el total de registrados.

**Why this priority**: da la foto de la semana aunque se hayan perdido avisos sueltos.

**Independent Test**: llamar al endpoint del reporte con una credencial válida en local y ver el mail simulado; llamarlo sin credencial y recibir 401.

**Acceptance Scenarios**:

1. **Given** altas en la última semana, **When** corre el reporte, **Then** el mail las lista de la más nueva a la más vieja.
2. **Given** ninguna alta en la semana, **When** corre el reporte, **Then** el mail lo dice y muestra igual los totales.
3. **Given** un pedido sin la credencial del programador de tareas, **When** llega al endpoint, **Then** se rechaza sin mandar nada.

### Edge Cases

- Dos ingresos simultáneos de la misma persona nueva: un solo aviso (el alta es transaccional).
- Sin dirección de administradora configurada: no se manda nada y la app funciona igual.
- Más de 50 altas en la semana: se listan las 50 más nuevas y se indica cuántas faltan.
- Nombres con HTML o saltos de línea: se escapan; el asunto no admite saltos de línea.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al crearse el perfil de una persona (primer ingreso), el sistema DEBE mandar un aviso por mail a la dirección de la administradora.
- **FR-002**: El aviso DEBE incluir nombre, mail, método de ingreso, fecha y hora del alta (es-AR) y el total de registrados.
- **FR-003**: Un ingreso de una persona ya registrada NO DEBE generar aviso.
- **FR-004**: Una falla del aviso NO DEBE impedir el ingreso.
- **FR-005**: El sistema DEBE mandar un reporte semanal con las altas de los últimos 7 días, la cantidad de personas que ingresaron en ese período y el total de registrados.
- **FR-006**: El reporte solo se dispara desde el programador de tareas autorizado; cualquier otro pedido se rechaza.
- **FR-007**: Los avisos y el reporte van únicamente a la administradora y NUNCA incluyen datos de grupos, sorteos ni asignaciones (constitución I).
- **FR-008**: Los logs no incluyen direcciones de mail ni nombres; solo cantidades y resultados.

### Key Entities

- **Perfil** (`users/{uid}`, ya existe en la 001): se usan `displayName`, `email`, `providers`, `createdAt`, `lastLoginAt`. No se agregan campos.

## Success Criteria *(mandatory)*

- **SC-001**: El aviso llega en menos de 1 minuto desde el primer ingreso.
- **SC-002**: El reporte llega todos los lunes sin intervención manual.
- **SC-003**: Costo mensual adicional: USD 0.
