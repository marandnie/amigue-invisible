# Contract: registros DNS

Proveedor: Cloudflare (plan free). **Todos los registros de esta tabla van en "DNS only" (nube gris).**

Los valores exactos (IP, `fah-claim`, destinos de `_acme-challenge` y de DKIM) los da la consola de Firebase en cada wizard. Acá queda qué registro va en cada zona y por qué. Después de configurarlos, completar la columna de valor real para tener el inventario.

## Delegación en NIC.ar

| Dominio | Nameservers |
|---|---|
| `amigoinvisible.com.ar` | los 2 `*.ns.cloudflare.com` asignados a la zona |
| `amigueinvisible.com.ar` | los 2 `*.ns.cloudflare.com` asignados a la zona |

## Zona `amigoinvisible.com.ar`

| Nombre | Tipo | Valor | Para qué | Valor real |
|---|---|---|---|---|
| `@` | A | IP de App Hosting (wizard) | servir la app | |
| `@` | TXT | `fah-claim=<uuid>` | indicar a App Hosting qué dominio servir | |
| `_acme-challenge…` | CNAME | destino de Certificate Manager (wizard) | emitir y renovar el certificado. **No borrar nunca** | |
| `www` | A o CNAME (wizard) | según el wizard | redirección a `amigoinvisible.com.ar` | |
| `_acme-challenge…www` | CNAME | según el wizard | certificado de `www` | |
| `@` | TXT | `v=spf1 include:… ~all` (el que indique Firebase Auth) | remitente de los mails de Auth | |
| `firebase…._domainkey` (×2) | CNAME | según Firebase Auth | firma DKIM de los mails de Auth | |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:<responsable>` | política DMARC inicial | |

Reglas:

- No debe existir ningún AAAA ni otro A/CNAME en `@` o `www` que apunte a otro lado; si no, App Hosting no puede emitir el certificado.
- Un solo registro `v=spf1` por nombre. Si en la 002 se suma otro remitente en el dominio raíz, se combinan en el mismo registro.

## Zona `amigueinvisible.com.ar`

| Nombre | Tipo | Valor | Para qué | Valor real |
|---|---|---|---|---|
| `@` | A | IP de App Hosting (wizard) | redirección a `amigoinvisible.com.ar` | |
| `@` | TXT | `fah-claim=<uuid>` | reclamo del dominio | |
| `_acme-challenge…` | CNAME | según el wizard | certificado | |
| `www` | A o CNAME | según el wizard | redirección | |
| `_acme-challenge…www` | CNAME | según el wizard | certificado de `www` | |
| `@` | TXT | `v=spf1 -all` | este dominio nunca envía mail | |
| `_dmarc` | TXT | `v=DMARC1; p=reject` | que nadie mande mails haciéndose pasar por el dominio | |

## Resultado esperado de las redirecciones

| URL pedida | Termina en |
|---|---|
| `http(s)://amigoinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://www.amigoinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://amigueinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
| `http(s)://www.amigueinvisible.com.ar/x?y=1` | `https://amigoinvisible.com.ar/x?y=1` |
