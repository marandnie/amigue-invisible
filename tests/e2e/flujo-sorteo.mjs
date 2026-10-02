// E2E de la feature 002 en un navegador real, contra los emuladores y `next start`.
// Requisitos: `npm run emulators` y `npm run build && npm start` corriendo (con .env.local de .env.example).
// Correr con: npm run test:e2e   (CHROMIUM_PATH=/ruta/a/chrome si Playwright no tiene su navegador)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "test-results/e2e";
mkdirSync(SHOTS, { recursive: true });
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const fail = (m) => {
  throw new Error(m);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "es-AR" };

async function newUser(name) {
  const ctx = await browser.newContext(mobile);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`  [${name}] pageerror:`, e.message));
  return { ctx, page, name, email: `${name.toLowerCase()}-${stamp}@example.com` };
}

async function register(u, startUrl) {
  const { page } = u;
  await page.goto(startUrl);
  await page.fill('input[name="nombre"]', u.name);
  await page.fill('input[name="email"]', u.email);
  await page.fill('input[name="password"]', "una-contrasena-larga");
  await page.click('button:has-text("Crear cuenta")');
}

// 1) Organizadora se registra y arma el grupo
const host = await newUser("Marina");
await register(host, `${BASE}/registro`);
await host.page.waitForURL("**/mis-grupos");
log("registro OK →", host.page.url());
await host.page.screenshot({ path: `${SHOTS}/01-mis-grupos-vacio.png`, fullPage: true });

await host.page.click('a:has-text("Armar un grupo")');
await host.page.waitForURL("**/grupos/nuevo");
await host.page.fill('input[name="name"]', "Navidad familia");
await host.page.fill('input[name="budget"]', "15.000");
await host.page.fill('input[name="eventAt"]', "2026-12-24T21:00");
await host.page.fill('input[name="location"]', "Casa de la abuela");
await host.page.fill('textarea[name="notes"]', "Nada de medias 🧦");
await host.page.screenshot({ path: `${SHOTS}/02-nuevo-grupo.png`, fullPage: true });
await host.page.click('button:has-text("Crear grupo")');
await host.page.waitForURL((u) => /\/grupos\/[A-Za-z0-9]+$/.test(u.pathname) && !u.pathname.endsWith("/nuevo"));
const groupUrl = host.page.url();
log("grupo creado →", groupUrl);

// 2) Agrega participantes en lote
await host.page.click("summary:has-text('Agregar varias personas')");
await host.page.fill('textarea[name="lineas"]', "Bruno\nCaro\nDani\nEli");
await host.page.click('button:has-text("Agregar todas")');
await host.page.waitForSelector("text=Agregaste 4 personas.");
// Repetido → error
await host.page.fill('input[name="nombre"]', "bruno");
await host.page.click('button:has-text("Agregar"):not(:has-text("todas"))');
await host.page.waitForSelector("text=/repetidos/");
log("repetido rechazado OK");
await host.page.screenshot({ path: `${SHOTS}/03-grupo-organizador.png`, fullPage: true });

// Links de invitación (desde los botones de WhatsApp)
async function inviteLinks() {
  const hrefs = await host.page.$$eval('a[href^="https://wa.me/"]', (as) => as.map((a) => a.href));
  return hrefs.map((h) => decodeURIComponent(h.split("text=")[1]).match(/https?:\/\/\S+\/invitaciones\/[A-Za-z0-9_-]+/)[0]);
}
let links = await inviteLinks();
if (links.length !== 4) fail(`esperaba 4 links, hay ${links.length}`);
log("links:", links.length);

// 3) Bruno, Caro y Dani se suman con sus links (Eli queda pendiente)
const people = [];
for (const [i, name] of ["Bruno", "Caro", "Dani"].entries()) {
  const u = await newUser(name);
  await u.page.goto(links[i]);
  if (i === 0) await u.page.screenshot({ path: `${SHOTS}/04-invitacion-sin-sesion.png`, fullPage: true });
  await u.page.click('main a:has-text("Crear cuenta")');
  await u.page.waitForURL("**/registro?next=*");
  await u.page.fill('input[name="nombre"]', u.name);
  await u.page.fill('input[name="email"]', u.email);
  await u.page.fill('input[name="password"]', "una-contrasena-larga");
  await u.page.click('button:has-text("Crear cuenta")');
  await u.page.waitForURL("**/invitaciones/**");
  await u.page.click('button:has-text("Me sumo")');
  await u.page.waitForURL("**/yo");
  log(`${name} se sumó →`, u.page.url());
  people.push(u);
}

// Link usado → no funciona
const reuse = await newUser("Reuso");
await reuse.page.goto(links[0]);
await reuse.page.waitForSelector("text=Este link no funciona");
log("link de un solo uso OK");

// 4) Caro carga un deseo con link; un link javascript: se rechaza
const caro = people[1];
const addWish = (pg) => pg.locator('form:has(input[placeholder^="Qué te gustaría"])');
await addWish(caro.page).locator('input[name="text"]').fill("Un libro de cocina");
await addWish(caro.page).locator('input[name="url"]').fill("mercadolibre.com.ar/libro-cocina");
await addWish(caro.page).locator('button:has-text("Agregar")').click();
await caro.page.waitForSelector("text=https://mercadolibre.com.ar/libro-cocina");
await addWish(caro.page).locator('input[name="text"]').fill("Algo raro");
await addWish(caro.page).locator('input[name="url"]').fill("javascript:alert(1)");
await addWish(caro.page).locator('button:has-text("Agregar")').click();
await caro.page.waitForSelector("text=/Solo se aceptan links|no es válido/");
await caro.page.screenshot({ path: `${SHOTS}/04b-mi-pagina-antes.png`, fullPage: true });
log("deseos OK (javascript: rechazado)");

// 5) Exclusión mutua Bruno ↔ Caro
await host.page.goto(`${groupUrl}/exclusiones`);
const opts = await host.page.$$eval('select[name="from"] option', (os) => os.map((o) => ({ v: o.value, t: o.textContent })));
const id = (n) => opts.find((o) => o.t === n).v;
await host.page.selectOption('select[name="from"]', id("Bruno"));
await host.page.selectOption('select[name="to"]', id("Caro"));
await host.page.click('button:has-text("Agregar exclusión")');
await host.page.waitForSelector("text=Bruno ↔ Caro");
await host.page.screenshot({ path: `${SHOTS}/05-exclusiones.png`, fullPage: true });
log("exclusión OK");

// 6) Sorteo (Eli pendiente → hay que confirmar)
await host.page.goto(groupUrl);
await host.page.click('button:has-text("Hacer el sorteo")'); // sin tildar: el navegador no deja (required)
if (!host.page.url().endsWith(groupUrl.split("/").pop())) fail("no debería haber navegado");
await host.page.check('input[name="confirmar"]');
await host.page.click('button:has-text("Hacer el sorteo")');
await host.page.waitForSelector("text=/Ya se hizo el sorteo/");
await host.page.screenshot({ path: `${SHOTS}/06-sorteado-organizador.png`, fullPage: true });
const hostText = await host.page.locator("main").innerText();
if (/\bEli\b/.test(hostText)) fail("Eli (pendiente) debería haber quedado afuera");
log("sorteo OK");

// 7) Cada uno descubre a quién le regala
const everyone = [host, ...people];
const result = {};
for (const u of everyone) {
  await u.page.goto(`${groupUrl}/yo`);
  await u.page.click('button:has-text("Tocá para descubrir")');
  await u.page.waitForSelector("text=Te tocó regalarle a");
  const name = (await u.page.locator("text=Te tocó regalarle a >> xpath=following-sibling::p[1]").textContent()).trim();
  result[u.name] = name;
  if (u.name === "Bruno") await u.page.screenshot({ path: `${SHOTS}/07-revelacion.png`, fullPage: true });
}
log("asignaciones:", JSON.stringify(result));
for (const [giver, receiver] of Object.entries(result)) {
  if (giver === receiver) fail(`${giver} se regala a sí mismo`);
}
if (new Set(Object.values(result)).size !== everyone.length) fail("alguien recibe dos veces");
if (result.Bruno === "Caro" || result.Caro === "Bruno") fail("exclusión rota");

// Quien le regala a Caro ve su deseo
const giverOfCaro = everyone.find((u) => result[u.name] === "Caro");
await giverOfCaro.page.goto(`${groupUrl}/yo`);
await giverOfCaro.page.waitForSelector("text=Un libro de cocina");
log(`${giverOfCaro.name} ve el deseo de Caro OK`);

// 8) Privacidad: el HTML del organizador y de otros no contiene otras asignaciones
await host.page.goto(groupUrl);
const html = await host.page.content();
if (/Te tocó regalarle/.test(html)) fail("la página del grupo muestra asignaciones");
const someone = people[2];
await someone.page.goto(`${groupUrl}/yo`);
const theirHtml = await someone.page.content();
if ((theirHtml.match(/Te tocó regalarle a/g) || []).length > 1) fail("más de una revelación");

// Un desconocido no puede ver el grupo
const intruso = await newUser("Intruso");
await register(intruso, `${BASE}/registro`);
await intruso.page.waitForURL("**/mis-grupos");
const resp = await intruso.page.goto(groupUrl);
if (resp.status() !== 404) fail(`un desconocido ve el grupo (status ${resp.status()})`);
const resp2 = await intruso.page.goto(`${groupUrl}/yo`);
if (resp2.status() !== 404) fail("un desconocido ve /yo");
log("desconocido → 404 OK");

// 9) Mis grupos de un participante
await people[0].page.goto(`${BASE}/mis-grupos`);
await people[0].page.waitForSelector("text=Participás");
await people[0].page.screenshot({ path: `${SHOTS}/08-mis-grupos-participante.png`, fullPage: true });

await browser.close();
console.log("\nE2E OK");
