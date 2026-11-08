(() => {
  const theme = { name: 'Solihull Moors', short: 'S', location: 'Solihull Moors Stadium car park', zone: 'ZONE SM1', colours: ['#4bb6b8', '#ffe600', '#152b50', '#fbfcff'] };
  const root = document.documentElement;
  root.style.setProperty('--old-gold', theme.colours[0]);
  root.style.setProperty('--gold-bright', theme.colours[1]);
  root.style.setProperty('--ink', theme.colours[2]);
  root.style.setProperty('--cream', theme.colours[3]);
  root.dataset.stadium = 'solihull';
  document.title = `${theme.name} Parking | Scudo Systems concept`;

  document.querySelectorAll('[data-stadium-name]').forEach((element) => {
    element.textContent = theme.name.toUpperCase();
  });
  document.querySelectorAll('[data-stadium-mark]').forEach((element) => {
    element.textContent = theme.short;
  });
  document.querySelectorAll('[data-stadium-location]').forEach((element) => {
    element.textContent = theme.location;
  });
  document.querySelectorAll('[data-stadium-zone]').forEach((element) => {
    element.textContent = theme.zone;
  });
  document.querySelectorAll('[data-stadium-link]').forEach((element) => {
    element.href = element.getAttribute('href').split('?')[0];
  });
})();
