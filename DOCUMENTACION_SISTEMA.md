# Infraestructura de Produccion - AlquilaSeguro

## 1. Objetivo de esta documentacion
Este documento describe solo la infraestructura de publicacion:
- Dominio en Punto.pe
- Hosting en AWS Amplify
- Integracion de despliegue automatico con GitHub
- Flujo operativo para cambios en produccion

## 2. Arquitectura actual

```mermaid
flowchart LR
    DEV["Equipo de desarrollo"] --> GIT["GitHub Repo<br/>tamibot/alquila-seguro-landing<br/>branch: main"]
    GIT --> AMP["AWS Amplify Hosting<br/>Build + Deploy"]
    AMP --> CDN["AWS CDN + HTTPS (ACM)"]
    CDN --> WWW["www.alquilaseguro.com.pe"]
    APEX["alquilaseguro.com.pe"] --> REDIR["Redireccion 301"]
    REDIR --> WWW
    DNS["DNS en Punto.pe"] --> WWW
    DNS --> APEX
```

## 3. Componentes y responsabilidad

### 3.1 GitHub
- Repositorio fuente: `https://github.com/tamibot/alquila-seguro-landing`
- Rama productiva: `main`
- Trigger de despliegue: cada push a `main`

### 3.2 AWS Amplify
- Servicio de hosting principal
- Lee configuracion de build desde `amplify.yml`
- Publica activos estaticos en CDN
- Gestiona certificado SSL con AWS Certificate Manager (ACM)

### 3.3 Dominio en Punto.pe
- Dominio publico:
  - Canonico: `www.alquilaseguro.com.pe`
  - Apex: `alquilaseguro.com.pe` (redireccionado a `www`)
- Registros esperados:
  - `www` por `CNAME` al target entregado por Amplify
  - Apex por redireccion web 301 a `https://www.alquilaseguro.com.pe`

## 4. Flujo CI/CD de produccion

```mermaid
sequenceDiagram
    participant DEV as Desarrollador
    participant GIT as GitHub (main)
    participant AMP as AWS Amplify
    participant WEB as Produccion (www)

    DEV->>GIT: git push origin main
    GIT->>AMP: webhook de build
    AMP->>AMP: build y deploy
    AMP->>WEB: publica nueva version
    WEB-->>DEV: cambios visibles (1-4 min aprox)
```

## 5. Flujo de resolucion DNS

```mermaid
flowchart TD
    U["Usuario abre URL"] --> Q1{"URL solicitada"}
    Q1 -->|www.alquilaseguro.com.pe| W["DNS CNAME -> Amplify"]
    Q1 -->|alquilaseguro.com.pe| A["Regla de redireccion 301"]
    A --> W
    W --> C["CDN Amplify entrega contenido HTTPS"]
```

## 6. Runbook de publicacion
1. Realizar cambios en repositorio local.
2. Ejecutar:
```bash
git add .
git commit -m "descripcion del cambio"
git push origin main
```
3. Validar en Amplify que el deploy termine en estado `Deployed`.
4. Verificar sitio en:
   - `https://www.alquilaseguro.com.pe`
   - `https://alquilaseguro.com.pe` (debe redirigir a `www`)

## 7. Checklist de validacion de infraestructura
- GitHub conectado al app de Amplify correcto.
- Auto-build activado para branch `main`.
- Certificado SSL activo y sin advertencias.
- `www` resolviendo al destino Amplify.
- Apex redirigiendo 301 a `www`.

## 8. Alcance actual y siguiente fase
- Alcance actual:
  - Landing estatica desplegada en AWS Amplify.
  - Integracion continua desde GitHub.
- Fase siguiente (opcional):
  - Integrar backend para captura de leads (Railway o AWS serverless).
