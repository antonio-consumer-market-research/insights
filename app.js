/* ============================================
   RESEARCH LIBRARY v2 — app.js
   Categorías desplegables · Search · Filters
   ============================================ */

(function () {
  'use strict';

  // ---- Config: categorías en orden ----
  const CATEGORIES = ['Banking', 'Payments', 'Consumers', 'Software', 'Peru', 'Producto'];

  // ---- DOM refs ----
  const $search     = document.getElementById('search');
  const $typeFilter  = document.getElementById('filterType');
  const $yearFilter  = document.getElementById('filterYear');
  const $catFilter   = document.getElementById('filterCategory');
  const $doneWrap    = document.getElementById('wrapDone');
  const $pendWrap    = document.getElementById('wrapPending');
  const $countDone   = document.getElementById('countDone');
  const $countPend   = document.getElementById('countPending');
  const $toast       = document.getElementById('toast');

  let allData = [];

  // ---- Fetch data ----
  fetch('data.json')
    .then(r => r.json())
    .then(data => {
      allData = data;
      populateYearFilter(data);
      render();
    })
    .catch(err => {
      console.error('Error loading data.json:', err);
      $doneWrap.innerHTML = '<p class="empty">No se pudo cargar la información.</p>';
    });

  // ---- Populate year filter ----
  function populateYearFilter(data) {
    const years = [...new Set(data.map(d => d.date.slice(0, 4)))].sort().reverse();
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      $yearFilter.appendChild(opt);
    });
  }

  // ---- Main render ----
  function render() {
    const query = $search.value.toLowerCase().trim();
    const type  = $typeFilter.value;
    const year  = $yearFilter.value;
    const cat   = $catFilter.value;

    // Filter
    const filtered = allData.filter(item => {
      const matchSearch = !query
        || item.title.toLowerCase().includes(query)
        || item.summary.toLowerCase().includes(query)
        || item.tags.some(t => t.toLowerCase().includes(query));
      const matchType = !type || item.type === type;
      const matchYear = !year || item.date.startsWith(year);
      const matchCat  = !cat  || item.category === cat;
      return matchSearch && matchType && matchYear && matchCat;
    });

    // Sort by date desc
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    const done    = filtered.filter(i => i.status === 'done');
    const pending = filtered.filter(i => i.status === 'pending');

    // Counters
    $countDone.textContent = `${done.length} terminada${done.length !== 1 ? 's' : ''}`;
    $countPend.textContent = `${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`;

    // Render by category
    $doneWrap.innerHTML  = renderByCategory(done, 'done');
    $pendWrap.innerHTML  = renderByCategory(pending, 'pending');
  }

  // ---- Render grouped by category ----
  function renderByCategory(items, statusType) {
    let html = '';
    let hasAny = false;

    CATEGORIES.forEach(cat => {
      const catItems = items.filter(i => i.category === cat);
      if (catItems.length === 0) return;

      hasAny = true;
      const isPending = statusType === 'pending';
      const catId = `cat-${statusType}-${cat.toLowerCase().replace(/\s/g, '')}`;

      html += `
        <div class="category ${isPending ? 'category--pending' : ''}">
          <div class="category__header" onclick="toggleCategory('${catId}')" role="button" tabindex="0" aria-expanded="false" aria-controls="${catId}">
            <span class="category__name">
              ${cat}
              <span class="category__count">(${catItems.length})</span>
            </span>
            <svg class="category__chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="category__body" id="${catId}">
            <div class="category__grid">
              ${catItems.map(i => cardHTML(i)).join('')}
            </div>
          </div>
        </div>`;
    });

    // Items without matching category
    const uncategorized = items.filter(i => !CATEGORIES.includes(i.category));
    if (uncategorized.length > 0) {
      hasAny = true;
      const catId = `cat-${statusType}-other`;
      html += `
        <div class="category ${statusType === 'pending' ? 'category--pending' : ''}">
          <div class="category__header" onclick="toggleCategory('${catId}')" role="button" tabindex="0" aria-expanded="false" aria-controls="${catId}">
            <span class="category__name">
              Otras
              <span class="category__count">(${uncategorized.length})</span>
            </span>
            <svg class="category__chevron" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="category__body" id="${catId}">
            <div class="category__grid">
              ${uncategorized.map(i => cardHTML(i)).join('')}
            </div>
          </div>
        </div>`;
    }

    if (!hasAny) {
      html = '<p class="empty">No se encontraron investigaciones en esta sección.</p>';
    }

    return html;
  }

  // ---- Card HTML ----
  function cardHTML(item) {
    const isPending = item.status === 'pending';
    const statusClass = isPending ? 'pending' : 'done';
    const statusLabel = isPending ? 'Pendiente' : 'Terminada';

    const tagsMarkup = item.tags.map(t => `<span class="tag">${t}</span>`).join('');

    const hasHighlights = item.highlights && item.highlights.length > 0;
    const highlightsMarkup = hasHighlights
      ? `<div class="card__details" id="details-${item.id}">
           <ul class="card__highlights">
             ${item.highlights.map(h => `<li>${h}</li>`).join('')}
           </ul>
         </div>`
      : '';

    const detBtn = hasHighlights
      ? `<button class="btn btn--ghost" onclick="toggleDetails(${item.id})" aria-expanded="false" aria-controls="details-${item.id}">Ver detalles</button>`
      : '';

    const actionsMarkup = isPending
      ? detBtn
      : `<a href="${item.url}" target="_blank" rel="noopener" class="btn btn--primary">
           <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
           Ver presentación
         </a>
         <button class="btn btn--secondary" onclick="copyLink('${item.url}')">
           <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
           Copiar link
         </button>
         ${detBtn}`;

    return `
      <article class="card ${isPending ? 'card--pending' : ''}" role="region" aria-label="${item.title}">
        <div class="card__top">
          <h3 class="card__title">${item.title}</h3>
          <span class="card__status card__status--${statusClass}">${statusLabel}</span>
        </div>
        <div class="card__meta">
          <span>${item.date}</span>
          <span>·</span>
          <span>${item.type}</span>
        </div>
        <div class="card__tags">${tagsMarkup}</div>
        <p class="card__summary">${item.summary}</p>
        <div class="card__actions">${actionsMarkup}</div>
        ${highlightsMarkup}
      </article>`;
  }

  // ---- Toggle category accordion ----
  window.toggleCategory = function (id) {
    const body = document.getElementById(id);
    if (!body) return;
    const header = body.previousElementSibling;
    const isOpen = body.classList.toggle('open');
    header.classList.toggle('active', isOpen);
    header.setAttribute('aria-expanded', isOpen);
  };

  // ---- Toggle card details ----
  window.toggleDetails = function (id) {
    const el = document.getElementById(`details-${id}`);
    if (!el) return;
    const isOpen = el.classList.toggle('open');
    const btn = el.closest('.card').querySelector('.btn--ghost');
    if (btn) {
      btn.setAttribute('aria-expanded', isOpen);
      btn.textContent = isOpen ? 'Ocultar detalles' : 'Ver detalles';
    }
  };

  // ---- Copy link ----
  window.copyLink = function (url) {
    navigator.clipboard.writeText(url).then(() => {
      $toast.textContent = '✓ Link copiado al portapapeles';
      $toast.classList.add('show');
      setTimeout(() => $toast.classList.remove('show'), 2000);
    }).catch(() => {
      prompt('Copia este link:', url);
    });
  };

  // ---- Event listeners ----
  $search.addEventListener('input', render);
  $typeFilter.addEventListener('change', render);
  $yearFilter.addEventListener('change', render);
  $catFilter.addEventListener('change', render);

})();
