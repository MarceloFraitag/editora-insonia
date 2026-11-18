/* Editora Insônia V6.3 — interações locais, sem pedidos ou pagamentos reais. */
(() => {
  'use strict';

  const catalog = Array.isArray(window.INSOMNIA_CATALOG) ? window.INSOMNIA_CATALOG : [];
  const byId = new Map(catalog.map((product) => [product.id, product]));
  // Mantém a chave da V5 para preservar os favoritos e a sacola existentes.
  const storageKey = 'editora-insonia-v5-demo';
  const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const state = { cart: {}, favorites: [], filter: 'todos', search: '' };
  let focusBeforeLayer = null;
  let activeLayer = null;
  let toastTimeout = null;

  const grid = $('#product-grid');
  const empty = $('#catalog-empty');
  const cartDrawer = $('#cart-drawer');
  const cartOverlay = $('#cart-overlay');
  const productModal = $('#product-modal');
  const checkoutModal = $('#checkout-modal');
  const modalOverlay = $('#modal-overlay');
  const toast = $('#toast');
  const menuToggle = $('.menu-toggle');
  const nav = $('#main-nav');

  // Recupera somente produtos e quantidades válidos do navegador.
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (saved && typeof saved === 'object') {
        if (saved.cart && typeof saved.cart === 'object' && !Array.isArray(saved.cart)) {
          for (const [id, quantity] of Object.entries(saved.cart)) {
            if (byId.get(id)?.purchasableInDemo && Number.isInteger(quantity) && quantity > 0) {
              state.cart[id] = Math.min(quantity, 99);
            }
          }
        }
        if (Array.isArray(saved.favorites)) {
          state.favorites = [...new Set(saved.favorites.filter((id) => byId.has(id)))];
        }
      }
    } catch (_) { /* Armazenamento indisponível: experiência segue em memória. */ }
  }

  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify({ cart: state.cart, favorites: state.favorites })); }
    catch (_) { /* Nada é enviado a servidores externos. */ }
  }

  function countItems() { return Object.values(state.cart).reduce((total, qty) => total + qty, 0); }
  function subtotal() {
    return Object.entries(state.cart).reduce((total, [id, qty]) => total + (byId.get(id)?.priceCents ?? 0) * qty, 0);
  }
  function formatPrice(cents) { return money.format(cents / 100); }
  function normalize(text) { return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  // Relaciona cada livro à frente e à carta revelada.
  function coverMarkup(product) {
    const cards = { game: ['moon', 'A Lua — Ricci'], love: ['death', 'A Morte — Dylan'], mystery: ['hanged', 'O Enforcado — Mason'] };
    const [card, label] = cards[product.artwork];
    const front = product.artwork === 'game' ? 'gargoyle-game.jpg' : 'tarot-back.jpg';
    return `<button class="tarot-flip" type="button" aria-label="Revelar ${label}" aria-pressed="false">
      <span class="tarot-inner"><span class="tarot-face ${product.artwork === 'game' ? 'is-book' : 'is-tarot'}"><img src="assets/${front}" alt="${product.artwork === 'game' ? 'Capa de Gargoyle Game' : 'Verso do baralho'}"></span>
      <span class="tarot-face tarot-reverse is-tarot"><img src="assets/tarot-${card}.jpg" alt="${label}"></span></span>
      <span class="tarot-hint">Revelar carta ↻</span></button>`;
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest('.tarot-flip');
    if (!card) return;
    const flipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(flipped));
  });

  function productCard(product) {
    const isFavorite = state.favorites.includes(product.id);
    const price = product.priceCents === null
      ? `<div class="product-price pending">Preço a confirmar</div>`
      : `<div class="product-price">${formatPrice(product.priceCents)}${product.priceIsExample ? '<small>Valor ilustrativo da V3</small>' : ''}</div>`;
    const primary = product.purchasableInDemo
      ? `<button class="button button-primary" type="button" data-action="add" data-id="${escape(product.id)}">Adicionar à sacola <span aria-hidden="true">↗</span></button>`
      : `<button class="button button-outline" type="button" data-action="details" data-id="${escape(product.id)}">Ver detalhes <span aria-hidden="true">→</span></button>`;
    return `<article class="product-card">
      <div class="product-art">
        <span class="product-tag ${product.purchasableInDemo ? 'product-tag--demo' : ''}">${product.purchasableInDemo ? 'SACOLA DEMO' : 'CADASTRO PENDENTE'}</span>
        <button class="product-favorite ${isFavorite ? 'is-saved' : ''}" type="button" data-action="favorite" data-id="${escape(product.id)}" aria-label="${isFavorite ? 'Remover' : 'Adicionar'} ${escape(product.title)} ${isFavorite ? 'dos' : 'aos'} favoritos" aria-pressed="${isFavorite}">${isFavorite ? '♥' : '♡'}</button>
        <div>${coverMarkup(product)}</div>
      </div>
      <div class="product-content"><p class="product-series">${escape(product.series)} · ${escape(product.volume)}</p>
        <h3>${escape(product.title)}</h3><p class="product-author">${escape(product.author)}</p>
        <div class="product-meta-row">${price}<span class="product-meta-note">${product.purchasableInDemo ? 'Livro físico · demonstração' : 'Informações comerciais pendentes'}</span></div>
        <div class="product-actions">${primary}<button class="details-button" type="button" data-action="details" data-id="${escape(product.id)}" aria-label="Ver ficha de ${escape(product.title)}">Ficha ↗</button></div>
      </div>
    </article>`;
  }

  // Aplica busca e filtro antes de reconstruir o catálogo.
  function renderProducts() {
    const search = normalize(state.search.trim());
    const filtered = catalog.filter((product) => {
      const filterOk = state.filter === 'todos' ||
        (state.filter === 'previs' && product.priceCents !== null) ||
        (state.filter === 'breve' && product.comingSoon) ||
        (state.filter === 'favoritos' && state.favorites.includes(product.id));
      return filterOk && (!search || normalize([product.title, product.author, product.series, product.category].join(' ')).includes(search));
    });
    grid.innerHTML = filtered.map(productCard).join('');
    empty.hidden = filtered.length !== 0;
    $('#catalog-feedback').textContent = `${filtered.length} ${filtered.length === 1 ? 'título encontrado' : 'títulos encontrados'} · livros físicos`;
    $('#all-count').textContent = String(catalog.length);
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const selected = button.dataset.filter === state.filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function renderHeader() {
    const count = countItems();
    $('.cart-count').textContent = String(count);
    $('#open-cart').setAttribute('aria-label', `Abrir sacola, ${count} ${count === 1 ? 'item' : 'itens'}`);
    const favoritesCount = $('.favorites-count');
    favoritesCount.textContent = String(state.favorites.length);
    favoritesCount.hidden = state.favorites.length === 0;
    $('#favorites-shortcut').setAttribute('aria-label', `Ver livros favoritos, ${state.favorites.length} salvos`);
  }

  function cartItemMarkup(product, qty) {
    return `<li class="drawer-item"><div class="drawer-item-art" aria-hidden="true">${coverMarkup(product)}</div>
      <div class="drawer-item-main"><h3>${escape(product.title)}</h3><p class="drawer-byline">${escape(product.author)} · Físico</p>
      <p class="drawer-item-price">${formatPrice(product.priceCents * qty)}</p>
      <div class="qty-row"><div class="quantity-controls" aria-label="Quantidade de ${escape(product.title)}">
      <button type="button" data-action="minus" data-id="${escape(product.id)}" aria-label="Diminuir quantidade de ${escape(product.title)}">−</button>
      <output aria-label="Quantidade">${qty}</output>
      <button type="button" data-action="plus" data-id="${escape(product.id)}" aria-label="Aumentar quantidade de ${escape(product.title)}" ${qty >= 99 ? 'disabled' : ''}>+</button>
      </div><button class="remove-item" type="button" data-action="remove" data-id="${escape(product.id)}">Remover</button></div></div></li>`;
  }

  // Atualiza a sacola de demonstração a partir do estado local.
  function renderCart() {
    const items = Object.entries(state.cart)
      .map(([id, quantity]) => ({ product: byId.get(id), quantity }))
      .filter(({ product }) => Boolean(product));
    $('#drawer-items').innerHTML = items.map(({ product, quantity }) => cartItemMarkup(product, quantity)).join('');
    $('#drawer-item-count').textContent = `(${countItems()})`;
    $('#cart-empty-state').hidden = items.length > 0;
    $('#drawer-footer').hidden = items.length === 0;
    $('#drawer-subtotal').textContent = formatPrice(subtotal());
  }

  function renderCheckout() {
    $('#checkout-items').innerHTML = Object.entries(state.cart).map(([id, qty]) => {
      const product = byId.get(id);
      if (!product) return '';
      return `<div class="checkout-item"><span>${escape(product.title)} (físico) × ${qty}</span><strong>${formatPrice(product.priceCents * qty)}</strong></div>`;
    }).join('');
    $('#checkout-subtotal').textContent = formatPrice(subtotal());
  }

  function renderAll() { renderHeader(); renderProducts(); renderCart(); renderCheckout(); }

  function announce(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.classList.remove('visible'); }, 3000);
  }

  function addItem(id) {
    const product = byId.get(id);
    if (!product?.purchasableInDemo || product.priceCents === null) return;
    const existing = state.cart[id] || 0;
    if (existing >= 99) { announce('Máximo de 99 unidades na demonstração.'); return; }
    state.cart[id] = existing + 1;
    saveState();
    renderAll();
    openCart();
    announce(`${product.title} foi adicionado à sacola demonstrativa.`);
  }

  function changeQty(id, change) {
    const product = byId.get(id);
    if (!product || !state.cart[id]) return;
    const next = Math.min(99, Math.max(0, state.cart[id] + change));
    if (next === 0) delete state.cart[id]; else state.cart[id] = next;
    saveState();
    renderHeader();
    renderCart();
    renderCheckout();
    const nextControl = $('#drawer-items').querySelector(`[data-action="${change < 0 ? 'minus' : 'plus'}"][data-id="${id}"]`);
    if (nextControl && !nextControl.disabled) nextControl.focus();
    else ($('#close-cart')).focus();
    announce(next === 0 ? `${product.title} removido da sacola.` : `Quantidade atualizada: ${next}.`);
  }

  function removeItem(id) {
    if (!state.cart[id]) return;
    const title = byId.get(id)?.title || 'Livro';
    delete state.cart[id];
    saveState();
    renderHeader(); renderCart(); renderCheckout();
    $('#close-cart').focus();
    announce(`${title} removido da sacola.`);
  }

  function toggleFavorite(id) {
    const product = byId.get(id);
    if (!product) return;
    const position = state.favorites.indexOf(id);
    if (position === -1) state.favorites.push(id);
    else state.favorites.splice(position, 1);
    const added = position === -1;
    saveState(); renderHeader(); renderProducts();
    const button = grid.querySelector(`[data-action="favorite"][data-id="${id}"]`);
    if (button) button.focus({ preventScroll: true });
    announce(`${product.title} ${added ? 'salvo nos' : 'removido dos'} favoritos.`);
  }

  function hideLayers({ restoreFocus = true } = {}) {
    cartDrawer.hidden = true;
    cartOverlay.hidden = true;
    productModal.hidden = true;
    checkoutModal.hidden = true;
    modalOverlay.hidden = true;
    document.body.classList.remove('is-locked');
    activeLayer = null;
    if (restoreFocus && focusBeforeLayer?.isConnected) focusBeforeLayer.focus({ preventScroll: true });
    if (restoreFocus) focusBeforeLayer = null;
  }

  // Abre a camada e direciona o foco para seu conteúdo.
  function showLayer(layer) {
    if (!activeLayer) focusBeforeLayer = document.activeElement;
    hideLayers({ restoreFocus: false });
    activeLayer = layer;
    layer.hidden = false;
    if (layer === cartDrawer) cartOverlay.hidden = false;
    else modalOverlay.hidden = false;
    document.body.classList.add('is-locked');
    const first = layer.querySelector('[data-close-modal], #close-cart');
    (first || layer).focus({ preventScroll: true });
  }

  function openCart() { renderCart(); showLayer(cartDrawer); }
  function openCheckout() {
    if (countItems() === 0) { announce('Adicione um livro antes de ver o resumo.'); return; }
    renderCheckout();
    showLayer(checkoutModal);
  }

  // Monta sinopse, temas e ficha com os dados do catálogo.
  function openDetails(id) {
    const product = byId.get(id);
    if (!product) return;
    const specs = [
      ['Formato', 'Livro físico'],
      ['Coleção', `${product.series} (${product.volume})`],
      ...(product.pages ? [['Páginas', product.pages]] : []),
      ...(product.size ? [['Dimensões', product.size]] : []),
      ...(product.launch ? [['Data informada na V3', product.launch]] : [])
    ];
    const buy = product.purchasableInDemo
      ? `<button type="button" class="button button-primary" data-action="add" data-id="${escape(product.id)}">Adicionar à sacola demo ↗</button>`
      : `<p class="modal-availability">Preço, estoque e disponibilidade aguardam confirmação da editora.</p>`;
    $('#product-modal-content').innerHTML = `<div class="modal-product-layout">
      <div class="modal-product-art"><div>${coverMarkup(product)}</div></div>
      <div class="modal-product-info"><p class="eyebrow">${escape(product.series)} · ${escape(product.volume)}</p>
      <h2 id="product-modal-title">${escape(product.title)}</h2><p class="product-author">por ${escape(product.author)}</p>
      ${product.tropes ? `<ul class="trope-list">${product.tropes.map(t => `<li>${escape(t)}</li>`).join('')}</ul>` : ''}<p class="modal-description">${escape(product.description)}</p><p class="modal-description-secondary">${escape(product.details)}</p>
      <dl class="modal-specs">${specs.map(([name, value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
      <div class="modal-buy-row"><div class="modal-price">${product.priceCents === null ? 'Preço a confirmar' : formatPrice(product.priceCents)}${product.priceIsExample ? '<small>Valor de exemplo da V3</small>' : ''}</div>${buy}</div>
</div></div>`;
    showLayer(productModal);
  }

  function setFilter(filter, scroll = false) {
    state.filter = filter;
    renderProducts();
    if (scroll) $('#catalogo').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const { action, id } = actionButton.dataset;
      if (action === 'add') addItem(id);
      else if (action === 'favorite') toggleFavorite(id);
      else if (action === 'details') openDetails(id);
      else if (action === 'minus') changeQty(id, -1);
      else if (action === 'plus') changeQty(id, 1);
      else if (action === 'remove') removeItem(id);
    }
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) setFilter(filterButton.dataset.filter);
    if (event.target.closest('.main-nav a')) closeMenu();
    if (event.target.closest('[data-close-modal]')) hideLayers();
  });

  $('#open-cart').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', () => hideLayers());
  $('#open-checkout').addEventListener('click', openCheckout);
  $('#empty-browse').addEventListener('click', () => {
    hideLayers(); $('#catalogo').scrollIntoView({ behavior: 'smooth' });
  });
  $('#back-to-cart').addEventListener('click', openCart);
  $('#favorites-shortcut').addEventListener('click', () => setFilter('favoritos', true));
  $('#search-books').addEventListener('input', (event) => { state.search = event.target.value; renderProducts(); });
  $('#reset-filters').addEventListener('click', () => {
    state.search = ''; $('#search-books').value = ''; setFilter('todos');
  });
  cartOverlay.addEventListener('click', () => hideLayers());
  modalOverlay.addEventListener('click', () => hideLayers());
  menuToggle.addEventListener('click', () => {
    const isOpen = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  // Impede foco atrás do diálogo com Tab e permite fechar com Escape.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (activeLayer) hideLayers();
      else if (nav.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); }
      return;
    }
    if (event.key !== 'Tab' || !activeLayer) return;
    const focusable = [...activeLayer.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) { event.preventDefault(); activeLayer.focus(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  const themeToggle = $('#theme-toggle');
  const themeStorageKey = 'editora-insonia-theme';
  let lightTheme = false;
  try { lightTheme = localStorage.getItem(themeStorageKey) === 'light'; }
  catch { /* A preferência continua disponível nesta página. */ }

  function applyTheme() {
    document.documentElement.classList.toggle('theme-light', lightTheme);
    themeToggle.setAttribute('aria-pressed', String(lightTheme));
    $('meta[name="theme-color"]').content = lightTheme ? '#f0dbe8' : '#180a1b';
  }

  applyTheme();
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    lightTheme = !lightTheme;
    applyTheme();
    try { localStorage.setItem(themeStorageKey, lightTheme ? 'light' : 'dark'); }
    catch { /* Alguns navegadores bloqueiam o armazenamento local. */ }
  });

  loadState();
  renderAll();
})();
