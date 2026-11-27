/* Interações do catálogo */
(() => {
  'use strict';

  const catalog = Array.isArray(window.INSOMNIA_CATALOG) ? window.INSOMNIA_CATALOG : [];
  const byId = new Map(catalog.map((product) => [product.id, product]));
  // Chave da V5 para manter os dados salvos
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
  const drawerItems = $('#drawer-items');
  const cartDrawer = $('#cart-drawer');
  const cartOverlay = $('#cart-overlay');
  const productModal = $('#product-modal');
  const checkoutModal = $('#checkout-modal');
  const modalOverlay = $('#modal-overlay');
  const toast = $('#toast');
  const menuToggle = $('.menu-toggle');
  const nav = $('#main-nav');

  // Sacola e favoritos salvos
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
    } catch (_) { /* Segue em memória */ }
  }

  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify({ cart: state.cart, favorites: state.favorites })); }
    catch (_) { /* Segue em memória */ }
  }

  function countItems() { return Object.values(state.cart).reduce((total, qty) => total + qty, 0); }
  function subtotal() {
    return Object.entries(state.cart).reduce((total, [id, qty]) => total + (byId.get(id)?.priceCents ?? 0) * qty, 0);
  }
  function formatPrice(cents) { return money.format(cents / 100); }
  function normalize(text) { return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

  function coverFrontMarkup(isGame, alt) {
    // Reutiliza a imagem carregada pelo Hero, mantendo o JPG original como alternativa.
    return isGame
      ? `<picture><source srcset="assets/gargoyle-game.webp" type="image/webp"><img src="assets/gargoyle-game.jpg" width="1890" height="2717" alt="${alt}" loading="lazy"></picture>`
      : `<img src="assets/tarot-back.jpg" alt="${alt}">`;
  }

  // Carta de cada livro
  function coverMarkup(product) {
    const cards = { game: ['moon', 'A Lua — Ricci'], love: ['death', 'A Morte — Dylan'], mystery: ['hanged', 'O Enforcado — Mason'] };
    const [card, label] = cards[product.artwork];
    const isGame = product.artwork === 'game';
    const front = coverFrontMarkup(isGame, isGame ? 'Capa de Gargoyle Game' : 'Verso do baralho');
    return `<button class="tarot-flip" type="button" aria-label="Revelar ${label}" aria-pressed="false">
      <span class="tarot-inner"><span class="tarot-face ${isGame ? 'is-book' : 'is-tarot'}">${front}</span>
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
      : `<div class="product-price">${formatPrice(product.priceCents)}${product.priceIsExample ? '<small>Preço ilustrativo</small>' : ''}</div>`;
    const buy = product.purchasableInDemo
      ? `<button class="button button-primary" type="button" data-action="add" data-id="${escape(product.id)}">Adicionar à sacola <span aria-hidden="true">↗</span></button>`
      : '';
    const detailsClass = buy ? 'details-button' : 'button button-outline';
    return `<article class="product-card">
      <div class="product-art">
        <span class="product-tag ${product.purchasableInDemo ? 'product-tag--demo' : ''}">${product.purchasableInDemo ? 'Sacola demonstrativa' : 'Aguardando chegada'}</span>
        <button class="product-favorite ${isFavorite ? 'is-saved' : ''}" type="button" data-action="favorite" data-id="${escape(product.id)}" aria-label="${isFavorite ? 'Remover' : 'Adicionar'} ${escape(product.title)} ${isFavorite ? 'dos' : 'aos'} favoritos" aria-pressed="${isFavorite}">${isFavorite ? '♥' : '♡'}</button>
        <div>${coverMarkup(product)}</div>
      </div>
      <div class="product-content"><p class="product-series">${escape(product.series)} · ${escape(product.volume)}</p>
        <h3>${escape(product.title)}</h3><p class="product-author">${escape(product.author)}</p>
        <div class="product-meta-row">${price}<span class="product-meta-note">Livro físico</span></div>
        <div class="product-actions${buy ? '' : ' product-actions--single'}">${buy}<button class="${detailsClass}" type="button" data-action="details" data-id="${escape(product.id)}" aria-label="Ver ficha de ${escape(product.title)}" aria-haspopup="dialog">${buy ? 'Ficha' : 'Ver ficha'} <span aria-hidden="true">↗</span></button></div>
      </div>
    </article>`;
  }

  // Busca e filtros
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
    const thumbnail = product.artwork === 'game'
      ? coverFrontMarkup(true, '')
      : '<img src="assets/tarot-back.jpg" width="680" height="1135" alt="">';
    return `<li class="drawer-item" data-id="${escape(product.id)}"><div class="drawer-item-art">${thumbnail}</div>
      <div class="drawer-item-main"><h3>${escape(product.title)}</h3><p class="drawer-byline">${escape(product.author)} · Físico</p>
      <p class="drawer-item-price">${formatPrice(product.priceCents * qty)}</p>
      <div class="qty-row"><div class="quantity-controls" aria-label="Quantidade de ${escape(product.title)}">
      <button type="button" data-action="minus" data-id="${escape(product.id)}" aria-label="Diminuir quantidade de ${escape(product.title)}">−</button>
      <output aria-label="Quantidade">${qty}</output>
      <button type="button" data-action="plus" data-id="${escape(product.id)}" aria-label="Aumentar quantidade de ${escape(product.title)}" ${qty >= 99 ? 'disabled' : ''}>+</button>
      </div><button class="remove-item" type="button" data-action="remove" data-id="${escape(product.id)}">Remover</button></div></div></li>`;
  }

  // Sacola
  function renderCart() {
    const items = Object.entries(state.cart)
      .map(([id, quantity]) => ({ product: byId.get(id), quantity }))
      .filter(({ product }) => Boolean(product));
    drawerItems.innerHTML = items.map(({ product, quantity }) => cartItemMarkup(product, quantity)).join('');
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

  function announce(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.classList.remove('visible'); }, 3000);
  }

  function addItem(id, trigger) {
    const product = byId.get(id);
    if (!product?.purchasableInDemo || product.priceCents === null) return;
    const existing = state.cart[id] || 0;
    if (existing >= 99) { announce('Máximo de 99 unidades na demonstração.'); return; }
    state.cart[id] = existing + 1;
    saveState();
    // O catálogo fica no DOM para que o botão de origem receba o foco ao fechar.
    renderHeader();
    openCart(trigger);
    announce(`${product.title} foi adicionado à sacola demonstrativa.`);
  }

  function changeQty(id, change) {
    const product = byId.get(id);
    if (!product || !state.cart[id]) return;
    const next = Math.min(99, Math.max(0, state.cart[id] + change));
    if (next === 0) { removeItem(id); return; }
    state.cart[id] = next;
    saveState();
    renderHeader();
    renderCart();
    // Ao atingir o limite, mantém o foco na mesma linha, no botão ainda disponível.
    const quantityAction = change > 0 && next < 99 ? 'plus' : 'minus';
    drawerItems.querySelector(`[data-action="${quantityAction}"][data-id="${CSS.escape(id)}"]`).focus();
    announce(`Quantidade atualizada: ${next}.`);
  }

  function removeItem(id) {
    if (!state.cart[id]) return;
    const title = byId.get(id)?.title || 'Livro';
    const index = [...drawerItems.children].findIndex(item => item.dataset.id === id);
    delete state.cart[id];
    saveState();
    renderHeader(); renderCart();
    const nextItem = drawerItems.children[index] || drawerItems.lastElementChild;
    (nextItem?.querySelector('.remove-item') || $('#empty-browse')).focus();
    announce(`${title} removido da sacola.`);
  }

  function toggleFavorite(id, trigger) {
    const product = byId.get(id);
    if (!product) return;
    const position = state.favorites.indexOf(id);
    const index = [...grid.querySelectorAll('.product-favorite')].indexOf(trigger);
    if (position === -1) state.favorites.push(id);
    else state.favorites.splice(position, 1);
    const added = position === -1;
    saveState(); renderHeader(); renderProducts();
    const sameBook = grid.querySelector(`[data-action="favorite"][data-id="${CSS.escape(id)}"]`);
    const remaining = grid.querySelectorAll('.product-favorite');
    (sameBook || remaining[index] || remaining[remaining.length - 1] || $('#reset-filters')).focus();
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
    if (restoreFocus) {
      const target = focusBeforeLayer?.isConnected && !focusBeforeLayer.closest('[hidden]')
        ? focusBeforeLayer : $('#open-cart');
      focusBeforeLayer = null;
      target.focus();
    }
  }

  // A primeira origem continua válida nas transições entre ficha, sacola e resumo.
  function showLayer(layer, trigger = document.activeElement) {
    if (!activeLayer) focusBeforeLayer = trigger;
    hideLayers({ restoreFocus: false });
    activeLayer = layer;
    layer.hidden = false;
    if (layer === cartDrawer) cartOverlay.hidden = false;
    else modalOverlay.hidden = false;
    document.body.classList.add('is-locked');
    const first = layer.querySelector('[data-close-modal], #close-cart');
    (first || layer).focus({ preventScroll: true });
  }

  function openCart(trigger) { renderCart(); showLayer(cartDrawer, trigger); }
  function openCheckout() {
    if (countItems() === 0) { announce('Adicione um livro antes de ver o resumo.'); return; }
    renderCheckout();
    showLayer(checkoutModal);
  }

  // Ficha do livro
  function openDetails(id, trigger) {
    const product = byId.get(id);
    if (!product) return;
    const specs = [
      ['Formato', 'Livro físico'],
      ['Coleção', `${product.series} (${product.volume})`],
      ...(product.pages ? [['Páginas', product.pages]] : []),
      ...(product.size ? [['Dimensões', product.size]] : []),
      ...(product.launch ? [['Data informada na prévia', product.launch]] : [])
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
      <div class="modal-buy-row">${product.priceCents === null ? '' : `<div class="modal-price">${formatPrice(product.priceCents)}${product.priceIsExample ? '<small>Preço ilustrativo</small>' : ''}</div>`}${buy}</div>
</div></div>`;
    showLayer(productModal, trigger);
  }

  function setFilter(filter, focusFilter = false) {
    state.filter = filter;
    renderProducts();
    if (focusFilter) $('[data-filter].is-active').focus();
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
      if (action === 'add') addItem(id, actionButton);
      else if (action === 'favorite') toggleFavorite(id, actionButton);
      else if (action === 'details') openDetails(id, actionButton);
      else if (action === 'minus') changeQty(id, -1);
      else if (action === 'plus') changeQty(id, 1);
      else if (action === 'remove') removeItem(id);
    }
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) setFilter(filterButton.dataset.filter);
    if (event.target.closest('.main-nav a')) closeMenu();
    if (event.target.closest('[data-close-modal]')) hideLayers();
  });

  $('#open-cart').addEventListener('click', (event) => openCart(event.currentTarget));
  $('#close-cart').addEventListener('click', () => hideLayers());
  $('#open-checkout').addEventListener('click', openCheckout);
  $('#empty-browse').addEventListener('click', () => {
    hideLayers({ restoreFocus: false });
    focusBeforeLayer = null;
    $('#catalog-title').focus();
  });
  $('#back-to-cart').addEventListener('click', () => {
    openCart();
    $('#open-checkout').focus();
  });
  $('#favorites-shortcut').addEventListener('click', () => setFilter('favoritos', true));
  $('#search-books').addEventListener('input', (event) => { state.search = event.target.value; renderProducts(); });
  $('#reset-filters').addEventListener('click', () => {
    state.search = ''; $('#search-books').value = ''; setFilter('todos');
    $('[data-filter="todos"]').focus();
  });
  cartOverlay.addEventListener('click', () => hideLayers());
  modalOverlay.addEventListener('click', () => hideLayers());
  menuToggle.addEventListener('click', () => {
    const isOpen = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  // Tab e Escape nos diálogos
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

  // Tema claro e escuro
  const themeToggle = $('#theme-toggle');
  const mobileHeader = matchMedia('(max-width: 900px)');
  const themeHome = themeToggle.previousElementSibling;
  const headerActions = $('.header-actions');

  function placeThemeToggle() {
    // Move o mesmo controle para manter seus eventos e seu foco ao mudar a largura.
    const hadFocus = document.activeElement === themeToggle;
    if (mobileHeader.matches) headerActions.append(themeToggle);
    else themeHome.after(themeToggle);
    if (hadFocus) themeToggle.focus({ preventScroll: true });
  }
  const themeStorageKey = 'editora-insonia-theme';
  let lightTheme = false;
  try { lightTheme = localStorage.getItem(themeStorageKey) === 'light'; }
  catch { /* Usa o tema padrão */ }

  function applyTheme() {
    document.documentElement.classList.toggle('theme-light', lightTheme);
    themeToggle.setAttribute('aria-pressed', String(lightTheme));
    $('meta[name="theme-color"]').content = lightTheme ? '#f0dbe8' : '#180a1b';
  }

  applyTheme();
  placeThemeToggle();
  mobileHeader.addEventListener('change', placeThemeToggle);
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    lightTheme = !lightTheme;
    applyTheme();
    try { localStorage.setItem(themeStorageKey, lightTheme ? 'light' : 'dark'); }
    catch { /* Mantém o tema nesta página */ }
  });

  loadState();
  renderHeader();
  renderProducts();
})();
