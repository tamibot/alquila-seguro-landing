const form = document.getElementById('contract-form');
const text = document.getElementById('contract-text');
const summary = document.getElementById('contract-summary');
const points = document.getElementById('contract-points');
const cta = document.getElementById('contract-cta');

const checks = [
  { key: 'plazo', label: 'Plazo del contrato' },
  { key: 'penalidad', label: 'Penalidad por mora' },
  { key: 'garant', label: 'Garantía o depósito' },
  { key: 'resol', label: 'Causales de resolución' },
  { key: 'mantenimiento', label: 'Responsabilidad de mantenimiento' },
];

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const content = text.value.toLowerCase();
  const found = checks.filter((item) => content.includes(item.key));

  summary.textContent = `Se detectaron ${found.length} de ${checks.length} elementos clave en el texto analizado.`;
  points.innerHTML = '';

  checks.forEach((item) => {
    const li = document.createElement('li');
    const ok = content.includes(item.key);
    li.textContent = `${ok ? 'OK' : 'Revisar'}: ${item.label}`;
    points.appendChild(li);
  });

  const msg = encodeURIComponent(`Hola, analicé mi contrato en la herramienta de AlquilaSeguro y necesito una revisión profesional.`);
  cta.href = `https://wa.me/51912462976?text=${msg}`;
});
