const CAT_ICONS  = {blog:'article', note:'notes', project:'code'};
const CAT_LABELS = {blog:'Blog Post', note:'Note', project:'Project'};

let ARTICLES = [];

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cardHTML(a) {
  const tags = a.tags.slice(0, 4).map(t => `<span class="tag-chip">#${t}</span>`).join('');
  return `<div class="article-card" onclick="openArticle('${a.id}')">
    <div class="article-card-header">
      <div class="article-card-icon ${a.category}">
        <span class="material-symbols-outlined" style="font-size:1rem;">${CAT_ICONS[a.category]}</span>
      </div>
      <span class="article-card-cat">${CAT_LABELS[a.category]}</span>
    </div>
    <div class="article-card-title">${esc(a.title)}</div>
    ${a.excerpt ? `<div class="article-card-excerpt">${esc(a.excerpt)}</div>` : ''}
    ${tags ? `<div class="article-card-tags">${tags}</div>` : ''}
  </div>`;
}

function renderGrid(items) {
  document.getElementById('grid-all').innerHTML = items.length
    ? items.map(cardHTML).join('')
    : `<div class="empty-state" style="grid-column:1/-1;">
        <span class="material-symbols-outlined">search_off</span>
        No results found
       </div>`;
}

function searchHome(query) {
  const q = query.toLowerCase().trim();
  const matches = q
    ? ARTICLES.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      )
    : ARTICLES;
  renderGrid(matches);
}

function switchView(id, pushState = true) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + id).classList.add('active');
  document.getElementById('reader-back').classList.remove('is-floating');
  window.scrollTo(0, 0);
  if (pushState && id === 'home') {
    history.pushState(null, '', location.pathname);
  }
}

async function openArticle(id, pushState = true) {
  const a = ARTICLES.find(x => x.id === id);
  if (!a) return;

  document.getElementById('reader-cat').textContent   = CAT_LABELS[a.category];
  document.getElementById('reader-title').textContent = a.title;
  document.getElementById('reader-tags').innerHTML    = a.tags.map(t => `<span class="tag-chip">#${t}</span>`).join('');
  document.getElementById('reader-body').innerHTML    = '<p style="color:var(--outline)">Loading&hellip;</p>';
  document.getElementById('reader-back').onclick      = () => switchView('home');
  switchView('reader', false);

  if (pushState) {
    history.pushState({ post: id }, a.title, '?post=' + id);
  }
  document.title = a.title;

  const res  = await fetch('posts/' + id + '.html');
  const html = await res.text();
  document.getElementById('reader-body').innerHTML = html;
  document.querySelectorAll('#reader-body pre code').forEach(el => hljs.highlightElement(el));
}

window.addEventListener('popstate', () => {
  const id = new URLSearchParams(location.search).get('post');
  if (id) {
    openArticle(id, false);
  } else {
    document.title = 'My Notes';
    switchView('home', false);
  }
});

document.querySelector('[data-view="home"]').addEventListener('click', () => switchView('home'));

(function () {
  const btn = document.getElementById('reader-back');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const readerActive = document.getElementById('view-reader').classList.contains('active');
      if (readerActive) {
        btn.classList.toggle('is-floating', window.scrollY > 60);
      } else {
        btn.classList.remove('is-floating');
      }
      ticking = false;
    });
  }, { passive: true });
})();

fetch('posts/index.json')
  .then(r => r.json())
  .then(data => {
    ARTICLES = data;
    renderGrid(ARTICLES);
    const id = new URLSearchParams(location.search).get('post');
    if (id) openArticle(id, false);
  });
