# Run & Bike HN — Sitio web

Sitio de una sola página para **Run & Bike HN**, organizadores de eventos de running y
ciclismo en Honduras. Es un sitio estático: no tiene servidor, base de datos ni proceso
de compilación en el despliegue. Vercel solo sirve los archivos tal cual.

---

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` | **La página publicada.** Se genera con `node build.mjs`; no editar a mano. |
| `Run and Bike HN - Mixto.dc.html` | **Fuente editable.** Es el archivo que abre el editor visual. |
| `build.mjs` | Toma la fuente, le injerta el `<head>` de producción y escribe `index.html`. |
| `support.js` | Runtime que interpreta las plantillas `.dc.html` en el navegador. |
| `assets/` | Imágenes, video del hero, logos de patrocinadores, favicon y portada social. |
| `uploads/` | Originales sin procesar de las fotos. Se guardan pero no se publican. |
| `404.html` | Página de error con la marca. |
| `vercel.json` | Cabeceras de caché y de seguridad. |
| `robots.txt`, `sitemap.xml` | Indexación en buscadores. |
| `Run & Bike HN.dc.html`, `... - Fondo blanco.dc.html`, `Vista movil.dc.html` | Variantes de diseño y vista previa móvil. No se publican. |

---

## Editar el contenido

Casi todo el texto del sitio vive en un bloque de JavaScript al final de
`Run and Bike HN - Mixto.dc.html`, en listas fáciles de tocar:

- `EVENTS` — calendario de eventos (nombre, fecha, lugar, disciplina, distancias, estado)
- `GALLERY` — galería de fotos
- `TESTIMONIALS` — testimonios de participantes
- `FAQS` — preguntas frecuentes
- `SPONSORS` — patrocinadores
- `STATS` — cifras del contador animado

También hay dos valores configurables en el atributo `data-props` de ese mismo bloque:

- `whatsappNumber` — actualmente `50489237707`
- `countdownTarget` — fecha del próximo evento para la cuenta regresiva,
  hoy `2026-08-30T05:00:00-06:00` (21K Renovart Platinum)

**Después de cualquier edición hay que regenerar la página publicada:**

```bash
node build.mjs
```

---

## Ver el sitio en la computadora

El sitio usa `fetch()`, así que **no funciona abriendo el archivo con doble clic**
(`file://`). Hay que levantar un servidor local:

```bash
npx serve .
```

Y abrir la dirección que imprime (normalmente <http://localhost:3000>).

---

## Publicar en GitHub

El repositorio ya está inicializado y con el primer commit hecho.

1. Crear un repositorio **vacío** en <https://github.com/new>
   (por ejemplo `run-bike-hn`, sin README ni `.gitignore` — este proyecto ya los trae).

2. Conectarlo y subir:

   ```bash
   git remote add origin https://github.com/USUARIO/run-bike-hn.git
   git push -u origin main
   ```

Para los cambios siguientes:

```bash
node build.mjs
git add -A
git commit -m "Actualiza el calendario de eventos"
git push
```

---

## Publicar en Vercel

1. Entrar a <https://vercel.com/new> con la cuenta de GitHub.
2. Elegir **Import** en el repositorio `run-bike-hn`.
3. En la configuración del proyecto:
   - **Framework Preset:** `Other`
   - **Build Command:** dejar vacío
   - **Output Directory:** dejar vacío (la raíz del repo)
   - **Install Command:** dejar vacío
4. **Deploy.**

Vercel toma `vercel.json` automáticamente. A partir de ahí, cada `git push` a `main`
publica una versión nueva, y cada rama genera una vista previa con su propia URL.

### Dominio propio

En Vercel: **Settings → Domains → Add**, y seguir los registros DNS que indique.

Al conectar el dominio definitivo hay que actualizar la URL en **tres lugares**:

1. `build.mjs` → la constante `SITE_URL` (y volver a correr `node build.mjs`)
2. `robots.txt` → la línea `Sitemap:`
3. `sitemap.xml` → la etiqueta `<loc>`

---

## Notas técnicas

- La página se arma en el navegador: `support.js` carga React 18 desde unpkg y luego
  renderiza la plantilla. Mientras eso ocurre se muestra una pantalla de carga con la
  marca, que desaparece sola al montar la página.
- Los metadatos de SEO y de redes sociales (Open Graph) están en el HTML estático, así
  que WhatsApp y Facebook muestran la portada correcta aunque no ejecuten JavaScript.
- `assets/hero-v2.mp4` (4.1 MB, 684 kb/s, H.264 High, sin audio) se transmite
  progresivamente: el navegador empieza a reproducir con los primeros KB, sin esperar la
  descarga completa. Mientras tanto se ve `assets/hero-poster.jpg`. El original sin
  comprimir está en `uploads/`. Si alguna vez se reemplaza el video, hay que **cambiarle
  el nombre de archivo** (`hero-v3.mp4`, etc.) y actualizar la referencia en el `.dc.html`.
- Las imágenes de `assets/` se sirven con caché de un año. Si se reemplaza una foto
  conviene cambiarle el nombre de archivo para forzar la actualización.
