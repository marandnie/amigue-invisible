# Feature Specification: Mi perfil (cambiar el nombre)

**Feature Branch**: `005-mi-perfil`

**Created**: 2026-10-03

**Status**: Aprobada

**Input**: Marina se registró con el link por mail y la app le puso "mari.nieto" (la parte del mail antes de la @). Quiere poder cambiar su nombre.

**Depende de**: `001-plataforma-gcp-dominio` (perfil `users/{uid}` y sesión).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cambiar mi nombre (Priority: P1)

Una persona con sesión entra a "Mi perfil", ve su nombre y su mail, cambia el nombre y lo guarda. Desde ese momento la app la saluda con el nombre nuevo y lo usa en los grupos que arme o a los que se sume después.

**Why this priority**: es la única forma de corregir un nombre mal puesto (por ejemplo, el que se arma solo a partir del mail).

**Independent Test**: entrar, ir a "Mi perfil", cambiar el nombre, guardar y ver el saludo nuevo en "Mis grupos".

**Acceptance Scenarios**:

1. **Given** una persona con sesión, **When** abre "Mi perfil", **Then** ve su nombre actual (editable) y su mail (solo lectura).
2. **Given** que escribe un nombre válido, **When** guarda, **Then** ve "Listo, guardamos tu nombre" y "Mis grupos" la saluda con el nombre nuevo.
3. **Given** que deja el nombre vacío o pasa de 60 caracteres, **When** guarda, **Then** ve un error y no se cambia nada.
4. **Given** una persona sin sesión, **When** abre "Mi perfil", **Then** se le pide que ingrese y vuelve ahí.

### Edge Cases

- Grupos que ya existen: el nombre que figura en ellos **no cambia** (el organizador eligió cómo nombrar a cada participante y el sorteo no se toca). El nombre nuevo se usa en los grupos que la persona arme o a los que se sume de ahora en más.
- Espacios de sobra: se recortan al principio y al final.
- El mail no se puede cambiar desde acá.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE ofrecer una página "Mi perfil", accesible solo con sesión, desde la barra de navegación.
- **FR-002**: La persona DEBE poder cambiar su nombre para mostrar (1 a 60 caracteres, sin espacios al principio ni al final).
- **FR-003**: Cada persona solo puede cambiar su propio perfil.
- **FR-004**: El cambio NO DEBE modificar los nombres guardados en grupos existentes.
- **FR-005**: El mail se muestra pero no se puede editar.

### Key Entities

- **Perfil** (`users/{uid}`, de la 001): se actualiza `displayName`. No se agregan campos.

## Success Criteria *(mandatory)*

- **SC-001**: Cambiar el nombre lleva menos de 30 segundos desde "Mis grupos".
- **SC-002**: Costo adicional: USD 0.
