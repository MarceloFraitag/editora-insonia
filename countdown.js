(() => {
  'use strict';

  const units = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Sao_Paulo'
  });

  const countdowns = Array.from(document.querySelectorAll('[data-countdown]'), (section) => {
    const date = section.querySelector('time[datetime]');
    const deadline = Date.parse(date?.dateTime);
    const timer = section.querySelector('[role="timer"]');
    const status = section.querySelector('[data-countdown-status]');
    const values = Object.entries(units).map(([unit, seconds]) => ({
      element: timer?.querySelector(`[data-countdown-unit="${unit}"]`),
      seconds
    }));

    if (!Number.isFinite(deadline) || !status || values.some(({ element }) => !element)) return null;

    date.textContent = dateFormat.format(deadline);
    timer.hidden = false;
    return { deadline, status, values };
  }).filter(Boolean);

  function update() {
    const now = Date.now();
    for (const countdown of countdowns) {
      let remaining = Math.max(0, Math.ceil((countdown.deadline - now) / 1000));
      for (const { element, seconds } of countdown.values) {
        const value = String(Math.floor(remaining / seconds)).padStart(2, '0');
        if (element.textContent !== value) element.textContent = value;
        remaining %= seconds;
      }
      if (now >= countdown.deadline && !countdown.status.textContent) {
        countdown.status.textContent = 'Chegou o dia da pré-venda!';
      }
    }
    return countdowns.some(({ deadline }) => deadline > now);
  }

  // Um único intervalo atende todos os componentes e termina com o último prazo.
  if (update()) {
    const interval = window.setInterval(() => {
      if (!update()) window.clearInterval(interval);
    }, 1000);
  }
})();
