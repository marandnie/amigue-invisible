# Quickstart: Sorteo de amigo invisible

## Local

```bash
npm run emulators            # terminal 1
npm run dev                  # terminal 2
npm test                     # algoritmo de sorteo (incluye 10.000 sorteos aleatorios)
npm run test:integration     # capa de datos contra los emuladores (privacidad, sorteo único, invitaciones)
npm run build && npm start   # y en otra terminal:
npm run test:e2e             # flujo completo en un navegador real con 4 cuentas
```

## Validación manual (producción o local)

Usá 3 cuentas (por ejemplo, tu Google, un email con contraseña y otro con link por mail) y, si podés, dos navegadores o una ventana privada.

### US1 – Grupo e invitaciones
- [ ] Crear "Prueba" con presupuesto 15000 ARS y fecha → quedás como organizador y ves la página del grupo.
- [ ] Agregar "Ana" y, en lote, "Bruno, bruno@…" y "Caro" → aparecen como pendientes con botón de copiar link y de WhatsApp.
- [ ] Pegar en lote un nombre repetido → aviso de repetido, no se crea.
- [ ] Regenerar el link de Caro → el link viejo deja de funcionar.
- [ ] Crear un grupo con "Yo también participo" destildado → no aparecés en la lista de participantes.

### US2 – Sumarse
- [ ] Abrir el link de Ana sin sesión en el celular → ves el grupo → creás cuenta → volvés y tocás "Me sumo" → quedás en "Mi página".
- [ ] Abrir el mismo link otra vez → "este link ya se usó".
- [ ] Bruno entra con la cuenta de `bruno@…` (verificada) → en "Mis grupos" ve la invitación y se suma sin link.

### US3 – Sorteo
- [ ] Con 2 sumados, el botón de sortear no está y explica por qué.
- [ ] Con ≥ 3 sumados y un pendiente → pide confirmar → sortea; el pendiente desaparece.
- [ ] Cada cuenta ve en "Mi página" una sola persona, distinta de sí misma.
- [ ] El organizador que no participa no ve ninguna asignación.
- [ ] Después del sorteo no se pueden agregar ni sacar participantes.

### US4 – Deseos
- [ ] Cargar 2 ítems (uno con link de Mercado Libre) → quien te regala los ve.
- [ ] Un link `javascript:` → rechazado.

### US6 – Mails
- [ ] Agregar a alguien con email → le llega la invitación (remitente `no-responder@avisos.amigoinvisible.com.ar`) y el organizador ve "✉ Invitación enviada por mail".
- [ ] "Reenviar mail" → llega de nuevo, con el mismo link.
- [ ] Hacer el sorteo → a cada participante le llega "Ya se hizo el sorteo" **sin** el nombre de a quién le regala.
- [ ] Responder la invitación → la respuesta le llega al organizador.

### US5 – Exclusiones
- [ ] Excluir a A y B (mutua) → sortear varias veces en grupos de prueba → nunca A↔B.
- [ ] Con 3 personas, excluir todos los pares → aviso de que es imposible; el sorteo no se hace.
