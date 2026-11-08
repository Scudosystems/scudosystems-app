(() => {
  const themes = {
    wolves: { name: 'Molineux Stadium', short: 'M', zone: 'Zone M1', gold: '#f4a000', ink: '#141414', mist: '#f3efe7' },
    villa: { name: 'Villa Park', short: 'V', zone: 'Zone VP', gold: '#670e36', ink: '#111d34', mist: '#f7f4f6' },
    coventry: { name: 'Coventry Building Society Arena', short: 'C', zone: 'Zone C1', gold: '#2868e8', ink: '#082a4c', mist: '#f8fbff' },
    blues: { name: 'St Andrew’s', short: 'B', zone: 'Zone SA', gold: '#1b5dab', ink: '#10213d', mist: '#f4f8fc' },
    albion: { name: 'The Hawthorns', short: 'W', zone: 'Zone TH', gold: '#10285c', ink: '#111d2c', mist: '#f3f8fb' },
    walsall: { name: 'Bescot Stadium', short: 'W', zone: 'Zone BS', gold: '#cf1624', ink: '#161616', mist: '#fff7f7' }
  };
  const key = new URLSearchParams(window.location.search).get('club') || 'coventry';
  const theme = themes[key] || themes.coventry;
  window.stadiumTheme = theme;
  document.documentElement.style.setProperty('--gold', theme.gold);
  document.documentElement.style.setProperty('--ink', theme.ink);
  document.documentElement.style.setProperty('--mist', theme.mist);
  document.title = `${theme.name} Parking Check | Scudo Systems concept`;
  document.querySelectorAll('[data-stadium-mark]').forEach((element) => element.textContent = theme.short);
  document.querySelectorAll('[data-stadium-name]').forEach((element) => element.textContent = theme.name);
  document.querySelectorAll('[data-stadium-zone]').forEach((element) => element.textContent = theme.zone);
})();
