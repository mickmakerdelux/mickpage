// Global state
let placesData = [];
let config = {};
let categoryMap = {};

// Load config and data
async function loadAll() {
  try {
    const configRes = await fetch('config.json');
    config = await configRes.json();

    config.categories.forEach(cat => {
      categoryMap[cat.id] = cat;
    });

    updateSiteInfo();
    generateFilterButtons();

    const dataRes = await fetch('data.json');
    placesData = await dataRes.json();

    // Sort by date (newest first)
    placesData.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderCards(placesData);
    updateLastUpdated();
  } catch (error) {
    console.error('Failed to load:', error);
  }
}

// Update site title from config
function updateSiteInfo() {
  if (config.siteTitle) {
    document.getElementById('site-title').textContent = config.siteTitle;
    document.title = config.siteTitle;
  }
  if (config.siteSubtitle) {
    document.getElementById('site-subtitle').textContent = config.siteSubtitle;
  }
}

// Generate filter buttons
function generateFilterButtons() {
  const container = document.getElementById('filters');
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.category = 'all';
  allBtn.textContent = 'すべて';
  container.appendChild(allBtn);

  config.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat.id;
    btn.dataset.color = cat.color;
    btn.textContent = `${cat.emoji} ${cat.label}`;
    container.appendChild(btn);
  });

  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '';
        b.style.color = '';
      });
      e.target.classList.add('active');

      if (e.target.dataset.color) {
        e.target.style.background = e.target.dataset.color;
        e.target.style.color = '#fff';
      } else {
        e.target.style.background = '#1a1a2e';
        e.target.style.color = '#fff';
      }

      filterPlaces(e.target.dataset.category);
    });
  });
}

// Render cards
function renderCards(places) {
  const container = document.getElementById('cards');
  container.innerHTML = '';

  if (places.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-emoji">📭</div>
        <p>まだ記録がありません</p>
      </div>
    `;
    return;
  }

  places.forEach(place => {
    const cat = categoryMap[place.category] || { emoji: '📍', label: place.category, color: '#6b7280' };

    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => showModal(place);

    const imageHtml = place.image
      ? `<img src="images/${place.image}" alt="${place.name}">`
      : `<span class="card-emoji">${cat.emoji}</span>`;

    card.innerHTML = `
      <div class="card-image" style="background: linear-gradient(135deg, ${cat.color}88 0%, ${cat.color} 100%)">
        ${imageHtml}
      </div>
      <div class="card-body">
        <span class="card-category" style="background: ${cat.color}">${cat.label}</span>
        <h3 class="card-title">${place.name}</h3>
        <p class="card-date">${formatDate(place.date)}</p>
        ${place.memo ? `<p class="card-memo">${place.memo}</p>` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Filter places
function filterPlaces(category) {
  if (category === 'all') {
    renderCards(placesData);
  } else {
    const filtered = placesData.filter(p => p.category === category);
    renderCards(filtered);
  }
}

// Show modal
function showModal(place) {
  const modal = document.getElementById('modal');
  const cat = categoryMap[place.category] || { label: place.category, color: '#6b7280' };

  const badge = modal.querySelector('.category-badge');
  badge.textContent = cat.label;
  badge.style.background = cat.color;

  modal.querySelector('.place-name').textContent = place.name;
  modal.querySelector('.visit-date').textContent = formatDate(place.date);
  modal.querySelector('.place-memo').textContent = place.memo || '';
  modal.querySelector('.place-address').textContent = place.address || '';

  const imageContainer = modal.querySelector('.place-image');
  if (place.image) {
    imageContainer.innerHTML = `<img src="images/${place.image}" alt="${place.name}">`;
  } else {
    imageContainer.innerHTML = '';
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Update last updated date
function updateLastUpdated() {
  const dates = placesData.map(p => new Date(p.date));
  if (dates.length > 0) {
    const latest = new Date(Math.max(...dates));
    document.getElementById('last-updated').textContent = latest.toLocaleDateString('ja-JP');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAll();

  document.querySelector('.close-btn').addEventListener('click', hideModal);
  document.querySelector('.modal-overlay').addEventListener('click', hideModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
});
