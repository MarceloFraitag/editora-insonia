/* Cards do catálogo: a carta inclina em 3D seguindo o mouse e o brilho acompanha o ponteiro. */
(() => {
  'use strict';
  const fino = matchMedia('(hover: hover) and (pointer: fine)');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const grade = document.getElementById('product-grid');
  if (!grade) return;

  let atual = null;
  grade.addEventListener('pointermove', (e) => {
    if (!fino.matches) return;
    const card = e.target.closest('.product-card');
    if (!card) return;
    const rc = card.getBoundingClientRect();
    card.style.setProperty('--brilho-x', `${e.clientX - rc.left}px`);
    card.style.setProperty('--brilho-y', `${e.clientY - rc.top}px`);

    const arte = e.target.closest('.product-art');
    const carta = card.querySelector('.tarot-flip');
    if (!carta) return;
    if (!arte) { soltar(carta); return; }
    const ra = arte.getBoundingClientRect();
    const nx = (e.clientX - ra.left) / ra.width - 0.5;   // -0.5 a 0.5
    const ny = (e.clientY - ra.top) / ra.height - 0.5;
    carta.classList.add('inclinando');
    carta.style.setProperty('--ry', `${(nx * 16).toFixed(2)}deg`);
    carta.style.setProperty('--rx', `${(-ny * 12).toFixed(2)}deg`);
    carta.style.setProperty('--reflexo', `${(100 - (nx + 0.5) * 100).toFixed(1)}%`);
    if (atual && atual !== carta) soltar(atual);
    atual = carta;
  });

  function soltar(carta) {
    carta.classList.remove('inclinando');
    carta.style.setProperty('--rx', '0deg');
    carta.style.setProperty('--ry', '0deg');
    carta.style.setProperty('--reflexo', '120%');
  }
  grade.addEventListener('pointerleave', () => { if (atual) soltar(atual); atual = null; });
  grade.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.product-card');
    if (card && !card.contains(e.relatedTarget)) {
      const carta = card.querySelector('.tarot-flip');
      if (carta) soltar(carta);
    }
  });
})();
