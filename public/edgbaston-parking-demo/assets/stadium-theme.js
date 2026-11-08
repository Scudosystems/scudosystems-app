(() => {
  const theme = { name: 'Edgbaston', short: 'E', location: 'Edgbaston Stadium car park', zone: 'ZONE E1', colours: ['#24356d', '#2d9cdb', '#101b3d', '#f7f9fd'] };
  const root = document.documentElement;
  root.style.setProperty('--old-gold', theme.colours[0]);
  root.style.setProperty('--gold-bright', theme.colours[1]);
  root.style.setProperty('--ink', theme.colours[2]);
  root.style.setProperty('--cream', theme.colours[3]);
  root.dataset.stadium = 'edgbaston';
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
