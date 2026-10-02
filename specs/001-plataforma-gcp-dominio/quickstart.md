# Quickstart: Plataforma en producción con dominio propio

Runbook para dejar la app en `amigoinvisible.com.ar` y checklist de validación de la spec. Los pasos con 🖐️ requieren a la responsable (Clave Fiscal, consola web o facturación).

## 0. Requisitos

- Node.js 22, `firebase-tools` actualizado (`npm i -g firebase-tools`), cuenta de GitHub.
- Acceso a nic.ar con Clave Fiscal (nivel 2 o más) 🖐️.
- Cuenta de Cloudflare 🖐️.

## 1. Desarrollo local

```bash
cp .env.example .env.local        # NEXT_PUBLIC_USE_EMULATORS=true
npm install
firebase emulators:start --only auth,firestore   # terminal 1
npm run dev                                      # terminal 2 → http://localhost:3000
npm run test:rules                               # tests de reglas contra el emulador
```

## 2. Proyecto de Firebase 🖐️

1. Crear el proyecto `amigo-invisible` en la consola de Firebase y pasarlo a **Blaze**.
2. Presupuesto de **USD 5/mes** con alertas al 50/90/100 % a tu mail (Google Cloud → Facturación → Presupuestos y alertas).
3. Crear Firestore: edición Standard, modo nativo, ubicación **`us-east4`** (irreversible, ver research R2).
4. `firebase use amigo-invisible && firebase deploy --only firestore:rules,firestore:indexes`.
5. Authentication → habilitar Email/Contraseña (con *Email link*) y Google; política de contraseña mín. 10; plantillas en español.

## 3. DNS: Cloudflare + NIC.ar 🖐️

1. En Cloudflare, *Add a site* → `amigoinvisible.com.ar` (plan Free). Repetir con `amigueinvisible.com.ar`. Anotar los 2 nameservers de cada zona.
2. En nic.ar → *Mis dominios* → cada dominio → delegaciones → cargar los 2 nameservers de Cloudflare → confirmar.
3. Verificar (puede tardar desde minutos hasta algunas horas):

```bash
dig +short NS amigoinvisible.com.ar     # → *.ns.cloudflare.com
dig +short NS amigueinvisible.com.ar
```

4. Cloudflare marca las zonas como **Active**.

## 4. Backend de App Hosting

```bash
firebase apphosting:backends:create --project amigo-invisible
# región: us-east4 · repo: GitHub <usuario>/amigo-invisible · rama: main · rollouts automáticos: sí
```

Esperar el primer rollout y abrir la URL `https://<backend>--amigo-invisible.us-east4.hosted.app`.

## 5. Dominios en App Hosting 🖐️

Consola de Firebase → App Hosting → backend → *Settings* → *Domains* → *Add custom domain*:

| Dominio | Opción de redirección |
|---|---|
| `amigoinvisible.com.ar` | — (principal) |
| `www.amigoinvisible.com.ar` | redirigir a `amigoinvisible.com.ar` |
| `amigueinvisible.com.ar` | redirigir a `amigoinvisible.com.ar` |
| `www.amigueinvisible.com.ar` | redirigir a `amigoinvisible.com.ar` |

Para cada uno, copiar los registros que muestra el wizard a la zona correspondiente de Cloudflare en **DNS only** y completar la columna "Valor real" de [contracts/dns-records.md](./contracts/dns-records.md). Esperar a que el estado pase a *Connected* (el certificado puede tardar hasta 24 h).

## 6. Mails de Auth con dominio propio 🖐️

Authentication → Templates → editar → *Customize domain* → `amigoinvisible.com.ar`. Cargar en Cloudflare los TXT/CNAME que indique y el DMARC. Cuando diga "Verification complete", *Apply custom domain*. Agregar `amigoinvisible.com.ar` en *Authorized domains*.

## 7. Validación (checklist de la spec)

### US1 – Dominio principal

- [ ] `https://amigoinvisible.com.ar` muestra la landing en español con candado, desde un celular con 4G y desde una compu.
- [ ] `http://amigoinvisible.com.ar` termina en `https://`.
- [ ] `https://amigoinvisible.com.ar/no-existe` muestra el 404 en español.
- [ ] Pegar el link en WhatsApp muestra la vista previa con título y descripción.

### US2 – Redirecciones

```bash
./scripts/check-domains.sh
# Para cada una de las 8 URLs (4 hosts × http/https, con /prueba?x=1)
# imprime: código de estado, cantidad de saltos y URL final.
# Tiene que terminar en https://amigoinvisible.com.ar/prueba?x=1 con ≤ 2 saltos.
```

- [ ] Las 8 URLs pasan. Si alguna pierde la ruta, aplicar el plan B de research R7.

### US3 – Cuentas

- [ ] Registro con email y contraseña → llega el mail de verificación (en español, remitente `@amigoinvisible.com.ar`, en la bandeja de entrada) → entra a `/mis-grupos`.
- [ ] Link por mail en el mismo dispositivo → entra. En otro navegador → pide confirmar el email → entra.
- [ ] Google en Chrome Android y Safari iOS → entra.
- [ ] Abrir `/mis-grupos` sin sesión → `/ingresar?next=/mis-grupos` → después de entrar, vuelve a `/mis-grupos`.
- [ ] Cerrar sesión → `/mis-grupos` vuelve a pedir login.
- [ ] Registrarse con email+contraseña usando un email que ya entró con Google → no se crea una cuenta duplicada y el mensaje explica cómo entrar.
- [ ] Contraseña de 9 caracteres → error claro.

### US4 – Deploy

- [ ] Cambiar un texto de la landing, mergear a `main` → visible en < 10 min.
- [ ] Mergear un cambio que no compila → el rollout falla y el sitio sigue con la versión anterior.
- [ ] Volver a un rollout anterior desde la consola → funciona sin rebuild.

### US5 – Costo

- [ ] El presupuesto existe, con alertas al 50/90/100 %.
- [ ] `maxInstances: 3` aplicado (consola de Cloud Run del backend).
- [ ] Después de unas horas sin tráfico, el servicio tiene 0 instancias.
- [ ] Recordatorio en el calendario: renovar los dominios antes del 17/04/2027.
