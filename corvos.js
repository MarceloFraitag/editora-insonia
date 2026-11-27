/* Corvos que saem de trás da carta quando ela é revelada (hover ou clique).
   Tudo desenhado em canvas: silhuetas com asas batendo, olho aceso, penas caindo e névoa. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tela = document.createElement('canvas');
  tela.className = 'corvos-camada';
  tela.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tela);
  const ctx = tela.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function ajustar() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
  }
  ajustar();
  addEventListener('resize', ajustar);

  const corvos = [], penas = [], nevoas = [];
  const ultimo = new WeakMap();
  const rnd = (a, b) => a + Math.random() * (b - a);
  let rodando = false, antes = 0;

  // --- desenho de um corvo de perfil, virado para +x, corpo com ~1 unidade ---
  function asa(a, escuro) {
    const tipY = -0.82 * a;
    const tipX = -0.30 + 0.06 * Math.abs(a);
    ctx.beginPath();
    ctx.moveTo(0.16, -0.05);
    ctx.quadraticCurveTo(0.06, tipY * 0.6, tipX, tipY);
    // penas primárias abertas na ponta
    const midX = -0.34, midY = tipY * 0.42;
    for (let k = 1; k <= 5; k++) {
      const u = k / 5;
      const x = tipX + (midX - tipX) * u, y = tipY + (midY - tipY) * u;
      const ox = -0.07 * (1 - u * 0.5), oy = 0.04 * Math.sign(a || 1) * (1 - u);
      ctx.quadraticCurveTo(x + ox, y - oy, x, y);
    }
    ctx.quadraticCurveTo(-0.24, tipY * 0.15, -0.16, -0.02);
    ctx.closePath();
    ctx.fillStyle = escuro;
    ctx.fill();
  }

  function desenharCorvo(c) {
    const s = c.tam * c.escala;
    let ang = Math.atan2(c.vy, c.vx), vira = 1;
    if (c.vx < 0) { vira = -1; ang = Math.atan2(c.vy, -c.vx); }
    ang = Math.max(-0.7, Math.min(0.7, ang));
    const bate = Math.sin(c.fase);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(vira * s, s);
    ctx.rotate(ang);
    ctx.globalAlpha = c.alfa;
    ctx.shadowColor = 'rgba(10,2,12,.55)';
    ctx.shadowBlur = 10 * dpr;
    ctx.shadowOffsetY = 4 * dpr;

    // asa de trás, um pouco atrasada e mais escura
    asa(Math.sin(c.fase - 0.5) * 0.9, '#050206');

    // corpo
    ctx.beginPath();
    ctx.moveTo(0.48, -0.06);
    ctx.bezierCurveTo(0.38, -0.17, 0.05, -0.14, -0.30, -0.05);
    ctx.lineTo(-0.66, -0.12);                         // cauda em leque
    ctx.lineTo(-0.70, -0.02);
    ctx.lineTo(-0.67, 0.07);
    ctx.lineTo(-0.30, 0.05);
    ctx.bezierCurveTo(0.02, 0.15, 0.36, 0.10, 0.48, 0.0);
    ctx.closePath();
    ctx.fillStyle = '#0a040b';
    ctx.fill();
    // cabeça e bico
    ctx.beginPath();
    ctx.arc(0.47, -0.05, 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.53, -0.09);
    ctx.quadraticCurveTo(0.66, -0.07, 0.72, -0.02);
    ctx.quadraticCurveTo(0.62, -0.02, 0.53, -0.01);
    ctx.closePath();
    ctx.fillStyle = '#120812';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    // asa da frente
    asa(bate, '#0d050e');
    // contorno de luz magenta, bem sutil, para separar do fundo escuro
    ctx.lineWidth = 1.2 / s;
    ctx.strokeStyle = 'rgba(241,132,207,.22)';
    ctx.stroke();

    // olho aceso
    const g = ctx.createRadialGradient(0.5, -0.07, 0, 0.5, -0.07, 0.06);
    g.addColorStop(0, 'rgba(255,120,190,1)');
    g.addColorStop(0.35, 'rgba(230,50,140,.85)');
    g.addColorStop(1, 'rgba(230,50,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0.5, -0.07, 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function desenharPena(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.tam, p.tam);
    ctx.globalAlpha = p.alfa;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.quadraticCurveTo(0.42, -0.3, 0.08, 1);
    ctx.lineTo(-0.02, 1);
    ctx.quadraticCurveTo(-0.38, -0.2, 0, -1);
    ctx.fillStyle = '#0c050d';
    ctx.fill();
    ctx.lineWidth = 0.06;
    ctx.strokeStyle = 'rgba(241,132,207,.25)';
    ctx.beginPath(); ctx.moveTo(0, -0.9); ctx.lineTo(0.03, 1.3); ctx.stroke();
    ctx.restore();
  }

  function desenharNevoa(n) {
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
    g.addColorStop(0, `rgba(30,8,34,${0.55 * n.alfa})`);
    g.addColorStop(0.55, `rgba(60,14,58,${0.22 * n.alfa})`);
    g.addColorStop(1, 'rgba(60,14,58,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
  }

  // --- revoada ---
  function revoada(carta) {
    const r = carta.getBoundingClientRect();
    if (r.width < 90 || r.bottom < 0 || r.top > H) return;
    const agora = performance.now();
    if (agora - (ultimo.get(carta) || 0) < 1600) return;
    ultimo.set(carta, agora);

    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const n = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const lado = i % 2 ? 1 : -1;
      const ang = -Math.PI / 2 + lado * rnd(0.25, 1.25);     // sai para cima e para os lados
      const vel = rnd(230, 380);
      corvos.push({
        x: cx + rnd(-r.width * 0.3, r.width * 0.3),
        y: cy + rnd(-r.height * 0.15, r.height * 0.25),
        vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
        tam: rnd(30, 46), escala: 0.55, cresce: rnd(0.35, 0.6),
        fase: rnd(0, Math.PI * 2), freq: rnd(15, 21),
        onda: rnd(0.8, 1.6), vida: 0, max: rnd(1.9, 2.5), alfa: 1,
        atras: true, rect: r, atraso: i * rnd(0.04, 0.09)
      });
    }
    for (let i = 0; i < 6; i++) {
      penas.push({
        x: cx + rnd(-r.width * 0.5, r.width * 0.5), y: r.top + rnd(0, r.height * 0.4),
        vx: rnd(-40, 40), vy: rnd(-90, -30), rot: rnd(0, 6.28), vr: rnd(-3, 3),
        tam: rnd(5, 9), vida: 0, max: rnd(2.2, 3.2), alfa: 0, atraso: rnd(0.15, 0.5)
      });
    }
    for (let i = 0; i < 9; i++) {
      const a = rnd(0, Math.PI * 2);
      nevoas.push({
        x: cx + Math.cos(a) * r.width * 0.55, y: cy + Math.sin(a) * r.height * 0.5,
        vx: Math.cos(a) * rnd(15, 40), vy: Math.sin(a) * rnd(10, 30) - 12,
        r: rnd(30, 55), cresce: rnd(30, 60), vida: 0, max: rnd(1.2, 1.8), alfa: 0
      });
    }
    tocarRevoada(n, (cx / W) * 2 - 1);
    if (!rodando) { rodando = true; antes = performance.now(); requestAnimationFrame(quadro); }
  }

  // --- som: revoada de corvos (assets/corvos.mp3) ---
  const controleSom = document.getElementById('raven-sound');
  const chaveSom = 'editora-insonia-raven-sound';
  const AudioContextDisponivel = window.AudioContext || window.webkitAudioContext;
  let audio = null, saida = null, somBuf = null, carregando = false;
  let tocando = null, pendente = null, ultimoSom = -Infinity;
  let somAtivo = false;
  try { somAtivo = localStorage.getItem(chaveSom) === 'on'; }
  catch { /* A preferência vale nesta página se o navegador bloquear o armazenamento. */ }

  if (controleSom && AudioContextDisponivel) {
    controleSom.hidden = false;
    controleSom.setAttribute('aria-pressed', String(somAtivo));
    controleSom.addEventListener('click', () => {
      somAtivo = !somAtivo;
      controleSom.setAttribute('aria-pressed', String(somAtivo));
      try { localStorage.setItem(chaveSom, somAtivo ? 'on' : 'off'); }
      catch { /* Mantém a escolha para a sessão atual da página. */ }
      if (saida) saida.gain.value = somAtivo ? 0.24 : 0;
      if (somAtivo) prepararAudio();
      else {
        pendente = null;
        tocando?.src.stop();
        tocando = null;
      }
    });
  }

  // A preferência autoriza o som. A criação do contexto ainda depende de um gesto.
  function prepararAudio() {
    if (!somAtivo || !AudioContextDisponivel) return;
    try {
      if (!audio) {
        audio = new AudioContextDisponivel();
        saida = audio.createGain(); saida.gain.value = 0.24; saida.connect(audio.destination);
      }
      if (audio.state === 'suspended') audio.resume().catch(() => { pendente = null; });
      if (!somBuf && !carregando) {
        carregando = true;
        fetch('assets/corvos.mp3')
          .then((r) => {
            if (!r.ok) throw new Error('Áudio da revoada indisponível.');
            return r.arrayBuffer();
          })
          .then((b) => new Promise((ok, erro) => audio.decodeAudioData(b, ok, erro)))
          .then((buf) => {
            somBuf = buf;
            // a revoada que pediu som enquanto o arquivo carregava ainda toca, se foi há pouco
            if (pendente && performance.now() - pendente.em < 900) tocarRevoada(0, pendente.pan);
            pendente = null;
          })
          .catch(() => { carregando = false; pendente = null; });
      }
    } catch (_) { audio = null; }
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, prepararAudio, { passive: true }));

  function tocarRevoada(qtd, pan) {
    if (!somAtivo) return;
    if (audio && !somBuf && carregando) { pendente = { pan, em: performance.now() }; return; }
    if (!audio || audio.state !== 'running' || !somBuf) return;
    const t = audio.currentTime + 0.01;
    // A passagem rápida por várias cartas não acumula uma sequência de sons.
    if (t - ultimoSom < 0.35) return;
    ultimoSom = t;
    // se já houver uma revoada tocando, ela sai de cena antes da nova entrar
    if (tocando) {
      try {
        tocando.vol.gain.cancelScheduledValues(t);
        tocando.vol.gain.setTargetAtTime(0, t, 0.08);
        tocando.src.stop(t + 0.4);
      } catch (_) {}
    }
    const dur = 4.6;
    const inicio = Math.random() * Math.max(0, somBuf.duration - dur - 0.5);
    const src = audio.createBufferSource(); src.buffer = somBuf;
    src.playbackRate.value = 0.94 + Math.random() * 0.1;     // cada revoada soa um pouco diferente
    const vol = audio.createGain();
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(1, t + 0.12);
    vol.gain.setValueAtTime(1, t + dur - 1.4);
    vol.gain.linearRampToValueAtTime(0, t + dur);
    let fim = vol;
    if (audio.createStereoPanner) {
      const p = audio.createStereoPanner(); p.pan.value = Math.max(-0.6, Math.min(0.6, pan * 0.6));
      vol.connect(p); fim = p;
    }
    fim.connect(saida);
    src.connect(vol);
    src.start(t, inicio, dur + 0.1);
    tocando = { src, vol };
    src.onended = () => { if (tocando && tocando.src === src) tocando = null; };
  }

  function fora(c) {
    const m = c.tam * c.escala * 0.7, r = c.rect;
    return c.x < r.left - m || c.x > r.right + m || c.y < r.top - m || c.y > r.bottom + m;
  }

  function quadro(agora) {
    const dt = Math.min((agora - antes) / 1000, 0.04); antes = agora;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (let i = nevoas.length - 1; i >= 0; i--) {
      const n = nevoas[i];
      n.vida += dt; n.x += n.vx * dt; n.y += n.vy * dt; n.r += n.cresce * dt;
      const u = n.vida / n.max;
      n.alfa = u < 0.2 ? u / 0.2 : Math.max(0, 1 - (u - 0.2) / 0.8);
      if (u >= 1) nevoas.splice(i, 1); else desenharNevoa(n);
    }

    for (let i = corvos.length - 1; i >= 0; i--) {
      const c = corvos[i];
      if (c.atraso > 0) { c.atraso -= dt; continue; }
      c.vida += dt;
      c.fase += c.freq * dt * (c.atras ? 1.3 : 1);
      c.vy -= 60 * dt;                                // sobe aos poucos
      c.vx += Math.cos(c.vida * 3 + c.onda) * 40 * dt * c.onda;
      c.x += c.vx * dt; c.y += c.vy * dt + Math.sin(c.fase) * 0.6;
      c.escala = Math.min(1.35, c.escala + c.cresce * dt);
      if (c.atras && fora(c)) c.atras = false;
      const u = c.vida / c.max;
      c.alfa = u > 0.7 ? Math.max(0, 1 - (u - 0.7) / 0.3) : 1;
      if (u >= 1 || c.y < -120 || c.x < -150 || c.x > W + 150) { corvos.splice(i, 1); continue; }

      if (c.atras) {
        // ainda atrás da carta: só aparece o que já passou da borda
        const r = c.rect;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.rect(r.left + 2, r.top + 2, r.width - 4, r.height - 4);
        ctx.clip('evenodd');
        desenharCorvo(c);
        ctx.restore();
      } else {
        desenharCorvo(c);
      }
    }

    for (let i = penas.length - 1; i >= 0; i--) {
      const p = penas[i];
      if (p.atraso > 0) { p.atraso -= dt; continue; }
      p.vida += dt;
      p.vy += 55 * dt; p.vx += Math.sin(p.vida * 4 + p.rot) * 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const u = p.vida / p.max;
      p.alfa = u < 0.15 ? u / 0.15 : Math.max(0, 1 - (u - 0.5) / 0.5);
      if (u >= 1) penas.splice(i, 1); else desenharPena(p);
    }

    if (corvos.length || penas.length || nevoas.length) requestAnimationFrame(quadro);
    else { rodando = false; ctx.clearRect(0, 0, W, H); }
  }

  // hover no computador; clique (virar a carta) no celular e no teclado
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  document.addEventListener('mouseover', (e) => {
    if (!hover.matches) return;
    const carta = e.target.closest?.('.tarot-flip');
    if (!carta || carta.contains(e.relatedTarget)) return;
    revoada(carta);
  });
  document.addEventListener('click', (e) => {
    const carta = e.target.closest?.('.tarot-flip');
    if (!carta) return;
    requestAnimationFrame(() => { if (carta.classList.contains('is-flipped')) revoada(carta); });
  });
  // se a página rolar, a carta saiu do lugar: libera os corvos que ainda estavam atrás dela
  addEventListener('scroll', () => {
    for (const c of corvos) if (c.atras) c.atras = false;
  }, { passive: true });
})();
