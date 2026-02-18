# PPT: Integración de MCP (Model Context Protocol) y Webhooks

Presentación breve y directa sobre cómo conectar IAs con herramientas reales.

---

## Slide 1: Título

* **Título:** Integración de Herramientas con IA (MCP)
* **Subtítulo:** Conectando Modelos de Lenguaje con tus Sistemas Reales.
* **Concepto:** Cerebro (IA) + Manos (Herramientas).

## Slide 2: ¿Qué es un MCP?

* **Definición:** Protocolo que da "manos y ojos" a la IA.
* **Antes:** La IA solo chatea.
* **Ahora:** La IA utiliza herramientas (Calendario, Pagos, BD) a través de comandos estructurados.

## Slide 3: Arquitectura (El Puente)

* **Diagrama:** Usuario -> IA (MCP Client) -> Webhook (n8n) -> API Externa.
* **Clave:** La IA no ejecuta la acción directa, envía una "solicitud" (JSON) que un intermediario (Webhook) procesa.

## Slide 4: Caso de Uso: Asistente General

* **Objetivo:** Gestionar tareas complejas en tiempo real.
* **Ejemplo:** Gestión de Citas (Calendario).
* **El Problema:** Las IAs alucinan disponibilidad.
* **La Solución:** Consultar la fuente de verdad (Google Calendar/Outlook).

## Slide 5: Definición de Herramientas (La "Carta")

* **Concepto:** Debemos declarar qué funciones existen.
* **Visual:**
  * `check_availability`: Consultar huecos.
  * `book_appointment`: Reservar.
  * `modify_appointment`: Mover/Cancelar.
* **Nota:** Si no está en la carta, la IA no puede pedirlo.

## Slide 6: El Cerebro Conector: Webhooks (n8n)

* **Rol:** El Webhook es el traductor.
* **Proceso:**
    1. Recibe orden de la IA (`tool: book`).
    2. Ejecuta acción en API (Google Calendar).
    3. Devuelve resultado a la IA ("Listo, agendado").

## Slide 7: Capacidades en Acción (Ejemplo Calendario)

* **Contenido Unificado:** Muestra las 3 acciones posibles en una sola vista.
* **Visual:**
    1. **Consultar:** Usuario pregunta -> IA revisa huecos libres.
    2. **Agendar:** Usuario confirma -> IA bloquea espacio.
    3. **Modificar:** Usuario cambia hora -> IA actualiza evento.
* **Mensaje:** Un solo asistente, múltiples herramientas a su disposición.

## Slide 8: Catálogo de Posibilidades (Otros Usos)

* **Validación de Pagos:** Verificar transacciones en Stripe.
* **Base de Datos:** Consultar estado de pedidos o stock.
* **Soporte:** Buscar en base de conocimiento interna.

## Slide 9: Resumen y Próximos Pasos

* **Resumen:** MCP estructura la intención; Webhook ejecuta la acción.
* **Entregables:** JSON Schemas y Workflow base.
* **Cierre:** "IA operando en el mundo real".
