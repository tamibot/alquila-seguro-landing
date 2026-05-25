const input = document.getElementById('blog-search');
const grid = document.getElementById('post-grid');
const empty = document.getElementById('search-empty');
const tagFilters = Array.from(document.querySelectorAll('[data-tag-filter]'));

let activeTag = 'all';
let cards = [];

function normalize(value) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function toTitleCase(value) {
  const clean = String(value || '').replace(/-/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function renderPostsFromManifest() {
  const manifest = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];
  if (!grid || !manifest.length) {
    return;
  }

  grid.innerHTML = manifest
    .map((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      const normalizedTags = tags.map((tag) => normalize(tag)).join(',');
      const tagPills = tags
        .slice(0, 3)
        .map((tag) => `<span>${toTitleCase(tag)}</span>`)
        .join('');

      return `
        <article class="post-card" data-search="${post.search || ''}" data-tags="${normalizedTags}">
          <img src="${post.image}" alt="${post.title}" loading="lazy" decoding="async">
          <div class="post-body">
            <span class="tag">${post.category || 'Guía'}</span>
            <h3>${post.title}</h3>
            <p>${post.excerpt || ''}</p>
            <a class="post-link" href="${post.url}">Leer artículo</a>
            <div class="post-tags">${tagPills}</div>
          </div>
        </article>
      `;
    })
    .join('\n');
}

function getCardTags(card) {
  return String(card.dataset.tags || '')
    .split(',')
    .map((item) => normalize(item.trim()))
    .filter(Boolean);
}

function applyFilters() {
  const query = normalize(input ? input.value.trim() : '');
  const targetTag = normalize(activeTag);
  let visible = 0;

  cards.forEach((card) => {
    const searchable = normalize(`${card.dataset.search || ''} ${card.textContent}`);
    const textMatch = !query || searchable.includes(query);
    const tags = getCardTags(card);
    const tagMatch = targetTag === 'all' || tags.includes(targetTag);
    const show = textMatch && tagMatch;
    card.style.display = show ? '' : 'none';
    if (show) {
      visible += 1;
    }
  });

  if (empty) {
    empty.hidden = visible !== 0;
  }
}

function init() {
  renderPostsFromManifest();
  cards = Array.from(document.querySelectorAll('.post-card'));

  const params = new URLSearchParams(window.location.search);
  const urlTagRaw = params.get('tag');
  const urlQueryRaw = params.get('q');

  if (urlQueryRaw && input) {
    input.value = urlQueryRaw;
  }

  if (urlTagRaw) {
    activeTag = normalize(urlTagRaw.replace(/\s+/g, '-'));
  }

  if (input) {
    input.addEventListener('input', () => {
      const next = new URL(window.location.href);
      if (input.value.trim()) {
        next.searchParams.set('q', input.value.trim());
      } else {
        next.searchParams.delete('q');
      }
      window.history.replaceState({}, '', next);
      applyFilters();
    });
  }

  tagFilters.forEach((button) => {
    button.addEventListener('click', () => {
      activeTag = button.dataset.tagFilter || 'all';
      tagFilters.forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      const next = new URL(window.location.href);
      if (activeTag !== 'all') {
        next.searchParams.set('tag', activeTag);
      } else {
        next.searchParams.delete('tag');
      }
      window.history.replaceState({}, '', next);
      applyFilters();
    });
  });

  const initialActiveButton = tagFilters.find(
    (button) => normalize(button.dataset.tagFilter || 'all') === activeTag
  );

  if (initialActiveButton) {
    tagFilters.forEach((button) => {
      button.classList.toggle('is-active', button === initialActiveButton);
    });
  } else {
    activeTag = 'all';
  }

  applyFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
