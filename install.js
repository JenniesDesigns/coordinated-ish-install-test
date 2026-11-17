(() => {
  'use strict';
  let pendingPrompt = null;
  const standalone = window.matchMedia('(display-mode: standalone)');
  const isInstalled = () => standalone.matches || navigator.standalone === true;
  const buttons = [];
  const dialog = document.createElement('dialog');
  dialog.id = 'ccInstallDialog';
  dialog.setAttribute('aria-labelledby', 'ccInstallTitle');
  dialog.innerHTML = '<h2 id="ccInstallTitle">Take your chaos with you.</h2><p id="ccInstallInstructions"></p><p>Your account stays the same. An internet connection is needed to sign in and use your planner.</p><form method="dialog"><button>Got it</button></form>';
  document.body.append(dialog);
  function sync() { buttons.forEach(button => { button.hidden = isInstalled(); }); }
  async function install() {
    if (isInstalled()) return;
    if (pendingPrompt) {
      const prompt = pendingPrompt;
      pendingPrompt = null;
      try { await prompt.prompt(); await prompt.userChoice; }
      catch (error) { console.warn('Install prompt unavailable', error); showHelp(); }
      return;
    }
    showHelp();
  }
  function showHelp() {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    document.getElementById('ccInstallInstructions').textContent = ios
      ? 'Open this page in Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if offered, then tap Add.'
      : 'In Chrome or Edge, open the browser menu and look for Install Coordinated-ish, Install app, or Add to Home screen. If it is not offered yet, refresh after the site finishes updating and try again.';
    dialog.showModal();
  }
  // Available before sign-in as well as from the planner navigation.
  const targets = [document.querySelector('.auth-card'), document.querySelector('.brand'), document.querySelector('.topbar')].filter(Boolean);
  targets.forEach(target => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cc-install-button'; if (target.matches('.topbar')) button.classList.add('cc-install-mobile'); button.textContent = 'Install Coordinated-ish';
    button.addEventListener('click', install); target.append(button); buttons.push(button);
  });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); pendingPrompt = event; sync(); });
  window.addEventListener('appinstalled', () => { pendingPrompt = null; buttons.forEach(button => { button.hidden = true; }); });
  standalone.addEventListener('change', sync);
  sync();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'})
        .catch(error => console.warn('App installation setup failed', error));
    });
  }
})();
