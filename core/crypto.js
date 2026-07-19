(function () {
  'use strict';
  if (typeof window.cryptoHelpers !== 'undefined') return;
  var STORAGE_KEY = 'aha-crypto-key';
  function getOrCreateKey() {
    var key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
      key = CryptoJS.lib.WordArray.random(256 / 8).toString(CryptoJS.enc.Hex);
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  }
  window.cryptoHelpers = {
    encrypt: function (plainText) {
      if (!plainText) return plainText;
      try {
        var key = getOrCreateKey();
        return CryptoJS.AES.encrypt(String(plainText), key).toString();
      } catch (e) {
        console.warn('[crypto] Error encrypting:', e);
        return plainText;
      }
    },
    decrypt: function (cipherText) {
      if (!cipherText) return cipherText;
      if (!cipherText.startsWith('U2FsdGVkX1')) return cipherText;
      try {
        var key = getOrCreateKey();
        var bytes = CryptoJS.AES.decrypt(cipherText, key);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch (e) {
        console.warn('[crypto] Error decrypting:', e);
        return cipherText;
      }
    },
    hash: function (data) {
      return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
    }
  };
  window.uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  };
  console.log('[crypto] Inicializado');
})();
