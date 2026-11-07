(() => {
  const themes = {
    wolves: { name: 'Molineux', short: 'M', location: 'Stadium car park', zone: 'ZONE M1', colours: ['#f5a000', '#ffbd32', '#111111', '#fffaf0'] },
    villa: { name: 'Villa Park', short: 'V', location: 'Villa Park parking', zone: 'ZONE VP', colours: ['#670e36', '#95bfe5', '#111d34', '#faf7f8'] },
    blues: { name: 'St Andrew’s', short: 'B', location: 'St Andrew’s parking', zone: 'ZONE SA', colours: ['#1b5dab', '#5ea7df', '#10213d', '#f5f9fd'] },
    albion: { name: 'The Hawthorns', short: 'W', location: 'The Hawthorns parking', zone: 'ZONE TH', colours: ['#10285c', '#70c7e7', '#111d2c', '#f6fbfd'] },
    walsall: { name: 'Bescot Stadium', short: 'W', location: 'Bescot Stadium parking', zone: 'ZONE BS', colours: ['#cf1624', '#ef5963', '#161616', '#fff8f8'] }
  };

  const selected = new URLSearchParams(window.location.search).get('club') || 'wolves';
  const theme = themes[selected] || themes.wolves;
  const root = document.documentElement;
  root.style.setProperty('--old-gold', theme.colours[0]);
  root.style.setProperty('--gold-bright', theme.colours[1]);
  root.style.setProperty('--ink', theme.colours[2]);
  root.style.setProperty('--cream', theme.colours[3]);
  root.dataset.stadium = selected;
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
    element.href = `${element.getAttribute('href').split('?')[0]}?club=${selected}`;
  });
})();
