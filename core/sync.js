window.Sync = {
  _progress: function(msg, pct) {
    UI.toast(msg, 'info', 0);
  },

  async exportarBackup() {
    try {
      UI.toast('Preparando respaldo...', 'info', 0);
      var data = { exportDate: new Date().toISOString(), appId: 'aha-pos', version: '1.0.0', tables: {} };

      var tableNames = db.tables.map(function(t) { return t.name; });
      for (var i = 0; i < tableNames.length; i++) {
        var name = tableNames[i];
        if (name === '_file_blobs') continue;
        var records = await db.table(name).toArray();
        if (records.length > 0) data.tables[name] = records;
      }

      var json = JSON.stringify(data);
      var compressed = pako.gzip(json);
      var encrypted = CryptoJS.AES.encrypt(
        CryptoJS.lib.WordArray.create(compressed),
        APP_CONFIG.sync.storageKey || 'aha-pos-default-key'
      ).toString();

      var blob = new Blob([encrypted], { type: 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'aha-pos-backup-' + new Date().toISOString().slice(0, 10) + '.ateje-backup';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      UI.toast('Respaldo exportado exitosamente', 'success');
    } catch (e) {
      UI.toast('Error al exportar: ' + e.message, 'error');
    }
  },

  async importarBackup(file) {
    try {
      UI.toast('Restaurando respaldo...', 'info', 0);

      var text = await this._readFile(file);
      var decrypted = CryptoJS.AES.decrypt(text, APP_CONFIG.sync.storageKey || 'aha-pos-default-key');
      var compressed = this._wordArrayToUint8Array(decrypted);
      var decompressed = pako.ungzip(compressed, { to: 'string' });
      var data = JSON.parse(decompressed);

      if (data.appId !== 'aha-pos') {
        UI.toast('El respaldo no corresponde a AHA POS', 'error');
        return;
      }

      var tableNames = Object.keys(data.tables);
      for (var i = 0; i < tableNames.length; i++) {
        var name = tableNames[i];
        if (!db.tables.some(function(t) { return t.name === name; })) continue;
        var records = data.tables[name];
        for (var j = 0; j < records.length; j++) {
          await db.table(name).put(records[j]);
        }
      }

      UI.toast('Respaldo restaurado exitosamente (' + tableNames.length + ' tablas)', 'success');
    } catch (e) {
      UI.toast('Error al restaurar: ' + e.message, 'error');
    }
  },

  _readFile: function(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) { resolve(e.target.result); };
      reader.onerror = function() { reject(new Error('Error reading file')); };
      reader.readAsText(file);
    });
  },

  _wordArrayToUint8Array: function(wordArray) {
    var words = wordArray.words;
    var sigBytes = wordArray.sigBytes;
    var uint8 = new Uint8Array(sigBytes);
    for (var i = 0; i < sigBytes; i++) {
      uint8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return uint8;
  }
};

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.querySelector('[data-action="import-backup"]');
  if (btn) {
    btn.addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ateje-backup';
      input.onchange = function(e) {
        if (e.target.files.length > 0) window.Sync.importarBackup(e.target.files[0]);
      };
      input.click();
    });
  }
});
