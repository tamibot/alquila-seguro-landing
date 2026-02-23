# Documentacion del Sistema - AlquilaSeguro Landing

## 1. Objetivo
Esta landing esta preparada para publicarse en produccion con despliegue automatico desde GitHub hacia AWS Amplify, usando el dominio `alquilaseguro.com.pe`.

## 2. Stack del proyecto
- Frontend estatico:
  - `index.html`
  - `styles.css`
  - `script.js`
- Recursos estaticos:
  - carpeta `img/`
- Sin backend en fase actual.
- Captura de leads temporal via WhatsApp (sin API).

## 3. Integracion de servicios
## 3.1 GitHub
- Repositorio remoto: `https://github.com/tamibot/alquila-seguro-landing`
- Rama productiva: `main`
- Cada push a `main` dispara despliegue automatico.

## 3.2 AWS Amplify Hosting
- Amplify se conecta al repo de GitHub.
- Lee `amplify.yml` para publicar contenido estatico.
- Entrega CDN + HTTPS (certificado administrado por ACM).

## 3.3 Dominio (Punto.pe)
- Dominio publico:
  - Canonico: `www.alquilaseguro.com.pe`
  - Apex: `alquilaseguro.com.pe` redirigiendo a `www`
- DNS recomendado:
  - `CNAME` para `www` apuntando al target de Amplify.
  - Redireccion 301 de apex a `https://www.alquilaseguro.com.pe`.

## 4. Flujo de publicacion (CI/CD)
1. Hacer cambios locales.
2. Commit en git.
3. Push a `origin/main`.
4. Amplify ejecuta build/deploy automaticamente.
5. Cambios disponibles en produccion en 1-4 minutos aprox.

## 5. Integracion funcional actual
- Todos los botones de contacto y CTA abren WhatsApp al numero:
  - `+51 912 462 976`
- Mensaje unificado:
  - `Hola, vengo de la web de AlquilaSeguro, quisiera mas informacion.`
- Formulario de contacto:
  - No envia a backend.
  - Al enviar, abre WhatsApp con el mensaje unificado.

## 6. Archivos legales placeholder
Se agregaron paginas temporales para evitar enlaces rotos:
- `terminos-y-condiciones.html`
- `politica-de-privacidad.html`
- `libro-de-reclamaciones.html`

Estas paginas deben reemplazarse por contenido legal definitivo cuando el area legal lo entregue.

## 7. Optimizaciones aplicadas
- Eliminada carga de Google Fonts no utilizada.
- `defer` en `script.js`.
- Lazy loading en iframes de testimonios.
- Ajuste de loader para no bloquear tanto el primer render.
- Modo `prefers-reduced-motion` para mejorar experiencia y rendimiento en dispositivos sensibles a animaciones.

## 8. Operacion diaria (equipo)
Para publicar cambios:

```bash
git add .
git commit -m "descripcion del cambio"
git push origin main
```

Verificacion minima post-deploy:
1. Abrir `https://www.alquilaseguro.com.pe`
2. Confirmar CTA de WhatsApp.
3. Confirmar menu mobile y secciones.
4. Confirmar enlaces legales.

## 9. Roadmap recomendado (fase 2)
- Implementar backend de leads (Railway o AWS Lambda/API Gateway).
- Guardar leads en CRM/Sheets.
- Integrar analitica (GA4 + eventos de CTA/scroll/form submit).
- Reemplazar testimonios de YouTube placeholder por IDs reales.
