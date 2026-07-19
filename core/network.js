(function () {
  'use strict';

  function updateOnlineStatus() {
    var online = navigator.onLine;
    if (window.Alpine) {
      try {
        Alpine.store('app').offline = !online;
        Alpine.store('ui').online = online;
      } catch (e) {}
    }
    var banner = document.getElementById('offline-banner');
    if (banner) {
      if (online) {
        banner.classList.add('hidden');
        document.body.classList.remove('offline');
      } else {
        banner.classList.remove('hidden');
        document.body.classList.add('offline');
      }
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  document.addEventListener('DOMContentLoaded', function () {
    var banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'hidden fixed top-0 left-0 right-0 z-50 bg-warning text-warning-content text-center text-sm py-1 px-4 offline-banner';
    banner.textContent = 'Sin conexión — los datos se guardan localmente';
    document.body.prepend(banner);

    if (!navigator.onLine) {
      banner.classList.remove('hidden');
      document.body.classList.add('offline');
    }
  });
})();
