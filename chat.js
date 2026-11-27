/* Chat de prévia aberto pelo olho. Respostas prontas, sem atendimento real. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const bubble = $('#olho-bubble'), panel = $('#chat-panel'), log = $('#chat-log');
  const quick = $('#chat-quick'), form = $('#chat-form'), input = $('#chat-input');
  const teaser = $('#chat-teaser'), closeBtn = $('#chat-close');
  if (!bubble || !panel) return;

  const respostas = [
    { id: 'comprar', rotulo: 'Já posso comprar?', chaves: ['comprar', 'compra', 'pagar', 'pagamento', 'pedido', 'vende', 'venda'],
      texto: 'Ainda não. Esta é uma prévia navegável do site: a sacola funciona só como demonstração e nenhum pagamento é feito. As compras vão abrir na loja oficial.' },
    { id: 'frete', rotulo: 'Como funciona o frete?', chaves: ['frete', 'entrega', 'cep', 'envio', 'prazo'],
      texto: 'Na loja oficial, o frete vai depender do CEP, do peso e das transportadoras configuradas. Nesta prévia nenhum valor de frete é calculado.' },
    { id: 'livros', rotulo: 'Quais livros vocês têm?', chaves: ['livro', 'livros', 'catalogo', 'catálogo', 'trilogia', 'gargoyle', 'titulo'],
      texto: 'Por enquanto, a Trilogia Gargoyle, de Sabine Vecchi: Gargoyle Game (Livro 1), Gargoyle Love (Livro 2) e o Vol. 3, ainda sem título definitivo. Quer ver o catálogo?', acao: 'catalogo' },
    { id: 'autora', rotulo: 'Quem é Sabine Vecchi?', chaves: ['sabine', 'vecchi', 'autora', 'escritora'],
      texto: 'Sabine Vecchi escreve romances sombrios, com personagens intensos e narrativas que prendem até a última página. É a autora da Trilogia Gargoyle.' }
  ];

  const normalizar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function mensagem(texto, quem) {
    const li = document.createElement('li');
    li.className = quem;
    li.textContent = texto;
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
    return li;
  }

  function responder(resposta) {
    const espera = mensagem('• • •', 'bot digitando');
    const rapido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => {
      espera.classList.remove('digitando');
      espera.textContent = resposta.texto;
      if (resposta.acao === 'catalogo') {
        const ir = document.createElement('button');
        ir.type = 'button';
        ir.textContent = 'Ver catálogo →';
        ir.addEventListener('click', () => { fechar(); $('#catalogo')?.scrollIntoView({ behavior: 'smooth' }); });
        quick.prepend(ir);
      }
      log.scrollTop = log.scrollHeight;
    }, rapido ? 0 : 650);
  }

  function perguntar(texto) {
    const limpo = texto.trim();
    if (!limpo) return;
    mensagem(limpo, 'eu');
    const n = normalizar(limpo);
    const achada = respostas.find((r) => r.chaves.some((c) => n.includes(normalizar(c))));
    responder(achada || {
      texto: 'Ainda sou uma prévia e só sei responder sobre compras, frete, os livros e a autora. O atendimento de verdade chega com a loja oficial.'
    });
  }

  function montarRapidas() {
    quick.innerHTML = '';
    respostas.forEach((r) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.rotulo;
      b.addEventListener('click', () => perguntar(r.rotulo));
      quick.appendChild(b);
    });
  }

  let iniciado = false;
  function abrir() {
    panel.hidden = false;
    bubble.setAttribute('aria-expanded', 'true');
    bubble.setAttribute('aria-label', 'Fechar conversa com a Insônia');
    teaser.classList.add('some');
    if (!iniciado) {
      iniciado = true;
      mensagem('Oi! Eu sou o olho da Insônia e fico de vigia enquanto você lê. Sobre o que quer saber?', 'bot');
      montarRapidas();
    }
    input.focus({ preventScroll: true });
  }
  function fechar() {
    panel.hidden = true;
    bubble.setAttribute('aria-expanded', 'false');
    bubble.setAttribute('aria-label', 'Abrir conversa com a Insônia');
  }

  bubble.addEventListener('click', () => (panel.hidden ? abrir() : fechar()));
  closeBtn.addEventListener('click', () => { fechar(); bubble.focus(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); perguntar(input.value); input.value = ''; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { fechar(); bubble.focus(); } });
  setTimeout(() => teaser.classList.add('some'), 9000);
})();
