# Analytics Automation Setup (GTM + GA4)

## Objetivo
Tener control por scripts para analytics en AlquilaSeguro, manteniendo el sitio estatico.

## 1) Requisitos
- Service account con acceso a:
  - GTM container `GTM-PH4CDSCH` (Read/Edit/Approve/Publish).
  - GA4 property (Editor o Admin).
- Archivo JSON de service account guardado localmente (no en git).

## 2) Variables de entorno
Crea `.env.local` (no se sube a git) con:

```env
GOOGLE_APPLICATION_CREDENTIALS=/ABSOLUTE/PATH/analytics-automation-bot.json
GTM_ACCOUNT_ID=6340877017
GTM_CONTAINER_ID=244449364
GTM_WORKSPACE_ID=2
GA4_PROPERTY_ID=REEMPLAZAR_NUMERICO
GA4_MEASUREMENT_ID=G-CLDXQ7YSXV
```

## 3) Instalar dependencias
```bash
npm install
```

## 4) Sincronizar GTM por script
Dry run:
```bash
npm run analytics:gtm:dry
```
Apply:
```bash
npm run analytics:gtm:apply
```

Este script crea/actualiza:
- Variables Data Layer (`DLV - ...`)
- Triggers de custom event (`EV - cta_click`, `EV - video_open`)
- Tags GA4 (`GA4 - Config`, `GA4 - Event - ...`)

## 5) Sincronizar GA4 por script
Dry run:
```bash
npm run analytics:ga4:dry
```
Apply:
```bash
npm run analytics:ga4:apply
```

Este script crea/actualiza:
- Custom dimensions de eventos (`cta_*`, `video_*`)
- Conversion event (`cta_click`)

## 6) Publicar cambios de GTM
Despues de `analytics:gtm:apply`:
1. Abre GTM.
2. Revisa Workspace.
3. Submit / Publish.

## 7) Verificacion
- GA4 Realtime: debe entrar `page_view`, `cta_click`, `video_open`.
- Validar que `cta_click` tenga parametros (`cta_text`, `cta_href`, etc).

## 8) Nota de arquitectura actual
El sitio envia eventos por dos vias:
- `dataLayer.push(...)` para GTM.
- `gtag('event', ...)` para entrega inmediata a GA4.

Cuando GTM ya este 100% validado, se puede dejar una sola via (recomendado: GTM) para evitar doble mantenimiento.
