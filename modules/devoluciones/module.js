(function () {
  'use strict';

  var Devoluciones = {
    id: 'devoluciones',
    titulo: 'Devoluciones',
    icono: 'bi bi-arrow-return-left',

    devoluciones: [],
    ventas: [],

    init: async function () {
      console.log('[devoluciones] Inicializado');
    },

    render: async function (params) {
      try {
        var d = window.db.devoluciones.toArray();
        var v = window.db.ventas.toArray();
        var res = await Promise.all([d, v]);
        this.devoluciones = res[0];
        this.ventas = res[1];
        this.devoluciones.sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      } catch (e) {
        console.error('[devoluciones] Error cargando:', e);
      }
      var html = this._getTemplate();
      return html;
    },

    destroy: function () {},

    getVenta: function (ventaId) {
      if (!ventaId || !this.ventas) return null;
      for (var i = 0; i < this.ventas.length; i++) {
        if (this.ventas[i].id === ventaId) return this.ventas[i];
      }
      return null;
    },

    guardarDevolucion: async function (data) {
      try {
        if (!data.ventaId || !data.items || data.items.length === 0) {
          if (window.UI) UI.toast('Selecciona al menos un producto', 'warning');
          return false;
        }
        var totalCant = 0;
        for (var i = 0; i < data.items.length; i++) {
          totalCant += (data.items[i].cantidad || 1);
        }
        var dev = {
          id: window.uuid(),
          ventaId: data.ventaId,
          productoId: data.items[0].productoId || '',
          cantidad: totalCant,
          motivo: data.motivo || 'otro',
          reembolso: data.reembolso || 'parcial',
          items: data.items,
          createdAt: new Date()
        };
        await window.db.devoluciones.put(dev);
        for (var j = 0; j < data.items.length; j++) {
          var it = data.items[j];
          if (it.productoId) {
            var prod = await window.db.productos.get(it.productoId);
            if (prod) {
              prod.stock = (prod.stock || 0) + (it.cantidad || 1);
              prod.updatedAt = new Date();
              await window.db.productos.put(prod);
            }
          }
        }
        this.devoluciones.unshift(dev);
        if (window.appRouter) window.appRouter.refreshContent(this._getTemplate());
        if (window.UI) UI.toast('Devoluci\u00f3n registrada correctamente', 'success');
        return true;
      } catch (e) {
        if (window.UI) UI.toast('Error: ' + e.message, 'error');
        return false;
      }
    },

    _getTemplate: function () {
      var self = this;

      function esc(str) {
        if (typeof str !== 'string') return String(str || '');
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
      }

      function fmtDate(d) {
        if (!d) return '';
        var dt = d instanceof Date ? d : new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
      }

      function fmtMoney(n) {
        var num = typeof n === 'string' ? parseFloat(n) : (n || 0);
        return '$' + Number(num).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      function motivoLabel(m) {
        var map = { defecto: 'Defecto', 'cambio de opinion': 'Cambio de opini\u00f3n', error: 'Error del vendedor', otro: 'Otro' };
        return map[m] || m || 'Otro';
      }

      function safeItems(items) {
        if (!items) return [];
        if (typeof items === 'string') {
          try { return JSON.parse(items); } catch (e) { return []; }
        }
        return items;
      }

      var devRows = '';
      if (self.devoluciones.length === 0) {
        devRows =
          '<div class="empty-state">' +
          '<div class="empty-state-icon bg-warning/10 text-warning"><i class="bi bi-arrow-return-left"></i></div>' +
          '<div class="empty-state-title">Sin devoluciones</div>' +
          '<div class="empty-state-desc">No hay devoluciones registradas a\u00fan. Usa el bot\u00f3n "Nueva Devoluci\u00f3n" para comenzar.</div>' +
          '</div>';
      } else {
        devRows = '<div class="overflow-x-auto"><table class="table table-zebra table-sm">' +
          '<thead><tr><th>Folio Venta</th><th>Producto(s)</th><th>Cant</th><th>Motivo</th><th>Reembolso</th><th>Fecha</th></tr></thead><tbody>';
        for (var i = 0; i < self.devoluciones.length; i++) {
          var d = self.devoluciones[i];
          var venta = self.getVenta(d.ventaId);
          var folio = venta ? esc(venta.folio || venta.id.slice(0, 8)) : '—';
          var prodName = '—';
          var items = safeItems(d.items);
          if (items.length > 0) {
            prodName = esc(items[0].nombre || items[0].productoId || '');
            if (items.length > 1) prodName += ' +' + (items.length - 1);
          } else if (d.productoId) {
            prodName = esc(d.productoId);
          }
          var badgeColor = d.reembolso === 'total' ? 'badge-error' : 'badge-warning';
          devRows += '<tr>' +
            '<td class="font-medium text-sm">' + folio + '</td>' +
            '<td class="text-sm">' + prodName + '</td>' +
            '<td class="text-sm">' + d.cantidad + '</td>' +
            '<td><span class="badge badge-ghost badge-sm">' + esc(motivoLabel(d.motivo)) + '</span></td>' +
            '<td><span class="badge badge-sm ' + badgeColor + '">' + esc(d.reembolso || 'parcial') + '</span></td>' +
            '<td class="text-sm text-base-content/60">' + fmtDate(d.createdAt) + '</td>' +
            '</tr>';
        }
        devRows += '</tbody></table></div>';
      }

      var ventasJson = JSON.stringify(self.ventas.slice(-50).reverse());
      var devJson = JSON.stringify(self.devoluciones);

      var html =
        '<div x-data="{' +
        'paso: 1,' +
        'modo: \'lista\',' +
        'busqueda: \'\',' +
        'ventasFiltradas: [],' +
        'ventaSel: null,' +
        'itemsSel: [],' +
        'cantidades: {},' +
        'motivo: \'defecto\',' +
        'reembolso: \'parcial\',' +
        'guardando: false,' +
        'devoluciones: ' + devJson + ',' +
        'init: function() {' +
        '  this.ventasFiltradas = (window.MODULES.devoluciones.ventas || []).slice(-30).reverse();' +
        '},' +
        'buscarVentas: function() {' +
        '  var q = this.busqueda.toLowerCase().trim();' +
        '  var todas = window.MODULES.devoluciones.ventas || [];' +
        '  if (!q || q.length < 2) { this.ventasFiltradas = todas.slice(-20).reverse(); return; }' +
        '  this.ventasFiltradas = todas.filter(function(v) { return v.folio && v.folio.toLowerCase().indexOf(q) !== -1; }).slice(0, 20);' +
        '},' +
        'seleccionarVenta: function(v) {' +
        '  this.ventaSel = v; this.itemsSel = []; this.cantidades = {}; this.paso = 2;' +
        '},' +
        'toggleItem: function(item, e) {' +
        '  var id = item.productoId || item.id || item.nombre || JSON.stringify(item);' +
        '  if (e.target.checked) { this.itemsSel.push(item); this.cantidades[id] = item.cantidad || 1; }' +
        '  else { this.itemsSel = this.itemsSel.filter(function(i) { return (i.productoId || i.id || i.nombre || JSON.stringify(i)) !== id; }); delete this.cantidades[id]; }' +
        '},' +
        'actualizarCantidad: function(item, val) {' +
        '  var id = item.productoId || item.id || item.nombre || JSON.stringify(item);' +
        '  var max = item.cantidad || 1;' +
        '  var v = parseInt(val) || 1;' +
        '  if (v < 1) v = 1; if (v > max) v = max;' +
        '  this.cantidades[id] = v;' +
        '},' +
        'get ventaItems() { return this.ventaSel ? (function(arr) { if (!arr) return []; if (typeof arr === \'string\') { try { return JSON.parse(arr); } catch(e) {} return []; } return arr; })(this.ventaSel.items) : []; },' +
        'get pasoHabilitado() {' +
        '  if (this.paso === 1) return !!this.ventaSel;' +
        '  if (this.paso === 2) return this.itemsSel.length > 0;' +
        '  return true;' +
        '},' +
        'get itemsConfirmados() { return this.itemsSel.map(function(i) { var id = i.productoId || i.id || i.nombre || \'\'; return { productoId: i.productoId || \'\', nombre: i.nombre || \'\', precio: i.precio || 0, cantidad: (this.cantidades[id] || i.cantidad || 1) }; }.bind(this)); },' +
        'get totalReembolso() { var t = 0; for (var i = 0; i < this.itemsSel.length; i++) { var it = this.itemsSel[i]; var id = it.productoId || it.id || it.nombre || \'\'; var c = this.cantidades[id] || it.cantidad || 1; t += (it.precio || 0) * c; } return t; },' +
        'confirmarDevolucion: async function() {' +
        '  this.guardando = true;' +
        '  try {' +
        '    var items = [];' +
        '    for (var i = 0; i < this.itemsSel.length; i++) {' +
        '      var it = this.itemsSel[i];' +
        '      var id = it.productoId || it.id || it.nombre || \'\';' +
        '      items.push({ productoId: it.productoId || \'\', nombre: it.nombre || \'\', precio: it.precio || 0, cantidad: parseInt(this.cantidades[id]) || it.cantidad || 1 });' +
        '    }' +
        '    var ok = await window.MODULES.devoluciones.guardarDevolucion({ ventaId: this.ventaSel.id, items: items, motivo: this.motivo, reembolso: this.reembolso });' +
        '    if (ok) {' +
        '      this.modo = \'lista\'; this.paso = 1; this.ventaSel = null; this.itemsSel = []; this.cantidades = {};' +
        '      this.busqueda = \'\'; this.motivo = \'defecto\'; this.reembolso = \'parcial\';' +
        '      this.devoluciones = window.MODULES.devoluciones.devoluciones;' +
        '    }' +
        '  } catch(e) { if (window.UI) UI.toast(\'Error: \' + e.message, \'error\'); }' +
        '  finally { this.guardando = false; }' +
        '},' +
        'cancelar: function() {' +
        '  this.modo = \'lista\'; this.paso = 1; this.ventaSel = null; this.itemsSel = []; this.cantidades = {};' +
        '  this.busqueda = \'\'; this.motivo = \'defecto\'; this.reembolso = \'parcial\';' +
        '},' +
        'fmtDate: function(d) { if (!d) return \'\'; var dt = d instanceof Date ? d : new Date(d); if (isNaN(dt.getTime())) return \'\'; return dt.toLocaleDateString(\'es-MX\', { day: \'numeric\', month: \'short\', year: \'numeric\' }).replace(/\\./g, \'\'); },' +
        'fmtMoney: function(n) { var num = typeof n === \'string\' ? parseFloat(n) : (n || 0); return \'$\' + Number(num).toLocaleString(\'es-MX\', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },' +
        'motivoLabel: function(m) { var map = { defecto: \'Defecto\', \'cambio de opinion\': \'Cambio de opini\u00f3n\', error: \'Error del vendedor\', otro: \'Otro\' }; return map[m] || m || \'Otro\'; }' +
        '}" class="space-y-6">' +

        '<!-- Toolbar (solo visible en modo lista) -->' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3" x-show="modo === \'lista\'">' +
        '<h2 class="text-xl font-bold">Devoluciones</h2>' +
        '<button class="btn btn-primary" @click="modo = \'nuevo\'; paso = 1; ventaSel = null; itemsSel = []; cantidades = {}; busqueda = \'\'">' +
        '<i class="bi bi-plus-lg"></i> Nueva Devoluci\u00f3n</button>' +
        '</div>' +

        '<!-- Step indicator -->' +
        '<div x-show="modo === \'nuevo\'" x-cloak class="flex items-center gap-2 text-sm mb-4">' +
        '<template x-for="(s, i) in [\'Venta\', \'Productos\', \'Detalles\', \'Confirmar\']" :key="i">' +
        '<div class="flex items-center gap-2">' +
        '<div :class="{\'bg-primary text-primary-content\': paso >= i+1, \'bg-base-300 text-base-content/40\': paso < i+1}" class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" x-text="i+1"></div>' +
        '<span :class="{\'font-medium text-base-content\': paso === i+1, \'text-base-content/40\': paso !== i+1}" class="hidden sm:inline" x-text="s"></span>' +
        '<template x-if="i < 3"><i class="bi bi-chevron-right text-base-content/20 text-xs"></i></template>' +
        '</div>' +
        '</template>' +
        '</div>' +

        '<!-- Wrapper wizard (solo visible en modo nuevo) -->' +
        '<div x-show="modo === \'nuevo\'">' +
        '<!-- Boton volver a lista -->' +
        '<button class="btn btn-ghost btn-sm gap-1 mb-2" @click="cancelar"><i class="bi bi-arrow-left"></i> Volver a devoluciones</button>' +

        '<!-- Step 1: Seleccionar Venta -->' +
        '<div x-show="paso === 1">' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5">' +
        '<label class="form-control w-full mb-4">' +
        '<span class="label-text mb-1 font-medium">Buscar venta por folio</span>' +
        '<div class="relative">' +
        '<i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30"></i>' +
        '<input type="text" class="input input-bordered w-full pl-10" placeholder="Escribe el folio..." x-model="busqueda" @input.debounce.300ms="buscarVentas">' +
        '</div>' +
        '</label>' +
        '<div class="space-y-2 max-h-96 overflow-y-auto">' +
        '<template x-for="v in ventasFiltradas" :key="v.id">' +
        '<div class="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 cursor-pointer transition-colors" :class="{\'bg-primary/5 border border-primary/20\': ventaSel && ventaSel.id === v.id}" @click="seleccionarVenta(v)">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="font-medium text-sm" x-text="v.folio || v.id.slice(0,8)"></div>' +
        '<div class="text-xs text-base-content/50">' +
        '<span x-text="v.metodoPago || \'\'"></span>' +
        '<span x-show="v.createdAt"> &middot; <span x-text="fmtDate(v.createdAt)"></span></span>' +
        '</div>' +
        '</div>' +
        '<div class="text-right shrink-0 ml-3">' +
        '<div class="font-semibold text-sm" x-text="fmtMoney(v.total)"></div>' +
        '<div class="text-xs text-base-content/40" x-text="(v.items ? (typeof v.items === \'string\' ? JSON.parse(v.items).length : v.items.length) : 0) + \' art\u00edculo(s)\'"></div>' +
        '</div>' +
        '</div>' +
        '</template>' +
        '<template x-if="ventasFiltradas.length === 0 && !busqueda">' +
        '<div class="text-center py-8 text-base-content/40 text-sm"><i class="bi bi-inbox text-2xl block mb-2 opacity-30"></i>No hay ventas registradas. Realiza una venta primero.</div>' +
        '</template>' +
        '<template x-if="ventasFiltradas.length === 0 && busqueda">' +
        '<div class="text-center py-8 text-base-content/40 text-sm"><i class="bi bi-search text-2xl block mb-2 opacity-30"></i>Ninguna venta coincide con <span class="font-medium" x-text="\'\\u201C\' + busqueda + \'\\u201D\'"></span></div>' +
        '</template>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<!-- Step 2: Seleccionar Productos -->' +
        '<div x-show="paso === 2" x-cloak>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5">' +
        '<div class="flex items-center justify-between mb-4">' +
        '<div><div class="font-semibold">Productos de la venta</div>' +
        '<div class="text-xs text-base-content/50" x-text="ventaSel ? ventaSel.folio || ventaSel.id.slice(0,8) : \'\'"></div></div>' +
        '<span class="text-xs badge badge-ghost" x-text="itemsSel.length + \' seleccionado(s)\'"></span>' +
        '</div>' +
        '<div class="space-y-2">' +
        '<template x-for="(item, idx) in ventaItems" :key="idx">' +
        '<label class="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 cursor-pointer border border-base-200">' +
        '<input type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleItem(item, $event)">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="font-medium text-sm" x-text="item.nombre || \'Producto\'"></div>' +
        '<div class="text-xs text-base-content/50">' +
        '<span x-text="fmtMoney(item.precio)"></span> x <span x-text="item.cantidad || 1"></span>' +
        '</div>' +
        '</div>' +
        '<div class="text-sm font-medium" x-text="fmtMoney((item.precio || 0) * (item.cantidad || 1))"></div>' +
        '</label>' +
        '</template>' +
        '</div>' +
        '<div class="flex justify-between mt-6">' +
        '<button class="btn btn-ghost" @click="paso = 1; ventaSel = null"><i class="bi bi-arrow-left"></i> Atr\u00e1s</button>' +
        '<button class="btn btn-primary" :disabled="itemsSel.length === 0" @click="paso = 3">Siguiente <i class="bi bi-arrow-right"></i></button>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<!-- Step 3: Detalles de la Devoluci\u00f3n -->' +
        '<div x-show="paso === 3" x-cloak>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5">' +
        '<div class="font-semibold mb-4">Detalles de la devoluci\u00f3n</div>' +

        '<div class="space-y-3 mb-5">' +
        '<template x-for="(item, idx) in itemsSel" :key="idx">' +
        '<div class="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="text-sm font-medium" x-text="item.nombre || \'Producto\'"></div>' +
        '<div class="text-xs text-base-content/50"><span x-text="fmtMoney(item.precio)"></span> / ud.</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<button class="btn btn-ghost btn-xs btn-square" @click="actualizarCantidad(item, (cantidades[item.productoId || item.id || item.nombre || JSON.stringify(item)] || item.cantidad || 1) - 1)"><i class="bi bi-dash"></i></button>' +
        '<input type="number" class="input input-bordered input-xs w-16 text-center" ' +
        ':value="cantidades[item.productoId || item.id || item.nombre || JSON.stringify(item)] || item.cantidad || 1" ' +
        '@input.debounce="actualizarCantidad(item, $event.target.value)"' +
        ':max="item.cantidad || 1" min="1">' +
        '<button class="btn btn-ghost btn-xs btn-square" @click="actualizarCantidad(item, (cantidades[item.productoId || item.id || item.nombre || JSON.stringify(item)] || item.cantidad || 1) + 1)"><i class="bi bi-plus"></i></button>' +
        '</div>' +
        '</div>' +
        '</template>' +
        '</div>' +

        '<label class="form-control w-full mb-3">' +
        '<span class="label-text mb-1 font-medium">Motivo de la devoluci\u00f3n</span>' +
        '<select class="select select-bordered" x-model="motivo">' +
        '<option value="defecto">Defecto</option>' +
        '<option value="cambio de opinion">Cambio de opini\u00f3n</option>' +
        '<option value="error">Error del vendedor</option>' +
        '<option value="otro">Otro</option>' +
        '</select>' +
        '</label>' +

        '<label class="form-control w-full">' +
        '<span class="label-text mb-1 font-medium">Tipo de reembolso</span>' +
        '<div class="flex gap-3">' +
        '<label class="flex items-center gap-2 cursor-pointer"><input type="radio" class="radio radio-primary radio-sm" value="parcial" x-model="reembolso"> Parcial</label>' +
        '<label class="flex items-center gap-2 cursor-pointer"><input type="radio" class="radio radio-primary radio-sm" value="total" x-model="reembolso"> Total</label>' +
        '</div>' +
        '</label>' +

        '<div class="flex justify-between mt-6">' +
        '<button class="btn btn-ghost" @click="paso = 2"><i class="bi bi-arrow-left"></i> Atr\u00e1s</button>' +
        '<button class="btn btn-primary" @click="paso = 4">Siguiente <i class="bi bi-arrow-right"></i></button>' +
        '</div>' +
        '</div>' +
        '</div>' +

        '<!-- Step 4: Confirmar y Guardar -->' +
        '<div x-show="paso === 4" x-cloak>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5">' +
        '<div class="font-semibold mb-4">Confirmar devoluci\u00f3n</div>' +

        '<div class="bg-base-200/50 rounded-xl p-4 mb-4 space-y-2">' +
        '<div class="flex justify-between text-sm"><span class="text-base-content/60">Folio venta:</span><span class="font-medium" x-text="ventaSel ? ventaSel.folio || ventaSel.id.slice(0,8) : \'\'"></span></div>' +
        '<div class="flex justify-between text-sm"><span class="text-base-content/60">Motivo:</span><span class="font-medium" x-text="motivoLabel(motivo)"></span></div>' +
        '<div class="flex justify-between text-sm"><span class="text-base-content/60">Reembolso:</span><span class="font-medium" :class="reembolso === \'total\' ? \'text-error\' : \'text-warning\'" x-text="reembolso === \'total\' ? \'Total\' : \'Parcial\'"></span></div>' +
        '</div>' +

        '<div class="space-y-2 mb-4">' +
        '<template x-for="(item, idx) in itemsSel" :key="idx">' +
        '<div class="flex items-center justify-between p-2">' +
        '<div class="text-sm"><span x-text="item.nombre"></span> x <span x-text="cantidades[item.productoId || item.id || item.nombre || JSON.stringify(item)] || item.cantidad || 1"></span></div>' +
        '<div class="text-sm font-medium" x-text="fmtMoney((item.precio || 0) * (cantidades[item.productoId || item.id || item.nombre || JSON.stringify(item)] || item.cantidad || 1))"></div>' +
        '</div>' +
        '</template>' +
        '</div>' +

        '<div class="flex justify-between items-center py-2 border-t border-base-300">' +
        '<span class="font-semibold">Total a reembolsar</span>' +
        '<span class="text-lg font-bold text-primary" x-text="fmtMoney(totalReembolso)"></span>' +
        '</div>' +

        '<div class="flex justify-between mt-6">' +
        '<button class="btn btn-ghost" @click="paso = 3"><i class="bi bi-arrow-left"></i> Atr\u00e1s</button>' +
        '<button class="btn btn-success" :disabled="guardando" @click="confirmarDevolucion">' +
        '<i class="bi bi-check-lg" x-show="!guardando"></i>' +
        '<span class="loading loading-spinner loading-sm" x-show="guardando"></span>' +
        '<span x-text="guardando ? \'Guardando...\' : \'Confirmar Devoluci\u00f3n\'"></span>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' + // cierra wizard wrapper

        '<!-- Historial de devoluciones -->' +
        '<div x-show="modo === \'lista\'">' +
        devRows +
        '</div>' +

        '</div>';

      return html;
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES[Devoluciones.id] = Devoluciones;
})();
