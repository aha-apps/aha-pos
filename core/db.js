(function () {
  'use strict';
  if (typeof window.db !== 'undefined') return;
  var DB_NAME = 'aha-pos';
  var SCHEMA = {};
  SCHEMA.productos = 'id, nombre, *codigoBarras, *categoriaId, precio, stock, *imagen, createdAt, updatedAt';
  SCHEMA.categorias = 'id, nombre, color, createdAt, updatedAt';
  SCHEMA.ventas = 'id, *folio, total, *metodoPago, items, *createdBy, createdAt, updatedAt';
  SCHEMA.cortes = 'id, *folio, apertura, cierre, totalEsperado, totalReal, *createdBy, createdAt, updatedAt';
  SCHEMA.devoluciones = 'id, *ventaId, *productoId, cantidad, *motivo, reembolso, createdAt';
  SCHEMA.gastosMenores = 'id, *corteId, *concepto, monto, *hora, *createdBy, createdAt';
  SCHEMA._sync_log = 'id, *tabla, *operacion, *idRegistro, *estado, *fecha, *createdBy, createdAt';
  SCHEMA._ia_chats = 'id, *titulo, *modelo, *createdBy, createdAt, updatedAt';
  SCHEMA._ia_messages = 'id, *chatId, *rol, contenido, *createdBy, createdAt';
  SCHEMA._files = '&path, tipo, nombre, mime, size, hash, refCount, createdAt, updatedAt';
  SCHEMA._analytics = 'id, *page, *category, *action, *synced, *timestamp, createdAt';
  SCHEMA._file_blobs = '&path';
  var db = new Dexie(DB_NAME);
  window.DB_VERSION = 3;
  db.version(window.DB_VERSION).stores(SCHEMA);
  window.db = db;
  window.dbLocal = {
    async getAll(table) { return db[table].toArray(); },
    async get(table, id) { return db[table].get(id); },
    async where(table, field, value) { return db[table].where(field).equals(value).toArray(); },
    async first(table, field, value) { return db[table].where(field).equals(value).first(); },
    async count(table) { return db[table].count(); }
  };
  console.log('[db] Inicializado: aha-pos');
})();
