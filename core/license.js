window.APP_ID = 'aha-pos';

Object.assign(window.APP_CONFIG, {
  plan: 'lite',
  maxRecords: 30,
  canExport: false,
  iaTier: 'lite',
  canWhiteLabel: false,
  customer: null,
  cifrado: {
    camposSensibles: [],
    storageKey: 'aha-pos-default-key'
  },
  sync: {
    storageKey: 'aha-pos-default-key'
  },
  version: '1.0.0',
  buildDate: '2026-07-15'
});

window.checkLicense = async function() {
  if (ENV === 'development') {
    console.log('🔓 Modo desarrollo — licencia desbloqueada');
    return true;
  }
  try {
    var stored = localStorage.getItem('aha-pos-license');
    if (stored) {
      var license = JSON.parse(stored);
      if (license.appId === 'aha-pos') {
        applyLicense(license);
        return true;
      }
    }
    console.log('⚠️ Sin licencia activa — modo Lite');
    return false;
  } catch (e) {
    console.log('⚠️ Error verificando licencia:', e.message);
    return false;
  }
};

window.cargarLicencia = function() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.aha';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var license = JSON.parse(ev.target.result);
        if (license.appId !== 'aha-pos') {
          UI.toast('La licencia no corresponde a AHA POS', 'error');
          return;
        }
        localStorage.setItem('aha-pos-license', JSON.stringify(license));
        applyLicense(license);
        UI.toast('Licencia cargada: plan ' + license.plan, 'success');
      } catch (err) {
        UI.toast('Archivo de licencia inválido', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

function applyLicense(license) {
  if (license.plan === 'profesional' || license.plan === 'enterprise') {
    APP_CONFIG.maxRecords = Infinity;
    APP_CONFIG.canExport = true;
    APP_CONFIG.iaTier = 'full';
    APP_CONFIG.canWhiteLabel = license.plan === 'enterprise';
  }
  APP_CONFIG.plan = license.plan;
  APP_CONFIG.customer = license.customer || null;
}
