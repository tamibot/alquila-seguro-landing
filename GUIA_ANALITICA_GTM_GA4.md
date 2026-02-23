# Guia de Analitica Web: GTM + GA4

## Objetivo
Medir:
- Trafico de la landing.
- Clicks a CTAs (especialmente WhatsApp).
- Apertura de video del hero.
- Conversiones de contacto.

## 1) Lo que ya quedo implementado en codigo
En `/Users/macbookair/Desktop/Antigratity-google/alquila-seguro-landing/index.html`:
- GTM instalado en `<head>` con `GTM-PH4CDSCH`.
- Bloque `noscript` de GTM al inicio de `<body>`.

En `/Users/macbookair/Desktop/Antigratity-google/alquila-seguro-landing/script.js`:
- Evento `cta_click` enviado a `dataLayer` al hacer click en:
  - Botones `.btn`
  - Enlaces `.learn-more`
  - Boton flotante `.whatsapp-float`
  - Links del menu `.nav-links a`
- Evento `video_open` al abrir video del hero.

Payload enviado:
- `event`
- `cta_text`
- `cta_href`
- `cta_section`
- `cta_type`

## 2) Configuracion en Google Analytics 4
1. Entra a [https://analytics.google.com](https://analytics.google.com).
2. Crea propiedad GA4 (si no existe).
3. Crea un Data Stream Web con dominio `www.alquilaseguro.com.pe`.
4. Copia el `Measurement ID` (formato `G-XXXXXXX`).

## 3) Configuracion en Google Tag Manager
1. Entra a [https://tagmanager.google.com](https://tagmanager.google.com).
2. Abre el contenedor `GTM-PH4CDSCH`.
3. Crea una etiqueta:
   - Tipo: `Google Analytics: GA4 Configuration`.
   - Measurement ID: `G-XXXXXXX`.
   - Trigger: `All Pages`.
4. Guardar.

## 4) Crear eventos en GTM desde dataLayer
### Evento A: CTA click
1. Trigger nuevo:
   - Tipo: `Custom Event`.
   - Event name: `cta_click`.
2. Tag nuevo:
   - Tipo: `Google Analytics: GA4 Event`.
   - Event name: `cta_click`.
   - Event parameters:
     - `cta_text` = `{{DLV - cta_text}}`
     - `cta_href` = `{{DLV - cta_href}}`
     - `cta_section` = `{{DLV - cta_section}}`
     - `cta_type` = `{{DLV - cta_type}}`
3. Asignar trigger `cta_click`.

### Evento B: Hero video open
1. Trigger nuevo:
   - Tipo: `Custom Event`.
   - Event name: `video_open`.
2. Tag GA4 Event:
   - Event name: `video_open`.
   - Parameters:
     - `video_id` = `{{DLV - video_id}}`
     - `video_context` = `{{DLV - video_context}}`

## 5) Variables Data Layer en GTM
Crear variables tipo `Data Layer Variable`:
- `DLV - cta_text`
- `DLV - cta_href`
- `DLV - cta_section`
- `DLV - cta_type`
- `DLV - video_id`
- `DLV - video_context`

## 6) Marcar conversiones en GA4
En GA4 -> Admin -> Events:
1. Espera que lleguen eventos `cta_click` y `video_open`.
2. Marca como conversion al menos:
   - `cta_click` (filtrando en reportes por `cta_type = whatsapp`).

Sugerencia:
- Mantener `cta_click` como conversion principal de lead inicial.

## 7) QA antes de publicar
1. GTM -> `Preview` (Tag Assistant).
2. Navega la landing y valida:
   - Dispara `GA4 Configuration` al cargar.
   - Dispara `cta_click` al presionar CTAs.
   - Dispara `video_open` al abrir video del hero.
3. GA4 -> Realtime:
   - Verifica que eventos entren con parametros.

## 8) Publicacion
1. En GTM presiona `Submit` -> `Publish`.
2. Nombre recomendado de version: `landing-v1-analytics-base`.

## 9) Dashboard recomendado (Looker Studio)
Panel minimo:
- Usuarios, sesiones, engagement rate.
- CTAs por seccion (`cta_section`).
- CTAs por tipo (`cta_type`).
- Top enlaces (`cta_href`).
- Tendencia semanal de `cta_click`.

## 10) Plan de mejora continua (semanal)
- Revisar rendimiento por CTA y seccion.
- Ajustar copies/botones con menor CTR.
- Medir variaciones por dispositivo (mobile vs desktop).
- Conectar Search Console para consultas organicas.

## 11) SEO tecnico recomendado (siguiente paso)
- Dar de alta propiedad en Search Console.
- Enviar `sitemap.xml`.
- Revisar indexacion de home y rich results de FAQ.
- Medir Core Web Vitals en Search Console.
