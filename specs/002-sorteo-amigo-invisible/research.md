# Research: Sorteo de amigo invisible

**Feature**: [spec.md](./spec.md) · **Fecha**: 2026-10-02

Formato: Decisión / Por qué / Alternativas descartadas.

## R1. Algoritmo de sorteo

- **Decisión**: se modela como un *perfect matching* bipartito: quienes regalan de un lado y quienes reciben del otro, con aristas permitidas (nadie consigo mismo ni con sus exclusiones). En dos pasos:
  1. **Muestreo por rechazo**: se baraja una permutación al azar (Fisher-Yates con `crypto.randomInt`) y se acepta si cumple todas las restricciones. Se prueba hasta 2.000 veces. Con pocas exclusiones, una permutación al azar es válida con probabilidad ≈ 1/e, así que casi siempre resuelve en 2 o 3 intentos y el resultado es **uniforme** entre todas las asignaciones válidas.
  2. **Respaldo con matching (Kuhn)** si el rechazo no encontró nada: se recorren nodos y aristas en orden aleatorio. Si no existe matching perfecto, el sorteo es **imposible** y se informa (FR-012). Este paso no garantiza uniformidad, pero solo se usa con muchas exclusiones.
- **Por qué**: correcto siempre (encuentra solución si existe y detecta la imposibilidad), justo en el caso común, O(n·m) en el peor caso. Con 50 personas son microsegundos.
- **Alternativas descartadas**: backtracking exhaustivo (exponencial en el peor caso); ciclo hamiltoniano único (DESIGN.md lo menciona, pero no es un requisito y complica la imposibilidad).
- **Testeo** (constitución VI, SC-003): 10.000 sorteos aleatorios de 3 a 50 personas con exclusiones aleatorias. Cada resultado se valida; los "imposibles" se confirman por fuerza bruta (n ≤ 8) o con un matching independiente.

## R2. Arreglo mínimo ante una baja (US7)

- **Decisión**: función pura `removeWithMinimalChange(asignaciones, x, exclusiones)`. Si `g → x` y `x → r`, el resultado es `g → r`, salvo que `g = r` (par recíproco) o que `g` tenga excluido a `r`: en esos casos devuelve "hay que rehacer". El algoritmo y sus tests entran en esta iteración; la pantalla de reacomodo queda para la siguiente (P3).

## R3. Invitaciones

- **Decisión**: un documento `invitations/{token}` por participante pendiente. El token son 32 bytes aleatorios en base64url (256 bits) y vence a los 30 días. El participante guarda su token vigente para que el organizador pueda volver a copiar el link. Al aceptar, en una transacción: se valida el token, se vincula la cuenta, se borra la invitación (un solo uso) y se limpia el token del participante.
- **Por qué**: búsqueda directa por id, sin consultas. El token en claro es aceptable: solo lo lee el servidor, solo se muestra al organizador y lo único que permite es ocupar un lugar pendiente de un grupo.
- **Alternativa descartada**: guardar solo el hash del token. Obligaría a regenerar el link cada vez que el organizador lo quiere copiar.
- **Sumarse por email**: "Mis grupos" muestra los lugares pendientes cuyo email coincide con el de la cuenta, y permite sumarse **solo si el email está verificado**. Así no hace falta el link si el organizador cargó el email.

## R4. Modelo en Firestore

- **Decisión**: `groups/{id}` con subcolecciones `participants`, `participants/{pid}/wishes` y `assignments` (id = participante que regala). Las exclusiones van como array en el grupo (≤ 50 personas). "Mis grupos" usa dos consultas: grupos con `hostUid == uid` y un *collection group* sobre `participants` con `uid == uid`. Además, otra por `email` para las invitaciones pendientes. Las dos consultas de grupo de colecciones necesitan índices de campo (`fieldOverrides`) en `firestore.indexes.json`.
- **Por qué**: lecturas directas por id para las páginas sensibles (la asignación propia es `assignments/{miParticipanteId}`), sin índices compuestos.
- **Reglas**: siguen en deny-all (feature 001). Todo pasa por la capa de datos del servidor (`lib/data/*`), que aplica la autorización por rol: organizador / participante sumado / nadie.

## R5. Pendientes al sortear

- **Decisión**: si al sortear hay participantes sin sumarse, el organizador tiene que confirmar. Esos lugares se **eliminan** del grupo en la misma transacción del sorteo, junto con sus invitaciones (FR-017). Después del sorteo no se puede sumar a nadie sin rehacerlo (US7, más adelante).

## R6. Mutaciones y validación

- **Decisión**: Server Actions de Next.js con validación `zod` y redirección o `revalidatePath` al terminar. Cada acción llama a `requireUser()` y a la capa de datos, que vuelve a chequear el rol. Errores de negocio: `DomainError` con mensaje en español que la acción devuelve al formulario.
- **Por qué**: menos JavaScript en el cliente (constitución VII) y un único lugar con reglas de autorización.

## R7. Avisos por mail (US6)

- **Decisión**: **diferido**. Las invitaciones salen por link (WhatsApp o copiar) y el sorteo se ve en la app. El proveedor transaccional se decide en la próxima iteración (candidato Resend; ver research R9 de la 001). En esta iteración, ningún flujo depende del mail.

## R8. Formatos y zona horaria

- **Decisión**: `Intl.NumberFormat("es-AR")` para montos (ARS por defecto) e `Intl.DateTimeFormat("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })` para fechas. El `datetime-local` del formulario se interpreta como hora de Buenos Aires (UTC−3, sin horario de verano).

## R9. Revelación

- **Decisión**: en "Mi página", después del sorteo, aparece una tarjeta "Tocá para descubrir a quién le regalás". Al tocarla se muestra el nombre con un poco de confeti hecho con CSS, sin librerías. El nombre ya viene en el HTML de esa persona: es su propio dato, así que no hay fuga.

## R10. Costo (constitución III)

Una página típica hace de 2 a 6 lecturas de Firestore. Un sorteo de 50 personas son unas 110 escrituras. Con decenas de grupos por temporada sigue muy dentro de la cuota gratuita (50k lecturas/día, 20k escrituras/día). Costo incremental ≈ USD 0.
