const form = document.getElementById('copy-form');
const result = document.getElementById('copy-result');
const cta = document.getElementById('copy-cta');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const district = document.getElementById('district').value.trim();
  const type = document.getElementById('type').value.trim();
  const size = document.getElementById('size').value.trim();
  const highlights = document.getElementById('highlights').value.trim();

  const text = `Alquila ${type} en ${district}, de ${size}, ideal para quienes buscan vivir con comodidad y conectividad. La propiedad destaca por ${highlights}. Excelente opción para mudarte rápido con condiciones claras y buen entorno.`;
  result.textContent = text;

  const msg = encodeURIComponent(`Hola, ya generé una descripción en la herramienta de AlquilaSeguro y quiero mejorarla para publicar mi propiedad.`);
  cta.href = `https://wa.me/51912462976?text=${msg}`;
});
