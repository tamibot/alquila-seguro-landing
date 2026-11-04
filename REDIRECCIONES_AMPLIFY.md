# Redirecciones 301 para AWS Amplify

Archivo interno (no se publica: `amplify.yml` solo copia a `dist/` los archivos públicos y excluye `*.md`).

Dónde configurarlas: consola de AWS Amplify → app → **Hosting → Rewrites and redirects** → *Manage redirects*.
Amplify evalúa las reglas **de arriba hacia abajo**: dejar las específicas primero y las de dominio al final.

**Cuándo:** solo después de publicar esta rama y revisarla en vivo. Antes no: las reglas 13 y 14 romperían las imágenes de la versión de mayo, que hoy está publicada.

**Regla 16:** omitirla mientras no exista el subdominio blog.alquilaseguro.com.pe.

## Tabla de reglas

| # | Origen (source) | Destino (target) | Tipo | Motivo |
|---|---|---|---|---|
| 1 | `/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino-2%202.html` | `/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino.html` | 301 | Copia duplicada (nombre con espacio) |
| 2 | `/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino-2.html` | `/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino.html` | 301 | Duplicado `-2` (mismo título y H1) |
| 3 | `/blog/post-asi-es-vivir-en-modo-departamentos-modernos-en-alquiler-en-san-miguel-2.html` | `/blog/post-asi-es-vivir-en-modo-departamentos-modernos-en-alquiler-en-san-miguel.html` | 301 | Duplicado `-2` |
| 4 | `/blog/post-de-edificio-estudiantil-a-multifamily-institucional-la-reconversion-de-modo-2.html` | `/blog/post-de-edificio-estudiantil-a-multifamily-institucional-la-reconversion-de-modo.html` | 301 | Duplicado `-2` |
| 5 | `/blog/post-guia-definitiva-como-alquilar-un-inmueble-de-forma-segura-2.html` | `/blog/post-guia-definitiva-como-alquilar-un-inmueble-de-forma-segura.html` | 301 | Duplicado `-2` |
| 6 | `/blog/post-morosidad-de-alquiler-casi-nula-en-lima-el-modelo-proper-rentas-para-propietarios-que-quieren-alquilar-su-departamento-sin-riesgos-2.html` | `/blog/post-morosidad-de-alquiler-casi-nula-en-lima-el-modelo-proper-rentas-para-propietarios-que-quieren-alquilar-su-departamento-sin-riesgos.html` | 301 | Duplicado `-2` |
| 7 | `/blog/post-radiografia-de-la-vivienda-en-el-peru-principales-indicadores-problematica-y-oportunidades-2.html` | `/blog/post-radiografia-de-la-vivienda-en-el-peru-principales-indicadores-problematica-y-oportunidades.html` | 301 | Duplicado `-2` |
| 8 | `/blog/post-tienes-un-inmueble-en-alquiler-esta-es-la-razon-por-la-que-deberias-delegarlo-a-un-administrador-profesional-2.html` | `/blog/post-tienes-un-inmueble-en-alquiler-esta-es-la-razon-por-la-que-deberias-delegarlo-a-un-administrador-profesional.html` | 301 | Duplicado `-2` |
| 9 | `/blog/post-gastos-invertir-departamento-alquilar.html` | `/blog/post-gastos-invertir-departamento-para-alquilar.html` | 301 | Mismo título y H1; el original es el publicado primero (24/01/2026) |
| 10 | `/blog/post-5-senales-para-reducir-riesgo-de-morosidad-en-alquiler.html` | `/blog/post-riesgo-morosidad.html` | 301 | URL antigua que no existe (estaba enlazada desde un post) |
| 11 | `/blog/sitemap.xml` | `/sitemap.xml` | 301 | Se unificó en un solo sitemap en la raíz |
| 12 | `/blog/robots.txt` | `/robots.txt` | 301 | Se eliminó el robots del blog |
| 13 | `/img/family_moving.png` | `/img/family_moving.jpg` | 301 | El archivo era JPEG con extensión .png; se renombró |
| 14 | `/img/hero_background.png` | `/img/hero_background.jpg` | 301 | Ídem |
| 15 | `https://alquilaseguro.com.pe/<*>` | `https://www.alquilaseguro.com.pe/<*>` | 301 | Hallazgo 02/10/2026: `https://alquilaseguro.com.pe/` responde **200** con la home (no redirige); solo `http://` redirige. Duplica el sitio en dos hosts |
| 16 | `https://blog.alquilaseguro.com.pe/<*>` | `https://www.alquilaseguro.com.pe/blog/<*>` | 301 | **Solo si algún día se crea el subdominio** (hoy no existe en DNS). Requiere agregar `blog` en Domain management de Amplify y el registro DNS en Punto.pe; si no, la regla no hace nada |

Notas:
- Los duplicados de las reglas 1–9 ya tienen en el HTML `canonical` al original y `noindex, follow`, y salieron del `sitemap.xml` y del listado del blog. La 301 es la solución definitiva; cuando esté activa, los archivos duplicados pueden quedarse en el repo sin problema.
- No agregar reglas `/blog/index.html → /blog/` ni `/index.html → /`: Amplify sirve `index.html` en esas rutas y se puede generar un bucle. El `canonical` ya resuelve esa duplicidad.
- `/herramientas/assistant.js`, `/package.json`, `/*.md` y el PDF del manual dejarán de existir al publicar con el nuevo `amplify.yml` (devolverán 404). Es lo esperado.

## JSON para "Bulk edit" (mismo orden)

```json
[
  { "source": "/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino-2%202.html", "target": "/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino.html", "status": "301", "condition": null },
  { "source": "/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino-2.html", "target": "/blog/post-criterios-indispensables-a-la-hora-de-evaluar-a-un-inquilino.html", "status": "301", "condition": null },
  { "source": "/blog/post-asi-es-vivir-en-modo-departamentos-modernos-en-alquiler-en-san-miguel-2.html", "target": "/blog/post-asi-es-vivir-en-modo-departamentos-modernos-en-alquiler-en-san-miguel.html", "status": "301", "condition": null },
  { "source": "/blog/post-de-edificio-estudiantil-a-multifamily-institucional-la-reconversion-de-modo-2.html", "target": "/blog/post-de-edificio-estudiantil-a-multifamily-institucional-la-reconversion-de-modo.html", "status": "301", "condition": null },
  { "source": "/blog/post-guia-definitiva-como-alquilar-un-inmueble-de-forma-segura-2.html", "target": "/blog/post-guia-definitiva-como-alquilar-un-inmueble-de-forma-segura.html", "status": "301", "condition": null },
  { "source": "/blog/post-morosidad-de-alquiler-casi-nula-en-lima-el-modelo-proper-rentas-para-propietarios-que-quieren-alquilar-su-departamento-sin-riesgos-2.html", "target": "/blog/post-morosidad-de-alquiler-casi-nula-en-lima-el-modelo-proper-rentas-para-propietarios-que-quieren-alquilar-su-departamento-sin-riesgos.html", "status": "301", "condition": null },
  { "source": "/blog/post-radiografia-de-la-vivienda-en-el-peru-principales-indicadores-problematica-y-oportunidades-2.html", "target": "/blog/post-radiografia-de-la-vivienda-en-el-peru-principales-indicadores-problematica-y-oportunidades.html", "status": "301", "condition": null },
  { "source": "/blog/post-tienes-un-inmueble-en-alquiler-esta-es-la-razon-por-la-que-deberias-delegarlo-a-un-administrador-profesional-2.html", "target": "/blog/post-tienes-un-inmueble-en-alquiler-esta-es-la-razon-por-la-que-deberias-delegarlo-a-un-administrador-profesional.html", "status": "301", "condition": null },
  { "source": "/blog/post-gastos-invertir-departamento-alquilar.html", "target": "/blog/post-gastos-invertir-departamento-para-alquilar.html", "status": "301", "condition": null },
  { "source": "/blog/post-5-senales-para-reducir-riesgo-de-morosidad-en-alquiler.html", "target": "/blog/post-riesgo-morosidad.html", "status": "301", "condition": null },
  { "source": "/blog/sitemap.xml", "target": "/sitemap.xml", "status": "301", "condition": null },
  { "source": "/blog/robots.txt", "target": "/robots.txt", "status": "301", "condition": null },
  { "source": "/img/family_moving.png", "target": "/img/family_moving.jpg", "status": "301", "condition": null },
  { "source": "/img/hero_background.png", "target": "/img/hero_background.jpg", "status": "301", "condition": null },
  { "source": "https://alquilaseguro.com.pe/<*>", "target": "https://www.alquilaseguro.com.pe/<*>", "status": "301", "condition": null },
  { "source": "https://blog.alquilaseguro.com.pe/<*>", "target": "https://www.alquilaseguro.com.pe/blog/<*>", "status": "301", "condition": null }
]
```

Si ya existen reglas en la consola (por ejemplo, la regla SPA `/<*> → /index.html 404-200` u otra), conservarlas **debajo** de estas.
