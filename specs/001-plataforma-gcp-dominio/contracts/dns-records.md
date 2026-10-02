# Contract: registros DNS

Proveedor: Cloudflare (plan free). **Todos los registros de esta tabla van en "DNS only" (nube gris).**

Los valores exactos (IP, `fah-claim`, destinos de `_acme-challenge` y de DKIM) los da la consola de Firebase en cada wizard. Acá queda qué registro va en cada zona y por qué. Después de configurarlos, completar la columna de valor real para tener el inventario.

## Delegación en NIC.ar

| Dominio | Nameservers |
|---|---|
| `amigoinvisible.com.ar` | `brianna.ns.cloudflare.com`, `tosana.ns.cloudflare.com` |
| `amigueinvisible.com.ar` | `brianna.ns.cloudflare.com`, `tosana.ns.cloudflare.com` |

## Zona `amigoinvisible.com.ar`

| Nombre | Tipo | Valor | Para qué | Valor real |
|---|---|---|---|---|
| `@` | A | IP de App Hosting (wizard) | servir la app | `35.219.200.196` |
| `@` | TXT | `fah-claim=<uuid>` | indicar a App Hosting qué dominio servir | `fah-claim=023-02-010d0a15-9d72-4b32-83ce-0a32dab29ff0` |
| `_acme-challenge…` | CNAME | destino de Certificate Manager (wizard) | emitir y renovar el certificado. **No borrar nunca** | `_acme-challenge_mwao6mfum7o2cik6` → `aeedaba9-5ca9-4827-82ec-f76b0ed9a972.1.authorize.certificatemanager.goog` |
| `www` | A | `35.219.200.196` | redirección a `amigoinvisible.com.ar` | `35.219.200.196` |
| `www` | TXT | `fah-claim=<uuid>` | reclamo de `www` | `fah-claim=023-02-433791a3-e35e-45b1-835a-38a992978b0f` |
| `_acme-challenge…www` | CNAME | según el wizard | certificado de `www` | el wizard no pidió uno aparte |
| `@` | TXT | `v=spf1 include:… ~all` (el que indique Firebase Auth) | remitente de los mails de Auth | |
| `firebase…._domainkey` (×2) | CNAME | según Firebase Auth | firma DKIM de los mails de Auth | |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:<responsable>` | política DMARC inicial | |

Reglas:

- No debe existir ningún AAAA ni otro A/CNAME en `@` o `www` que apunte a otro lado; si no, App Hosting no puede emitir el certificado.
- Un solo registro `v=spf1` por nombre. Si en la 002 se suma otro remitente en el dominio raíz, se combinan en el mismo registro.

## Zona `amigueinvisible.com.ar`

| Nombre | Tipo | Valor | Para qué | Valor real |
|---|---|---|---|---|
| `@` | A | IP de App Hosting (wizard) | redirección a `amigoinvisible.com.ar` | `35.219.200.204` |
| `@` | TXT | `fah-claim=<uuid>` | reclamo del dominio | `fah-claim=023-02-e0a26b61-4268-4024-98a0-e90aae989b27` |
| `_acme-challenge…` | CNAME | según el wizard | certificado (sirve para `@` y `www`) | `_acme-challenge_pd4gcad5464drgog` → `0e307ca3-a095-4386-8aff-956dae3befe7.11.authorize.certificatemanager.goog` |
| `www` | A | según el wizard | redirección | `35.219.200.204` |
| `www` | TXT | `fah-claim=<uuid>` | reclamo de `www` | `fah-claim=023-02-4b41fc76-be7b-4e77-bdee-a3b9d22cc0c9` |
| `_acme-challenge…www` | CNAME | según el wizard | certificado de `www` | el mismo CNAME de arriba |
| `@` | TXT | `v=spf1 -all` | este dominio nunca envía mail | ✔ cargado |
| `_dmarc` | TXT | `v=DMARC1; p=reject` | que nadie mande mails haciéndose pasar por el dominio | ✔ cargado |

## Resultado esperado de las redirecciones

| URL pedida | Termina en |
|---|---|
| `http(s)://amigoinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://www.amigoinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://amigueinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://www.amigueinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
