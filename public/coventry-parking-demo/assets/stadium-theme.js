(() => {
  const theme = { name: 'Coventry Building Society Arena', short: 'C', location: 'Coventry Building Society Arena car park', zone: 'ZONE C1', colours: ['#2868e8', '#4ab4f4', '#082a4c', '#f8fbff'] };
  const root = document.documentElement;
  root.style.setProperty('--old-gold', theme.colours[0]);
  root.style.setProperty('--gold-bright', theme.colours[1]);
  root.style.setProperty('--ink', theme.colours[2]);
  root.style.setProperty('--cream', theme.colours[3]);
  root.dataset.stadium = 'coventry';
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
