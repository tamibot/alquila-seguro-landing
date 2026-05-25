(() => {
  'use strict';

  const normalizeTagForUrl = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');

  const tagContainers = Array.from(document.querySelectorAll('.article-tag-list'));
  tagContainers.forEach((container) => {
    const tags = Array.from(container.querySelectorAll('span'));
    tags.forEach((tag) => {
      const label = tag.textContent || '';
      const slug = normalizeTagForUrl(label);
      const link = document.createElement('a');
      link.className = 'article-tag-link';
      link.href = `./?tag=${encodeURIComponent(slug)}`;
      link.textContent = label;
      link.setAttribute('aria-label', `Filtrar por etiqueta ${label}`);
      tag.replaceWith(link);
    });
  });

  const shareLinks = Array.from(document.querySelectorAll('[data-share]'));
  if (!shareLinks.length) {
    return;
  }

  const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
  const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';

  const encodedUrl = encodeURIComponent(canonical);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title}. ${description}`.trim());

  shareLinks.forEach((link) => {
    const network = link.dataset.share;
    if (network === 'whatsapp') {
      link.href = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      return;
    }
    if (network === 'facebook') {
      link.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      return;
    }
    if (network === 'linkedin') {
      link.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    }
  });
})();
