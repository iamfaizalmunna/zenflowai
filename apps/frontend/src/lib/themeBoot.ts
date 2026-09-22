export const THEME_BOOT_SCRIPT = `(function(){
  try {
    var mode = 'SYSTEM';
    var raw = localStorage.getItem('zenflow-appearance-local');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.colorMode) mode = parsed.colorMode;
    }
    var dark = mode === 'DARK' || (mode !== 'LIGHT' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(dark ? 'dark' : 'light');
    root.style.colorScheme = dark ? 'dark' : 'light';
    localStorage.removeItem('theme');
  } catch (e) {}
})();`;
