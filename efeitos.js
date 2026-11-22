/* Efeitos da madrugada: lanterna e brasas no banner, relógio da insônia,
   sinos na ficha do Gargoyle Game e livro que voa até a sacola. */
(() => {
  'use strict';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------- 1. Lanterna: o banner escurece e o ponteiro ilumina em volta ----------
  const hero = $('.hero');
  if (hero) {
    const luz = document.createElement('div');
    luz.className = 'lanterna';
    luz.setAttribute('aria-hidden', 'true');
    hero.querySelector('.hero-grain')?.after(luz);
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

    // ---------- 2. Brasas: cinzas rosadas subindo atrás do corvo ----------
    let iniciarBrasas = () => {};
    if (!calmo) {
      const tela = document.createElement('canvas');
      tela.className = 'brasas';
      tela.setAttribute('aria-hidden', 'true');
      luz.after(tela);   // por cima da sombra da lanterna
      const ctx = tela.getContext('2d');
      let W = 0, H = 0, dpr = 1, rodando = false, ant = 0;
      const brasas = [];
      const ajustar = () => {
        const r = hero.getBoundingClientRect();
        dpr = Math.min(devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
      };
      const nova = (inicio) => ({
        x: rnd(0, W), y: inicio ? rnd(0, H) : H + rnd(0, 40),
        vy: rnd(14, 38), fase: rnd(0, 6.28), amp: rnd(6, 22), r: rnd(1, 2.6),
        vida: inicio ? rnd(1.5, 6) : 0, max: rnd(7, 14), brilho: rnd(0.6, 1)
      });
      ajustar();
      addEventListener('resize', ajustar);
      const qtd = () => (W < 600 ? 22 : 46);
      for (let i = 0; i < qtd(); i++) brasas.push(nova(true));
      const quadro = (agora) => {
        const dt = Math.min((agora - ant) / 1000, 0.05); ant = agora;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = brasas.length - 1; i >= 0; i--) {
          const b = brasas[i];
          b.vida += dt; b.fase += dt * 1.3;
          b.y -= b.vy * dt;
          const px = b.x + Math.sin(b.fase) * b.amp;
          const u = b.vida / b.max;
          const a = Math.min(1, u * 4) * Math.max(0, 1 - u) * b.brilho * (0.7 + 0.3 * Math.sin(agora / 140 + b.fase * 3));
          if (u >= 1 || b.y < -20) { brasas[i] = nova(false); continue; }
          const g = ctx.createRadialGradient(px, b.y, 0, px, b.y, b.r * 6);
          g.addColorStop(0, `rgba(255,190,225,${a})`);
          g.addColorStop(0.3, `rgba(241,110,190,${a * 0.55})`);
          g.addColorStop(1, 'rgba(201,60,145,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, b.y, b.r * 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        if (visivel) requestAnimationFrame(quadro); else rodando = false;
      };
      iniciarBrasas = () => { if (!rodando) { rodando = true; ant = performance.now(); requestAnimationFrame(quadro); } };
    }

    // só anima enquanto o banner está na tela
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visivel = e.isIntersecting;
        if (visivel) { iniciarLuz(); iniciarBrasas(); }
      }).observe(hero);
    } else { iniciarLuz(); iniciarBrasas(); }
  }

  // ---------- 3. Relógio da insônia: depois da meia-noite o site percebe ----------
  const aviso = document.querySelector('.announcement > span:not([class])');
  const textoDia = aviso ? aviso.textContent : '';
  function relogio() {
    const d = new Date(), h = d.getHours();
    const madrugada = h < 5;
    document.documentElement.classList.toggle('madrugada', madrugada);
    if (!aviso) return;
    if (madrugada) {
      const hora = `${h}h${String(d.getMinutes()).padStart(2, '0')}`;
      aviso.textContent = `São ${hora}. Só mais um capítulo?`;
    } else {
      aviso.textContent = textoDia;
    }
  }
  relogio();
  setInterval(relogio, 30000);

  // ---------- áudio compartilhado (liberado no primeiro clique, toque ou tecla) ----------
  let audio = null, saida = null, eco = null;
  function prepararAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      if (!audio) {
        audio = new AC();
        saida = audio.createGain(); saida.gain.value = 0.5; saida.connect(audio.destination);
        const len = Math.round(audio.sampleRate * 4.5);
        const imp = audio.createBuffer(2, len, audio.sampleRate);
        for (let c = 0; c < 2; c++) {
          const d = imp.getChannelData(c);
          for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
        }
        eco = audio.createConvolver(); eco.buffer = imp;
        const ev = audio.createGain(); ev.gain.value = 0.55;
        eco.connect(ev).connect(saida);
      }
      if (audio.state === 'suspended') audio.resume();
    } catch (_) { audio = null; }
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, prepararAudio, { passive: true }));

  // ---------- 4. Sinos: ao abrir a ficha do Gargoyle Game, um sino distante dobra ----------
  // Parciais inarmônicas de um sino de bronze, cada uma com seu decaimento.
  const PARCIAIS = [[0.5, 1, 7], [1, 0.8, 5], [1.19, 0.55, 3.6], [1.56, 0.42, 3], [2, 0.38, 2.6], [2.51, 0.25, 2], [2.66, 0.2, 1.8], [3.01, 0.16, 1.5], [4.1, 0.1, 1]];
  function badalada(t, base, vol) {
    const g = audio.createGain(); g.gain.value = vol;
    const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;   // som de longe
    g.connect(lp);
    const seco = audio.createGain(); seco.gain.value = 0.35; lp.connect(seco).connect(saida);
    lp.connect(eco);
    PARCIAIS.forEach(([razao, amp, dec]) => {
      const o = audio.createOscillator(); o.type = 'sine';
      o.frequency.value = base * razao * (1 + rnd(-0.002, 0.002));
      const e = audio.createGain();
      e.gain.setValueAtTime(0, t);
      e.gain.linearRampToValueAtTime(amp, t + 0.006);
      e.gain.exponentialRampToValueAtTime(0.0005, t + dec);
      o.connect(e).connect(g);
      o.start(t); o.stop(t + dec + 0.05);
    });
    // a pancada do badalo
    const n = audio.createBufferSource();
    const buf = audio.createBuffer(1, Math.round(audio.sampleRate * 0.05), audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf;
    const nf = audio.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = base * 4; nf.Q.value = 2;
    const nv = audio.createGain(); nv.gain.value = 0.25;
    n.connect(nf).connect(nv).connect(g);
    n.start(t);
  }
  let ultimoSino = 0;
  function dobrarSino() {
    if (!audio || audio.state !== 'running') return;
    const agora = performance.now();
    if (agora - ultimoSino < 6000) return;
    ultimoSino = agora;
    const t = audio.currentTime + 0.15;
    badalada(t, 196, 0.5);           // sol grave
    badalada(t + 2.4, 196, 0.38);    // segunda badalada, mais fraca
  }
  const fichaLivro = $('#product-modal');
  if (fichaLivro) {
    new MutationObserver(() => {
      if (fichaLivro.hidden) return;
      const titulo = fichaLivro.querySelector('#product-modal-title')?.textContent.trim();
      if (titulo === 'Gargoyle Game') dobrarSino();
    }).observe(fichaLivro, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: false });
  }

  // ---------- 5. Livro que voa até a sacola, deixando penas no caminho ----------
  const PENA = '<svg viewBox="0 0 20 40" aria-hidden="true"><path d="M10 0C16 9 15 26 11 40h-2C5 26 4 9 10 0Z" fill="#0c050d"/><path d="M10 4V39" stroke="#f184cf" stroke-opacity=".45" stroke-width="1"/></svg>';
  function soltarPena(x, y) {
    const p = document.createElement('span');
    p.className = 'pena-voo';
    p.innerHTML = PENA;
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${rnd(-40, 40)}px`);
    p.style.setProperty('--rot', `${rnd(-160, 160)}deg`);
    p.style.setProperty('--s', rnd(0.6, 1.1).toFixed(2));
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1700);
  }
  function voarParaSacola(origem) {
    const destino = $('#open-cart');
    if (!origem || !destino) return;
    const ro = origem.getBoundingClientRect(), rd = destino.getBoundingClientRect();
    if (!ro.width) return;
    const voo = document.createElement('img');
    voo.src = origem.currentSrc || origem.src;
    voo.alt = '';
    voo.className = 'livro-voo';
    voo.style.width = `${ro.width}px`; voo.style.height = `${ro.height}px`;
    document.body.appendChild(voo);
    const x0 = ro.left + ro.width / 2, y0 = ro.top + ro.height / 2;
    const x1 = rd.left + rd.width / 2, y1 = rd.top + rd.height / 2;
    const cx = (x0 + x1) / 2 + (x1 > x0 ? -120 : 120), cy = Math.min(y0, y1) - 160;   // arco por cima
    const dur = 900, inicio = performance.now();
    let ultimaPena = 0;
    const passo = (agora) => {
      const u = Math.min(1, (agora - inicio) / dur);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * x1;
      const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * y1;
      const esc = 1 - e * 0.88;
      voo.style.transform = `translate(${x - ro.width / 2}px, ${y - ro.height / 2}px) scale(${esc}) rotate(${e * -28}deg)`;
      voo.style.opacity = String(u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1);
      if (agora - ultimaPena > 55 && u < 0.92) { soltarPena(x, y); ultimaPena = agora; }
      if (u < 1) requestAnimationFrame(passo);
      else {
        voo.remove();
        const contador = $('.cart-count');
        contador?.classList.remove('pulsa'); void contador?.offsetWidth; contador?.classList.add('pulsa');
        for (let i = 0; i < 5; i++) soltarPena(x1 + rnd(-10, 10), y1 + rnd(-6, 6));
      }
    };
    requestAnimationFrame(passo);
  }
  if (!calmo) {
    // captura: roda antes do script do catálogo abrir a sacola
    document.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-action="add"]');
      if (!botao) return;
      const card = botao.closest('.product-card, .modal-product-layout');
      const img = card?.querySelector('.tarot-flip.is-flipped .tarot-reverse img, .tarot-face img');
      voarParaSacola(img);
    }, true);
  }
})();
