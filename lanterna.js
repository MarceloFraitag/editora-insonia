/* Lanterna do Hero, recuperada de ViegasCode (10e3b35, efeitos.js). */
(() => {
  'use strict';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);

  // ---------- 1. Lanterna: o banner escurece e o ponteiro ilumina em volta ----------
  const hero = $('.hero');
  if (hero) {
    const luz = document.createElement('div');
    luz.className = 'lanterna';
    luz.setAttribute('aria-hidden', 'true');
    // O banner oficial já não usa a antiga camada de granulação.
    hero.querySelector('.hero-backdrop')?.after(luz);
    let alvoX = 0.36, alvoY = 0.46, x = alvoX, y = alvoY, ativa = false;
    const mover = (cx, cy) => {
      const r = hero.getBoundingClientRect();
      alvoX = (cx - r.left) / r.width; alvoY = (cy - r.top) / r.height;
      ativa = true;
    };
    hero.addEventListener('pointermove', (e) => mover(e.clientX, e.clientY));
    hero.addEventListener('pointerdown', (e) => mover(e.clientX, e.clientY));
    hero.addEventListener('pointerleave', () => { alvoX = 0.36; alvoY = 0.46; ativa = false; });
    let antes = performance.now();
    const passo = (agora) => {
      const dt = Math.min((agora - antes) / 1000, 0.05); antes = agora;
      const k = calmo ? 1 : 1 - Math.pow(0.002, dt);
      x += (alvoX - x) * k; y += (alvoY - y) * k;
      // chama da vela: o raio treme um pouco
      const t = agora / 1000;
      const tremor = calmo ? 0 : Math.sin(t * 7.3) * 5 + Math.sin(t * 13.1) * 3 + Math.sin(t * 2.1) * 6;
      luz.style.setProperty('--lx', `${(x * 100).toFixed(2)}%`);
      luz.style.setProperty('--ly', `${(y * 100).toFixed(2)}%`);
      luz.style.setProperty('--lr', `${(ativa ? 250 : 330) + tremor}px`);
      if (visivel) requestAnimationFrame(passo); else rodandoLuz = false;
    };
    let visivel = true, rodandoLuz = false;
    const iniciarLuz = () => { if (!rodandoLuz) { rodandoLuz = true; antes = performance.now(); requestAnimationFrame(passo); } };

    // só anima enquanto o banner está na tela
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (visivel) iniciarLuz();
      }).observe(hero);
    } else iniciarLuz();
  }
})();
