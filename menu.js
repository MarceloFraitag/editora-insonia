/* Menu do topo: no hover cada letra gira em 3D e revela o nome sombrio do item. */
(() => {
  'use strict';
  const trocas = {
    'Início': 'Meia-noite',
    'Catálogo': 'Grimório',
    'Nosso universo': 'Nosso abismo',
    'Informações': 'Segredos',
    'Favoritos': 'Obsessões',
    'Sacola': 'Oferendas'
  };

  function letras(texto, classe) {
    const linha = document.createElement('span');
    linha.className = classe;
    [...texto].forEach((c, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c === ' ' ? ' ' : c;
      linha.appendChild(s);
    });
    return linha;
  }

  function montar(alvo, host) {
    const original = alvo.textContent.trim();
    const sombrio = trocas[original];
    if (!sombrio || alvo.dataset.troca) return;
    alvo.dataset.troca = '1';
    const caixa = document.createElement('span');
    caixa.className = 'troca';
    caixa.setAttribute('aria-hidden', 'true');
    caixa.append(letras(original, 'troca-a'), letras(sombrio, 'troca-b'));
    const leitor = document.createElement('span');
    leitor.className = 'sr-only';
    leitor.textContent = original;
    alvo.textContent = '';
    alvo.append(caixa, leitor);
    host.classList.add('troca-host');
  }

  document.querySelectorAll('.main-nav a').forEach((a) => montar(a, a));
  document.querySelectorAll('.header-action').forEach((b) => {
    const t = b.querySelector('.header-action-text');
    if (t) montar(t, b);
  });
})();
