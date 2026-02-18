# Lógica de Flujos: Integración MCP y Webhooks

Este documento define la estructura técnica de datos (Payloads) que intercambian la IA y el Webhook.

## 1. Definición de Herramientas (JSON Schema para la IA)

Así es como le "explicamos" a la IA (Claude/GPT) qué puede hacer.

### Herramienta A: `check_availability`

```json
{
  "name": "check_availability",
  "description": "Consuta los horarios disponibles para una fecha específica.",
  "input_schema": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "La fecha a consultar en formato YYYY-MM-DD"
      }
    },
    "required": ["date"]
  }
}
```

### Herramienta B: `book_appointment`

```json
{
  "name": "book_appointment",
  "description": "Agenda una nueva cita en el calendario.",
  "input_schema": {
    "type": "object",
    "properties": {
      "date": { "type": "string", "description": "YYYY-MM-DD" },
      "time": { "type": "string", "description": "HH:MM (24h)" },
      "email": { "type": "string", "description": "Email del usuario" },
      "name": { "type": "string", "description": "Nombre del usuario" }
    },
    "required": ["date", "time", "email"]
  }
}
```

### Herramienta C: `modify_appointment`

```json
{
  "name": "modify_appointment",
  "description": "Modifica el horario de una cita existente.",
  "input_schema": {
    "type": "object",
    "properties": {
      "booking_id": { "type": "string", "description": "ID de la reserva (si se conoce)" },
      "email": { "type": "string", "description": "Email para buscar la cita" },
      "new_date": { "type": "string" },
      "new_time": { "type": "string" }
    },
    "required": ["email", "new_date", "new_time"]
  }
}
```

---

## 2. Estructura del Payload hacia el Webhook

Cuando la IA decide usar una herramienta, envía este JSON a tu URL de n8n.

**Ejemplo de Petición (Request):**

```json
{
  "tool": "book_appointment",
  "parameters": {
    "date": "2024-10-25",
    "time": "15:30",
    "email": "juan@ejemplo.com",
    "name": "Juan Pérez"
  }
}
```

---

## 3. Integración con n8n (Lógica del EndPoint)

El flujo en n8n debe tener un nodo "Switch" o "If" que evalúe el campo `tool`.

### Rama `check_availability`

1. **Recibe:** `{ "date": "2024-10-25" }`
2. **Acción:** Google Calendar -> "Get Events" en ese rango.
3. **Lógica:** Calcular huecos libres.
4. **Responde:** `{ "available_slots": ["09:00", "11:30", "15:00"] }`

### Rama `book_appointment`

1. **Recibe:** Datos de cita.
2. **Acción:** Google Calendar -> "Create Event".
3. **Responde:** `{ "status": "success", "event_link": "https://calendar.google..." }`

### Rama `modify_appointment`

1. **Recibe:** Nuevos datos.
2. **Acción:** Google Calendar -> "Get Event" (por email) -> "Update Event".
3. **Responde:** `{ "status": "modified", "previous_time": "10:00", "new_time": "15:00" }`

---

## 4. Otros Ejemplos de Payload

### Validación de Pagos (`check_payment`)

```json
{
  "tool": "check_payment",
  "parameters": {
    "transaction_id": "tx_123456789"
  }
}
```

**Respuesta:** `{ "status": "paid", "amount": 50.00, "currency": "USD" }`

### Consulta Base de Datos (`query_client`)

```json
{
  "tool": "query_client",
  "parameters": {
    "client_id": "CLI-9988"
  }
}
```

**Respuesta:** `{ "name": "Empresa SAC", "plan": "Premium", "debt": 0 }`
