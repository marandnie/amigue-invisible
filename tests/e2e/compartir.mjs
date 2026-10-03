// E2E de "Compartir" y "Copiar mensaje" (research R11 de la 002), contra los emuladores y `next start`.
// En la compu: WhatsApp + Copiar mensaje. En el celular: Compartir (menú del sistema, simulado) + Copiar mensaje.
// Correr con: npm run test:e2e   (CHROMIUM_PATH=/ruta/a/chrome si Playwright no tiene su navegador)
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "test-results/e2e";
mkdirSync(SHOTS, { recursive: true });
const stamp = Date.now();
const log = (...a) => console.log("•", ...a);
const fail = (m) => { throw new Error(m); };
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

async function hostWithGroup(label, ctxOpts) {
  const ctx = await browser.newContext({ locale: "es-AR", ...ctxOpts });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`  [${label}] pageerror:`, e.message));
  await page.goto(`${BASE}/registro`);
  await page.fill('input[name="nombre"]', "Org " + label);
  await page.fill('input[name="email"]', `org-${label}-${stamp}@example.com`);
  await page.fill('input[name="password"]', "una-contrasena-larga");
  await page.click('button:has-text("Crear cuenta")');
  await page.waitForURL("**/mis-grupos");
  await page.click('a:has-text("Armar un grupo")');
  await page.waitForURL("**/grupos/nuevo");
  await page.fill('input[name="name"]', "Navidad & Año Nuevo");
  await page.fill('input[name="eventAt"]', "2026-12-24T21:00");
  await page.click('button:has-text("Crear grupo")');
  await page.waitForURL((u) => /\/grupos\/[A-Za-z0-9]+$/.test(u.pathname) && !u.pathname.endsWith("/nuevo"));
  await page.fill('input[name="nombre"]', "Tía Marta");
  await page.click('button:has-text("Agregar"):not(:has-text("todas"))');
  await page.waitForSelector("text=Tía Marta");
  return { ctx, page };
}
const expected = (url) => `¡Hola Tía Marta! Te sumo al amigo invisible "Navidad & Año Nuevo" 🎁 Entrá acá para sumarte: ${url}`;

// 1) Compu: WhatsApp + Copiar mensaje
const pc = await hostWithGroup("pc", { viewport: { width: 1280, height: 900 } });
await pc.page.waitForTimeout(500);
if (await pc.page.locator('button:has-text("Compartir")').count()) fail("en la compu no debería haber Compartir");
const wa = await pc.page.getAttribute('a[href^="https://wa.me/"]', "href");
const waMsg = decodeURIComponent(wa.split("text=")[1]);
const url = waMsg.match(/https?:\/\/\S+\/invitaciones\/[A-Za-z0-9_-]+$/)?.[0] ?? fail("WhatsApp sin link al final");
if (waMsg !== expected(url)) fail("mensaje de WhatsApp distinto: " + waMsg);
await pc.page.click('button:has-text("Copiar mensaje")');
await pc.page.waitForSelector('button:has-text("¡Copiado!")');
const clip = await pc.page.evaluate(() => navigator.clipboard.readText());
if (clip !== waMsg) fail("el portapapeles no tiene el mensaje completo: " + clip);
await pc.page.screenshot({ path: `${SHOTS}/09-compartir-compu.png`, clip: { x: 0, y: 0, width: 1280, height: 900 } });
log("compu: WhatsApp + Copiar mensaje (mensaje completo) OK");

// 2) Celular: Compartir (menú del sistema simulado) + Copiar mensaje
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const cel = await hostWithGroup("cel", phone);
await cel.ctx.addInitScript(() => {
  window.__shared = [];
  window.__shareMode = "ok";
  navigator.share = async (data) => {
    window.__shared.push(data);
    if (window.__shareMode === "abort") throw new DOMException("cancelado", "AbortError");
    if (window.__shareMode === "error") throw new DOMException("no", "NotAllowedError");
  };
});
await cel.page.reload();
await cel.page.waitForSelector('button:has-text("Compartir")');
if (await cel.page.locator('a[href^="https://wa.me/"]').count()) fail("en el celular no debería quedar el botón de WhatsApp");
await cel.page.click('button:has-text("Compartir")');
const shared = await cel.page.evaluate(() => window.__shared);
if (shared.length !== 1 || Object.keys(shared[0]).join() !== "text") fail("share() debería recibir solo text: " + JSON.stringify(shared));
const celUrl = shared[0].text.match(/https?:\/\/\S+\/invitaciones\/[A-Za-z0-9_-]+$/)?.[0] ?? fail("share sin link");
if (shared[0].text !== expected(celUrl)) fail("texto compartido distinto: " + shared[0].text);
log("celular: Compartir manda el mensaje completo OK");

await cel.page.evaluate(() => { window.__shareMode = "abort"; navigator.clipboard.writeText("vacío"); });
await cel.page.click('button:has-text("Compartir")');
await cel.page.waitForTimeout(300);
if ((await cel.page.evaluate(() => navigator.clipboard.readText())) !== "vacío") fail("cancelar no debería copiar");
if (!(await cel.page.locator('button:has-text("Compartir")').count())) fail("cancelar cambió el botón");
log("celular: cancelar el menú no hace nada OK");

await cel.page.evaluate(() => { window.__shareMode = "error"; });
await cel.page.click('button:has-text("Compartir")');
await cel.page.waitForSelector('button:has-text("¡Copiado!")');
if ((await cel.page.evaluate(() => navigator.clipboard.readText())) !== shared[0].text) fail("si share falla debería copiar");
log("celular: si el menú falla, copia el mensaje OK");

await cel.page.waitForTimeout(2200);
await cel.page.screenshot({ path: `${SHOTS}/10-compartir-celular.png`, fullPage: false });
await browser.close();
console.log("\nCOMPARTIR OK");
