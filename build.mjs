/**
 * build.mjs — genera index.html a partir del archivo editable del sitio.
 *
 * El editor visual trabaja sobre "Run and Bike HN - Mixto.dc.html". Ese archivo
 * no trae los metadatos que necesita producción (SEO, Open Graph, favicon,
 * pantalla de carga). Este script toma la fuente, le injerta el <head> de
 * producción y escribe index.html, que es lo que Vercel publica.
 *
 * Uso:  node build.mjs
 *
 * Cada vez que se edite el .dc.html en el editor visual, hay que volver a
 * correr esto para que el sitio publicado refleje los cambios.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));

const SOURCE = 'Run and Bike HN - Mixto.dc.html';
const OUTPUT = 'index.html';

/* Cambiar por el dominio propio cuando esté conectado (ej. https://runandbikehn.com).
   Sin barra final. */
const SITE_URL = 'https://runandbike.vercel.app';

const TITLE = 'Run &amp; Bike HN — Eventos de running y ciclismo en Honduras';
const DESCRIPTION =
  'Run &amp; Bike HN organiza eventos de running y ciclismo en Honduras. Dos disciplinas, una misma pasión.';
const SOCIAL_DESCRIPTION =
  'Dos disciplinas, una misma pasión. Running, ciclismo, aventura y comunidad en cada recorrido.';

const HEAD = `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<meta name="author" content="Run &amp; Bike HN">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#080808">
<link rel="canonical" href="${SITE_URL}/">

<!-- Open Graph — WhatsApp, Facebook, Instagram -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Run &amp; Bike HN">
<meta property="og:locale" content="es_HN">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${SOCIAL_DESCRIPTION}">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:image" content="${SITE_URL}/assets/og-cover.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Run &amp; Bike HN — eventos de running y ciclismo en Honduras">

<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${SOCIAL_DESCRIPTION}">
<meta name="twitter:image" content="${SITE_URL}/assets/og-cover.jpg">

<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="assets/favicon-v3.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="assets/apple-touch-icon-v3.png">

<link rel="preconnect" href="https://unpkg.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<style>
/* Pantalla de carga: evita el flash en blanco/negro mientras arranca el runtime */
#rb-boot{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#080808;transition:opacity .45s ease}
#rb-boot[hidden]{display:none}
#rb-boot .rb-logo{width:min(300px,64vw);height:auto;display:block}
#rb-boot .rb-bar{width:150px;height:2px;background:rgba(255,255,255,.12);overflow:hidden}
#rb-boot .rb-bar span{display:block;width:40%;height:100%;background:linear-gradient(90deg,#E30613,#FF3D00);animation:rbBoot 1.1s ease-in-out infinite}
@keyframes rbBoot{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}
@media (prefers-reduced-motion:reduce){#rb-boot .rb-bar span{animation:none;width:100%}}
#rb-noscript{max-width:38ch;text-align:center;font-family:Montserrat,system-ui,sans-serif;font-size:14px;line-height:1.6;color:#B5B5B5}
</style>

<script src="./support.js"></script>
</head>`;

const SPLASH = `
<div id="rb-boot" role="status" aria-live="polite">
<picture>
<source srcset="assets/logo-splash.webp" type="image/webp">
<img class="rb-logo" src="assets/logo-splash.png" alt="Run &amp; Bike HN" width="640" height="254" fetchpriority="high" decoding="async">
</picture>
<div class="rb-bar"><span></span></div>
<noscript><p id="rb-noscript">Este sitio necesita JavaScript activado para mostrarse. Activalo en tu navegador y recargá la página. También podés escribirnos por WhatsApp al <a href="https://wa.me/50489237707">+504 8923-7707</a>.</p></noscript>
</div>
`;

const BOOT_SCRIPT = `
<script>
/* Oculta la pantalla de carga cuando el runtime ya montó la página. */
(function () {
  var boot = document.getElementById('rb-boot');
  if (!boot) return;
  var hidden = false;
  function hide() {
    if (hidden) return;
    hidden = true;
    boot.style.opacity = '0';
    setTimeout(function () { boot.hidden = true; }, 500);
  }
  var poll = setInterval(function () {
    var root = document.getElementById('dc-root');
    if (root && root.childElementCount > 0) { clearInterval(poll); hide(); }
  }, 90);
  /* Red de seguridad: nunca dejar la cortina puesta más de 12 s. */
  setTimeout(function () { clearInterval(poll); hide(); }, 12000);
})();
</script>
`;

/** Falla ruidosamente en vez de escribir un index.html a medias. */
function replaceOnce(text, pattern, replacement, what) {
  const matches = text.match(pattern);
  if (!matches) throw new Error(`build: no se encontró ${what} en ${SOURCE}`);
  return text.replace(pattern, () => replacement);
}

let html = readFileSync(join(ROOT, SOURCE), 'utf8').replace(/\r\n/g, '\n');

html = replaceOnce(html, /<html[^>]*>/, '<html lang="es">', 'la etiqueta <html>');
html = replaceOnce(html, /<head>[\s\S]*?<\/head>/, HEAD, 'el bloque <head>');
html = replaceOnce(html, /<body>\n/, `<body>\n${SPLASH}`, 'la etiqueta <body>');
html = replaceOnce(html, /\n<\/body>/, `\n${BOOT_SCRIPT}</body>`, 'el cierre </body>');

/* El <helmet> vuelve a inyectar title y description desde el cliente. Como ahora
   están en el <head> estático, se quitan de ahí para no duplicar etiquetas. */
html = replaceOnce(
  html,
  /<helmet data-dc-atomics><meta name="viewport"[^>]*><title>[\s\S]*?<\/title><meta name="description"[^>]*>/,
  '<helmet data-dc-atomics>',
  'el bloque <helmet>'
);

writeFileSync(join(ROOT, OUTPUT), html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`✓ ${OUTPUT} generado desde "${SOURCE}" (${kb} KB)`);
console.log(`  URL canónica: ${SITE_URL}/`);
