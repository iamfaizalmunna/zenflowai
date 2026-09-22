export const THEME_BOOT_SCRIPT = `(function(){
  try {
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    localStorage.removeItem('theme');
  } catch (e) {}
})();`;
