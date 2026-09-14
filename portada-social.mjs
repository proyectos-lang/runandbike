/**
 * portada-social.mjs — arma la imagen que ven WhatsApp, Facebook y Twitter
 * cuando alguien comparte el enlace del sitio (la "portada social" u og:image).
 *
 * Sale una imagen de 1200x630 con la foto de fondo, el degradado oscuro de la
 * marca, el acento rojo diagonal, el logo y la línea "HONDURAS · RUNNING &
 * CICLISMO". Opcionalmente lleva un titular de dos renglones.
 *
 * ANTES DE USARLO, una sola vez:
 *
 *     npm install --prefix .herramientas @napi-rs/canvas
 *
 * El --prefix es a propósito: deja la librería en .herramientas/ en vez de
 * crear un package.json en la raíz. Este sitio se publica tal cual, sin
 * compilar, y un package.json en la raíz puede hacer que Vercel crea que hay
 * que construir algo.
 *
 * Las tipografías se descargan solas la primera vez a la carpeta .fuentes/
 * (hace falta internet). Ni .herramientas/ ni .fuentes/ se suben al repo.
 *
 * Uso:
 *
 *     node portada-social.mjs
 *         Regenera la portada que está publicada hoy y la deja en
 *         og-cover-nueva.jpg, en esta misma carpeta, para revisarla.
 *
 *     node portada-social.mjs --sin-titular
 *         Solo el logo y la línea de HONDURAS, sin texto grande.
 *
 *     node portada-social.mjs --titular "NUEVA LINEA|SEGUNDA LINEA"
 *         Cambia el titular. La barra | separa los dos renglones; el segundo
 *         va en naranja. Conviene dejarlo corto: entran unos 20 caracteres
 *         por renglón antes de que se salga.
 *
 *     node portada-social.mjs --foto assets/galeria-07.jpeg
 *         Usa otra foto de fondo.
 *
 * PARA PUBLICARLA, después de revisar og-cover-nueva.jpg:
 *
 *   1. Moverla a assets/ CON UN NOMBRE NUEVO (og-cover-v3.jpg, v4, etc.).
 *      El nombre tiene que cambiar sí o sí: assets/ se sirve con caché de un
 *      año e immutable, así que reemplazar el archivo viejo no refresca nada.
 *   2. Actualizar las dos menciones a og-cover en build.mjs (og:image y
 *      twitter:image).
 *   3. Borrar la portada anterior de assets/.
 *   4. node build.mjs, y commit.
 *
 * Ojo: WhatsApp guarda su propio caché del preview de cada enlace. Para ver la
 * portada nueva conviene compartir la URL con algo pegado al final
 * (runandbike.vercel.app/?2) o forzarla desde
 * https://developers.facebook.com/tools/debug/ con "Scrape Again".
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join, isAbsolute } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ruta = p => (isAbsolute(p) ? p : join(ROOT, p));

/* ------------------------------------------------------------------ *
 * Opciones de la línea de comandos
 * ------------------------------------------------------------------ */
const argv = process.argv.slice(2);
const opcion = (nombre, porDefecto = null) => {
  const i = argv.indexOf(nombre);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : porDefecto;
};

const SIN_TITULAR = argv.includes('--sin-titular');
const TITULAR = opcion('--titular', 'ORGANIZADORA DE|EVENTOS DEPORTIVOS');
const FOTO = opcion('--foto', 'assets/galeria-01.jpeg');
const SALIDA = opcion('--out', 'og-cover-nueva.jpg');

const W = 1200, H = 630;   // medida que piden Open Graph y Twitter

/* ------------------------------------------------------------------ *
 * Dependencia: @napi-rs/canvas
 * ------------------------------------------------------------------ */
let createCanvas, loadImage, GlobalFonts;
try {
  // Primero donde la deja el --prefix; si no, por si está instalada global.
  let mod;
  try {
    mod = createRequire(join(ROOT, '.herramientas', 'resolver.cjs'))('@napi-rs/canvas');
  } catch {
    mod = await import('@napi-rs/canvas');
  }
  ({ createCanvas, loadImage, GlobalFonts } = mod);
  if (!createCanvas) throw new Error('la librería cargó pero sin createCanvas');
} catch {
  console.error(`
Falta la librería que dibuja la imagen. Instalala una sola vez con:

    npm install --prefix .herramientas @napi-rs/canvas
`);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Tipografías: las mismas del sitio, descargadas la primera vez
 * ------------------------------------------------------------------ */
const FUENTES = ruta('.fuentes');

const bajarFuente = async (archivo, buscarUrl) => {
  const destino = join(FUENTES, archivo);
  if (existsSync(destino)) return destino;

  if (!existsSync(FUENTES)) mkdirSync(FUENTES, { recursive: true });
  console.log(`  bajando ${archivo}...`);

  const url = await buscarUrl();
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`no se pudo bajar ${archivo} (HTTP ${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());
  // Un TrueType arranca con 00 01 00 00. Si llega otra cosa, es un error disfrazado.
  if (buf.readUInt32BE(0) !== 0x00010000) {
    throw new Error(`${archivo} no llegó como TrueType; borrá .fuentes/ y reintentá`);
  }
  writeFileSync(destino, buf);
  return destino;
};

const montserrat = await bajarFuente('montserrat-bold.ttf', async () => {
  const css = await (await fetch('https://fonts.googleapis.com/css?family=Montserrat:700', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })).text();
  const m = css.match(/https:\/\/[^)]*\.ttf/);
  if (!m) throw new Error('Google Fonts no devolvió un .ttf para Montserrat');
  return m[0];
});

const bebas = await bajarFuente('bebas.ttf', async () =>
  'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf');

GlobalFonts.registerFromPath(montserrat, 'RBMont');
GlobalFonts.registerFromPath(bebas, 'RBBebas');

/* ------------------------------------------------------------------ *
 * A dibujar
 * ------------------------------------------------------------------ */
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

/* 1. Foto de fondo, alineada arriba: así queda fuera la barra de
      patrocinadores que traen al pie las fotos de la galería. */
const foto = await loadImage(ruta(FOTO));
ctx.drawImage(foto, 0, 0, W, foto.height * (W / foto.width));

/* 2. Oscurecido, para que el logo y el texto se lean sobre cualquier foto. */
const lateral = ctx.createLinearGradient(0, 0, W, 0);
lateral.addColorStop(0.00, 'rgba(8,8,8,0.90)');
lateral.addColorStop(0.46, 'rgba(8,8,8,0.52)');
lateral.addColorStop(1.00, 'rgba(8,8,8,0.30)');
ctx.fillStyle = lateral;
ctx.fillRect(0, 0, W, H);

const vertical = ctx.createLinearGradient(0, 0, 0, H);
vertical.addColorStop(0.00, 'rgba(8,8,8,0.42)');
vertical.addColorStop(0.45, 'rgba(8,8,8,0.14)');
vertical.addColorStop(1.00, 'rgba(8,8,8,0.72)');
ctx.fillStyle = vertical;
ctx.fillRect(0, 0, W, H);

/* 3. Acento rojo diagonal, el mismo de la portada del sitio. El degradado
      arranca transparente sobre el filo de la cuña: así se funde con la foto
      en vez de cortarla con una línea dura. */
const X0 = W * 0.66;
const rojo = ctx.createLinearGradient(X0, 0, W + 60, 0);
rojo.addColorStop(0.00, 'rgba(227,6,19,0.00)');
rojo.addColorStop(0.45, 'rgba(227,6,19,0.30)');
rojo.addColorStop(1.00, 'rgba(201,5,15,0.62)');
ctx.fillStyle = rojo;
const sesgo = Math.tan(13 * Math.PI / 180) * H;   // el skewX(-13deg) del sitio
ctx.beginPath();
ctx.moveTo(X0 + sesgo, 0);
ctx.lineTo(W + 100, 0);
ctx.lineTo(W + 100, H);
ctx.lineTo(X0, H);
ctx.closePath();
ctx.fill();

/* 4. Bloque de marca, centrado verticalmente. */
const MARGEN = 82;
const logo = await loadImage(ruta('assets/logo-splash.png'));
const LOGO_W = 468;
const LOGO_H = logo.height * (LOGO_W / logo.width);

const GAP_LINEA = 30, ALTO_LINEA = 22, GAP_TITULAR = 34, ALTO_TITULAR = 132;
const conTitular = !SIN_TITULAR;

const alto = LOGO_H + GAP_LINEA + ALTO_LINEA + (conTitular ? GAP_TITULAR + ALTO_TITULAR : 0);
let y = (H - alto) / 2;

ctx.save();
ctx.shadowColor = 'rgba(0,0,0,0.55)';
ctx.shadowBlur = 26;
ctx.shadowOffsetY = 4;
ctx.drawImage(logo, MARGEN, y, LOGO_W, LOGO_H);
ctx.restore();
y += LOGO_H + GAP_LINEA;

/* El canvas no tiene letter-spacing, así que el tracking se hace a mano,
   dibujando letra por letra. */
const texto = (s, x, yy, { font, color, tracking = 0 }) => {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 2;
  let cx = x;
  for (const ch of s) { ctx.fillText(ch, cx, yy); cx += ctx.measureText(ch).width + tracking; }
  ctx.restore();
};

const REGLA_W = 56;
ctx.fillStyle = '#FFD600';
ctx.fillRect(MARGEN, y + 8, REGLA_W, 4);
texto('HONDURAS  ·  RUNNING & CICLISMO', MARGEN + REGLA_W + 26, y + 18,
  { font: '600 19px RBMont', color: '#FFD600', tracking: 2.6 });

if (conTitular) {
  y += ALTO_LINEA + GAP_TITULAR;
  const [linea1, linea2 = ''] = TITULAR.split('|');
  texto(linea1, MARGEN - 3, y + 60, { font: '72px RBBebas', color: '#FFFFFF', tracking: 1 });
  if (linea2) texto(linea2, MARGEN - 3, y + 130, { font: '72px RBBebas', color: '#FF3D00', tracking: 1 });
}

/* 5. A disco. */
const jpg = await canvas.encode('jpeg', 88);
writeFileSync(ruta(SALIDA), jpg);

console.log(`✓ ${SALIDA}  ${W}x${H}  ${(jpg.length / 1024).toFixed(1)} KB`);
if (SALIDA === 'og-cover-nueva.jpg') {
  console.log('  Revisala. Para publicarla, leé las instrucciones al inicio de este archivo.');
}
