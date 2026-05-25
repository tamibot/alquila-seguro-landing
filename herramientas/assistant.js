const KB_RESPONSES = [
  {
    keys: ['precio', 'costo', 'cuanto cobran', 'comision', 'igv'],
    answer:
      'Te explico rápido: el corretaje equivale a 1 mes de alquiler (incluye IGV) y la administración es 7% mensual + IGV. Si tomas corretaje + administración, la implementación puede salir gratis.',
  },
  {
    keys: ['tiempo', 'cuanto demora', 'demora', 'rapido'],
    answer:
      'El tiempo promedio para alquilar es de 24 días, aunque cambia por distrito, estado de la propiedad y precio de salida.',
  },
  {
    keys: ['cobertura', 'distrito', 'zona', 'lima'],
    answer:
      'Actualmente la cobertura principal es Lima Metropolitana y en alquileres de largo plazo (mínimo 12 meses).',
  },
  {
    keys: ['seguridad', 'moroso', 'no paga', 'desalojo'],
    answer:
      'Si hay incumplimiento de pago, se activa el flujo de cobranza y soporte legal definido en contrato para proteger al propietario.',
  },
  {
    keys: ['impuesto', 'sunat', '5%'],
    answer:
      'La renta de primera categoría (5%) puede pagarla el propietario directamente o delegarse con autorización.',
  },
];

const CONTEXT_GUIDES = {
  hub: {
    title: 'Asistente de herramientas',
    intro:
      'Te ayudo a elegir la mejor herramienta según tu objetivo: precio, contrato o descripción del aviso.',
    tips: [
      'Si quieres saber cuánto cobrar, usa la calculadora.',
      'Si tienes dudas legales, usa el analizador de contrato.',
      'Si vas a publicar en portales, usa el generador de descripciones.',
    ],
  },
  calculadora: {
    title: 'Asistente de calculadora',
    intro:
      'Te guío para estimar un precio referencial. Completa distrito, metraje y características del inmueble.',
    tips: [
      'Primero define el distrito real de la propiedad.',
      'Usa metraje útil aproximado para una mejor referencia.',
      'Al final te muestro cómo pasar de estimado a asesoría personalizada.',
    ],
  },
  contrato: {
    title: 'Asistente de contrato',
    intro:
      'Te ayudo a revisar puntos críticos del contrato antes de firmar o renovar.',
    tips: [
      'Incluye cláusulas de plazo, garantía y causales de resolución.',
      'Verifica penalidad por mora y responsabilidades de mantenimiento.',
      'Si tienes dudas, escala a revisión profesional por WhatsApp.',
    ],
  },
  descripciones: {
    title: 'Asistente de descripciones',
    intro:
      'Te ayudo a crear un texto atractivo para portales con enfoque en conversión.',
    tips: [
      'Describe ventajas concretas: ubicación, metraje y atributos diferenciales.',
      'Usa frases claras para el perfil de inquilino ideal.',
      'Evita texto genérico; destaca 2 o 3 beneficios reales.',
    ],
  },
};

function matchKnowledge(text) {
  const normalized = text.toLowerCase();
  const found = KB_RESPONSES.find((item) =>
    item.keys.some((key) => normalized.includes(key)),
  );
  return found?.answer || null;
}

function buildContextAnswer(context, text) {
  const msg = text.toLowerCase();

  if (context === 'calculadora' && (msg.includes('llenar') || msg.includes('completar'))) {
    const district = document.getElementById('district');
    if (district) {
      district.focus();
    }
    return 'Vamos paso a paso: 1) Distrito, 2) Metraje, 3) Dormitorios/baños, 4) Cochera y amoblado. Empieza por el distrito.';
  }

  if (context === 'contrato' && (msg.includes('pegar') || msg.includes('texto'))) {
    const area = document.getElementById('contract-text');
    if (area) {
      area.focus();
    }
    return 'Pega un extracto del contrato con cláusulas de pago, plazo, penalidades y resolución. Con eso tendrás un análisis más útil.';
  }

  if (context === 'descripciones' && (msg.includes('escribir') || msg.includes('descripcion'))) {
    const district = document.getElementById('district');
    if (district) {
      district.focus();
    }
    return 'Completa distrito, tipo de inmueble, metraje y atributos clave. Luego genero un texto listo para publicar.';
  }

  return null;
}

function appendMessage(list, role, text) {
  const item = document.createElement('div');
  item.className = `ai-msg ${role}`;
  item.textContent = text;
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
}

function createAssistant() {
  const context = document.body.dataset.toolContext || 'hub';
  const guide = CONTEXT_GUIDES[context] || CONTEXT_GUIDES.hub;

  const root = document.createElement('section');
  root.className = 'ai-assistant';
  root.innerHTML = `
    <button type="button" class="ai-toggle" aria-label="Abrir asistente">
      <span>Asistente IA</span>
    </button>
    <div class="ai-panel" aria-hidden="true">
      <div class="ai-head">
        <h3>${guide.title}</h3>
        <button type="button" class="ai-close" aria-label="Cerrar asistente">×</button>
      </div>
      <div class="ai-messages"></div>
      <form class="ai-form">
        <input type="text" name="question" placeholder="Escribe tu pregunta..." autocomplete="off" />
        <button type="submit">Enviar</button>
      </form>
    </div>
  `;

  document.body.appendChild(root);

  const toggle = root.querySelector('.ai-toggle');
  const panel = root.querySelector('.ai-panel');
  const close = root.querySelector('.ai-close');
  const form = root.querySelector('.ai-form');
  const input = root.querySelector('input[name="question"]');
  const messages = root.querySelector('.ai-messages');

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    setTimeout(() => input.focus(), 120);
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  appendMessage(messages, 'bot', guide.intro);
  appendMessage(messages, 'bot', `Tip: ${guide.tips[0]}`);

  toggle.addEventListener('click', openPanel);
  close.addEventListener('click', closePanel);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) {
      return;
    }

    appendMessage(messages, 'user', question);

    const contextAnswer = buildContextAnswer(context, question);
    if (contextAnswer) {
      appendMessage(messages, 'bot', contextAnswer);
      input.value = '';
      return;
    }

    const kbAnswer = matchKnowledge(question);
    if (kbAnswer) {
      appendMessage(messages, 'bot', kbAnswer);
    } else {
      appendMessage(
        messages,
        'bot',
        'Te ayudo con eso. Si quieres, escribe "completar herramienta" y te guío paso a paso según esta página.',
      );
    }

    input.value = '';
  });
}

document.addEventListener('DOMContentLoaded', createAssistant);
