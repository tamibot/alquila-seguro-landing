# Prompt Pack IA - Hero de artículos del Blog

Este pack estandariza imágenes para `/blog` con branding AlquilaSeguro y evita resultados simples o con texto roto.

## 1) Prompt maestro (usar siempre)

```text
Create a premium editorial blog hero image (1200x630) for a real-estate article in Lima, Peru.
Brand style: AlquilaSeguro visual identity. Use blue palette only (#0b3f67, #0f5b8f, #1d7bb6, #d8ecfb, #f6fbff).
Composition: left headline zone, right insight panel (checklist/KPI card), strong hierarchy, modern financial-real-estate feel.
Visual language: clean dashboard-infographic hybrid, subtle grid texture, rounded cards, soft depth, high contrast.
Text constraints (strict):
- Max 2 headline lines + 1 subtitle line.
- Max 5 short checklist bullets.
- Never overlap text blocks.
- Keep 80px safe margins on all sides.
- Ensure all text is fully visible on mobile crop.
- No tiny fonts.
- No broken letters.
Output quality: crisp, legible, professional, not generic template.
Negative requirements:
- Do not use purple, magenta, neon, or unrelated colors.
- Do not place decorative circles over text.
- Do not use watermarks, logos from other brands, or stock watermark artifacts.
- Do not generate long paragraphs.
```

## 2) Variables por entrada

Reemplazar en cada generación:
- `HEADLINE_LINE_1`
- `HEADLINE_LINE_2`
- `SUBTITLE`
- `BULLET_1..BULLET_5`
- `CATEGORY_BADGE` (ej. INVERSION, RIESGO, LEGAL, GESTION)

## 3) Ejemplo aplicado al post #2

```text
CATEGORY_BADGE: INVERSION EN LIMA
HEADLINE_LINE_1: Gastos post-compra
HEADLINE_LINE_2: para alquiler en Lima
SUBTITLE: Impuestos, arbitrios y flujo neto
BULLET_1: Renta 5%
BULLET_2: Predial y arbitrios
BULLET_3: Mantenimiento
BULLET_4: Fondo de contingencia
BULLET_5: Control mensual de caja
```

## 4) QA obligatorio antes de publicar

- No hay texto cortado.
- No hay superposición de títulos y paneles.
- Se lee bien en 1200x630 y en miniatura.
- Respeta paleta azul de marca.
- Formato final: PNG (1200x630).

