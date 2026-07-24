(function () {
  'use strict';
  if (typeof window.MODULES !== 'undefined' && window.MODULES['corte']) return;

  // ===================================================
  // Objeto modulo: operaciones de datos (router lo usa)
  // ===================================================
  var CorteData = {
    id: 'corte',
    titulo: 'Corte de Caja',
    icono: 'bi bi-cash-stack',

    async init() {
      console.log('[corte] Inicializado');
    },

    render() {
      return '<div x-data="corteComponent()" x-init="initCorte()" class="space-y-6">' +
        '<!-- Sin corte abierto -->' +
        '<template x-if="!corteActual">' +
        '<div class="flex flex-col items-center justify-center py-16">' +
        '<div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">' +
        '<i class="bi bi-cash-stack text-4xl text-primary"></i></div>' +
        '<h2 class="text-2xl font-bold mb-2">Corte de Caja</h2>' +
        '<p class="text-base-content/50 text-sm mb-8 text-center max-w-sm">No hay ning\u00fan corte abierto. Inicia un nuevo turno para registrar las ventas del d\u00eda.</p>' +
        '<button class="btn btn-primary btn-lg btn-spring gap-2 px-10" @click="abrirCorte()">' +
        '<i class="bi bi-play-circle-fill text-lg"></i> Abrir Corte</button>' +
        '</div></template>' +

        '<!-- Corte abierto: dashboard -->' +
        '<template x-if="corteActual && !enArqueo"><div>' +
        '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">' +
        '<div><h2 class="text-xl font-bold">Corte Abierto</h2>' +
        '<p class="text-sm text-base-content/50 mt-1"><span x-text="corteActual.folio"></span> \u00b7 Abierto: <span x-text="UI.formatDate(corteActual.apertura)"></span></p></div>' +
        '<div class="flex gap-2">' +
        '<button class="btn btn-ghost btn-sm gap-1.5" @click="imprimirTicket()"><i class="bi bi-printer"></i> Ticket</button>' +
        '<button class="btn btn-primary btn-sm gap-1.5" @click="iniciarArqueo()"><i class="bi bi-calculator"></i> Iniciar Arqueo</button>' +
        '</div></div>' +
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-4"><div class="kpi-label">Ventas Hoy</div><div class="kpi-value text-primary mt-1" x-text="ventasHoy.length"></div><div class="text-xs text-base-content/50 mt-1" x-text="UI.formatCurrency(ventasHoyTotal)"></div></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-4"><div class="kpi-label">Gastos</div><div class="kpi-value text-warning mt-1" x-text="gastos.length"></div><div class="text-xs text-base-content/50 mt-1" x-text="UI.formatCurrency(gastosTotal)"></div></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-4"><div class="kpi-label">Total Esperado</div><div class="kpi-value text-secondary mt-1" x-text="UI.formatCurrency(totalEsperado)"></div><div class="text-xs text-base-content/50 mt-1">Ventas - Gastos</div></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-4"><div class="kpi-label">Transacciones</div><div class="kpi-value mt-1" x-text="ventasHoy.length + gastos.length"></div><div class="text-xs text-base-content/50 mt-1">Ventas + Gastos</div></div>' +
        '</div>' +

        '<!-- Gastos Menores -->' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5 mb-6"><div class="flex items-center justify-between mb-4"><h3 class="font-semibold">Gastos Menores</h3><button class="btn btn-ghost btn-sm gap-1.5" @click="agregarGasto()"><i class="bi bi-plus-lg"></i> Agregar</button></div>' +
        '<template x-if="gastos.length === 0"><div class="text-center py-6 text-base-content/40 text-sm"><i class="bi bi-receipt text-2xl block mb-2"></i>No hay gastos registrados en este corte</div></template>' +
        '<template x-if="gastos.length > 0"><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Concepto</th><th class="text-right">Monto</th><th class="text-right">Hora</th><th class="w-10"></th></tr></thead><tbody>' +
        '<template x-for="g in gastos" :key="g.id"><tr>' +
        '<td class="text-sm font-medium" x-text="g.concepto"></td>' +
        '<td class="text-sm text-right" x-text="UI.formatCurrency(g.monto)"></td>' +
        '<td class="text-sm text-right text-base-content/50" x-text="new Date(g.hora || g.createdAt).toLocaleTimeString(\'es-MX\',{hour:\'2-digit\',minute:\'2-digit\'})"></td>' +
        '<td class="text-right"><button class="btn btn-ghost btn-xs btn-square text-error" @click="eliminarGasto(g.id)"><i class="bi bi-trash3"></i></button></td>' +
        '</tr></template></tbody></table></div></template>' +
        '<div class="flex justify-between items-center mt-3 pt-3 border-t border-base-200"><span class="text-sm font-medium">Total Gastos</span><span class="font-bold text-warning" x-text="UI.formatCurrency(gastosTotal)"></span></div>' +
        '</div>' +

        '<!-- Historial cortes -->' +
        '<template x-if="cortes.length > 0"><div class="card bg-base-100 border border-base-200 rounded-xl p-5"><h3 class="font-semibold mb-4">\u00daltimos Cortes</h3><div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Folio</th><th>Apertura</th><th>Cierre</th><th class="text-right">Esperado</th><th class="text-right">Real</th><th class="text-right">Diferencia</th></tr></thead><tbody>' +
        '<template x-for="c in cortes.slice(0, 10)" :key="c.id"><tr>' +
        '<td class="text-sm font-medium" x-text="c.folio || \'\u2014\'"></td>' +
        '<td class="text-sm text-base-content/50" x-text="UI.formatDate(c.apertura)"></td>' +
        '<td class="text-sm text-base-content/50" x-text="c.cierre ? UI.formatDate(c.cierre) : \'\u2014\'"></td>' +
        '<td class="text-sm text-right" x-text="UI.formatCurrency(c.totalEsperado)"></td>' +
        '<td class="text-sm text-right" x-text="UI.formatCurrency(c.totalReal)"></td>' +
        '<td class="text-sm text-right" :class="(c.totalReal - c.totalEsperado) >= 0 ? \'text-success\' : \'text-error\'" x-text="UI.formatCurrency(c.totalReal - c.totalEsperado)"></td>' +
        '</tr></template></tbody></table></div></div></template>' +
        '</div></template>' +

        '<!-- Arqueo: conteo denominaciones -->' +
        '<template x-if="corteActual && enArqueo && !arqueoCompletado"><div>' +
        '<div class="flex items-center justify-between mb-6"><div><h2 class="text-xl font-bold">Arqueo de Caja</h2><p class="text-sm text-base-content/50 mt-1">Cuenta el efectivo en caja registrando la cantidad de cada denominaci\u00f3n</p></div>' +
        '<button class="btn btn-ghost btn-sm" @click="cancelarArqueo()"><i class="bi bi-x-lg"></i> Cancelar</button></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5 mb-6"><div class="space-y-2">' +
        '<template x-for="(den, idx) in denominaciones" :key="idx">' +
        '<div class="flex items-center gap-3 p-2 rounded-xl hover:bg-base-200/50 transition-colors">' +
        '<div class="flex-1 min-w-0"><div class="text-sm font-medium" x-text="den.nombre"></div></div>' +
        '<div class="flex items-center gap-2">' +
        '<button class="btn btn-ghost btn-xs btn-square" @click="actualizarDenominacion(idx, den.cantidad - 1)"><i class="bi bi-dash"></i></button>' +
        '<input type="number" class="input input-bordered input-sm w-20 text-center" :value="den.cantidad" @input.debounce="actualizarDenominacion(idx, $event.target.value)" min="0" step="1">' +
        '<button class="btn btn-ghost btn-xs btn-square" @click="actualizarDenominacion(idx, den.cantidad + 1)"><i class="bi bi-plus"></i></button>' +
        '</div><div class="text-sm font-bold text-right w-24" x-text="UI.formatCurrency(den.valor * den.cantidad)"></div>' +
        '</div></template></div></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5 mb-6"><div class="flex justify-between items-center"><span class="font-semibold">Total Contado</span><span class="text-2xl font-bold text-primary" x-text="UI.formatCurrency(totalReal)"></span></div>' +
        '<div class="flex justify-between items-center mt-2"><span class="text-sm text-base-content/50">Total Esperado</span><span class="text-lg font-semibold" x-text="UI.formatCurrency(totalEsperado)"></span></div>' +
        '<div class="flex justify-between items-center mt-2 pt-2 border-t border-base-200"><span class="text-sm font-medium">Diferencia</span>' +
        '<span class="text-lg font-bold" :class="(totalReal - totalEsperado) >= 0 ? \'text-success\' : \'text-error\'" x-text="UI.formatCurrency(totalReal - totalEsperado)"></span></div></div>' +
        '<div class="flex justify-center"><button class="btn btn-primary btn-lg btn-spring gap-2 px-10" @click="confirmarArqueo()"><i class="bi bi-check-circle-fill"></i> Confirmar Arqueo</button></div>' +
        '</div></template>' +

        '<!-- Arqueo completado: resumen + cerrar -->' +
        '<template x-if="corteActual && arqueoCompletado"><div>' +
        '<div class="flex items-center justify-between mb-6"><div><h2 class="text-xl font-bold">Arqueo Completado</h2><p class="text-sm text-base-content/50 mt-1">Revisa el resumen antes de cerrar el corte</p></div>' +
        '<button class="btn btn-ghost btn-sm" @click="cancelarArqueo()"><i class="bi bi-pencil"></i> Corregir</button></div>' +
        '<div class="card bg-base-100 border border-base-200 rounded-xl p-5 mb-6"><div class="space-y-1 mb-4">' +
        '<template x-for="den in denominaciones" :key="den.nombre"><template x-if="den.cantidad > 0">' +
        '<div class="flex justify-between text-sm py-1"><span class="text-base-content/60" x-text="den.cantidad + \' x \' + den.nombre"></span><span class="font-medium" x-text="UI.formatCurrency(den.valor * den.cantidad)"></span></div>' +
        '</template></template></div>' +
        '<div class="space-y-3 pt-3 border-t border-base-200">' +
        '<div class="flex justify-between items-center"><span class="text-base-content/60">Total Ventas</span><span class="font-medium" x-text="UI.formatCurrency(ventasHoyTotal)"></span></div>' +
        '<div class="flex justify-between items-center"><span class="text-base-content/60">Total Gastos</span><span class="font-medium text-warning" x-text="UI.formatCurrency(gastosTotal)"></span></div>' +
        '<div class="flex justify-between items-center pt-2 border-t border-base-200"><span class="font-semibold">Total Esperado</span><span class="text-lg font-semibold" x-text="UI.formatCurrency(totalEsperado)"></span></div>' +
        '<div class="flex justify-between items-center"><span class="font-semibold">Total Contado (Real)</span><span class="text-lg font-bold text-primary" x-text="UI.formatCurrency(totalReal)"></span></div>' +
        '<div class="flex justify-between items-center pt-2 border-t-2 border-base-300"><span class="text-lg font-bold">Diferencia</span>' +
        '<span class="text-xl font-bold" :class="diferencia >= 0 ? \'text-success\' : \'text-error\'" x-text="(diferencia >= 0 ? \'+\' : \'\') + UI.formatCurrency(diferencia)"></span></div></div></div>' +
        '<div class="flex justify-center gap-3">' +
        '<button class="btn btn-ghost btn-lg gap-2" @click="imprimirTicket()"><i class="bi bi-printer"></i> Imprimir Ticket</button>' +
        '<button class="btn btn-success btn-lg btn-spring gap-2 px-10" :disabled="guardando" @click="cerrarCorte()">' +
        '<i class="bi bi-lock-fill" x-show="!guardando"></i>' +
        '<span class="loading loading-spinner loading-sm" x-show="guardando"></span>' +
        '<span x-text="guardando ? \'Cerrando...\' : \'Cerrar Corte\'"></span></button></div></div></template>' +
        '</div>';
    },

    destroy() {},

    // ---- Operaciones de datos (Dexie) ----

    async cargarUltimoCorte() {
      var cortes = await db.cortes.orderBy('createdAt').reverse().toArray();
      if (cortes.length > 0) {
        var ultimo = cortes[0];
        if (!ultimo.cierre) return ultimo;
      }
      return null;
    },

    async cargarHistorial() {
      var todos = await db.cortes.orderBy('createdAt').reverse().toArray();
      return todos.filter(function (c) { return !!c.cierre; });
    },

    async cargarVentasHoy() {
      var inicio = new Date();
      inicio.setHours(0, 0, 0, 0);
      var todas = await db.ventas.toArray();
      return todas.filter(function (v) {
        var d = new Date(v.createdAt);
        return d >= inicio;
      });
    },

    async cargarGastos(corteId) {
      if (!corteId) return [];
      return await db.gastosMenores.where('corteId').equals(corteId).toArray();
    },

    _generarFolio() {
      var ahora = new Date();
      var d = ahora.toISOString().slice(0, 10).replace(/-/g, '');
      var rand = Math.floor(Math.random() * 9000) + 1000;
      return 'C-' + d + '-' + rand;
    },

    async _guardarCorteDb(corte) {
      // Deep-clone para remover proxies de Alpine (no clonables por IndexedDB)
      var plain = JSON.parse(JSON.stringify(corte));
      plain.updatedAt = new Date();
      await db.cortes.put(plain);
    },

    async _guardarGastoDb(gasto) {
      await db.gastosMenores.put(gasto);
    },

    async _eliminarGastoDb(gastoId) {
      await db.gastosMenores.delete(gastoId);
    }
  };

  // Helper escape HTML
  function _escAttr(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ===================================================
  // Factory function: Alpine component (instancia NUEVA cada vez)
  // ===================================================
  window.corteComponent = function () {
    return {
      // --- estado reactivo ---
      corteActual: null,
      cortes: [],
      ventasHoy: [],
      gastos: [],
      totalEsperado: 0,
      totalReal: 0,
      diferencia: 0,
      enArqueo: false,
      guardando: false,
      arqueoCompletado: false,
      ventasHoyTotal: 0,
      gastosTotal: 0,
      mod: null,

      denominaciones: [
        { nombre: 'Billetes $1000', valor: 1000, cantidad: 0 },
        { nombre: 'Billetes $500', valor: 500, cantidad: 0 },
        { nombre: 'Billetes $200', valor: 200, cantidad: 0 },
        { nombre: 'Billetes $100', valor: 100, cantidad: 0 },
        { nombre: 'Billetes $50', valor: 50, cantidad: 0 },
        { nombre: 'Monedas $20', valor: 20, cantidad: 0 },
        { nombre: 'Monedas $10', valor: 10, cantidad: 0 },
        { nombre: 'Monedas $5', valor: 5, cantidad: 0 },
        { nombre: 'Monedas $2', valor: 2, cantidad: 0 },
        { nombre: 'Monedas $1', valor: 1, cantidad: 0 }
      ],

      async initCorte() {
        var self = this;
        self.mod = window.CorteData;
        if (!self.mod) return;
        await self._refrescar();
      },

      async _refrescar() {
        var self = this;
        try {
          self.corteActual = await self.mod.cargarUltimoCorte();
          self.cortes = await self.mod.cargarHistorial();
          self.ventasHoy = await self.mod.cargarVentasHoy();
          if (self.corteActual && !self.corteActual.cierre) {
            self.gastos = await self.mod.cargarGastos(self.corteActual.id);
          } else {
            self.gastos = [];
          }
          self._recalcularTotales();
        } catch (e) {
          console.error('[corte] Error refreshing:', e);
        }
      },

      _recalcularTotales() {
        var self = this;
        self.ventasHoyTotal = self.ventasHoy.reduce(function (s, v) { return s + (v.total || 0); }, 0);
        self.gastosTotal = self.gastos.reduce(function (s, g) { return s + (g.monto || 0); }, 0);
        self.totalEsperado = self.ventasHoyTotal - self.gastosTotal;
      },

      // --- Acciones ---

      async abrirCorte() {
        var self = this;
        try {
          if (self.corteActual && !self.corteActual.cierre) {
            UI.toast('Ya hay un corte abierto', 'warning');
            return;
          }
          var corte = {
            id: window.uuid(),
            folio: self.mod._generarFolio(),
            apertura: new Date(),
            cierre: null,
            totalEsperado: 0,
            totalReal: 0,
            createdBy: Alpine.store('app').usuario || 'cajero',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await self.mod._guardarCorteDb(corte);
          await self._refrescar();
          UI.toast('Corte abierto: ' + corte.folio, 'success');
        } catch (e) {
          console.error('[corte] Error abriendo corte:', e);
          UI.toast('Error al abrir corte: ' + e.message, 'error');
        }
      },

      agregarGasto() {
        var self = this;
        var html =
          '<div class="space-y-3">' +
          '  <label class="form-control w-full">' +
          '    <span class="label-text mb-1 font-medium">Concepto</span>' +
          '    <input type="text" name="concepto" class="input input-bordered w-full" placeholder="Ej: Caf\u00e9, pasajes..." required>' +
          '  </label>' +
          '  <label class="form-control w-full">' +
          '    <span class="label-text mb-1 font-medium">Monto ($)</span>' +
          '    <input type="number" name="monto" class="input input-bordered w-full" placeholder="0.00" step="0.01" min="0.01" required>' +
          '  </label>' +
          '</div>';
        UI.modalForm('Agregar Gasto Menor', html, async function (data) {
          if (!data.concepto || !data.monto || data.monto <= 0) {
            UI.toast('Completa todos los campos', 'warning');
            return;
          }
          await self._guardarGasto(data);
        });
      },

      async _guardarGasto(data) {
        var self = this;
        try {
          if (!self.corteActual) return;
          var gasto = {
            id: window.uuid(),
            corteId: self.corteActual.id,
            concepto: data.concepto,
            monto: parseFloat(data.monto) || 0,
            hora: new Date(),
            createdBy: Alpine.store('app').usuario || 'cajero',
            createdAt: new Date()
          };
          await self.mod._guardarGastoDb(gasto);
          self.gastos = await self.mod.cargarGastos(self.corteActual.id);
          self._recalcularTotales();
          UI.toast('Gasto registrado', 'success');
        } catch (e) {
          console.error('[corte] Error guardando gasto:', e);
          UI.toast('Error: ' + e.message, 'error');
        }
      },

      async eliminarGasto(gastoId) {
        var self = this;
        var ok = await UI.confirm('\u00bfEliminar este gasto?', 'Confirmar');
        if (!ok) return;
        try {
          await self.mod._eliminarGastoDb(gastoId);
          self.gastos = await self.mod.cargarGastos(self.corteActual.id);
          self._recalcularTotales();
          UI.toast('Gasto eliminado', 'success');
        } catch (e) {
          console.error('[corte] Error eliminando gasto:', e);
          UI.toast('Error: ' + e.message, 'error');
        }
      },

      iniciarArqueo() {
        var self = this;
        if (self.enArqueo) return;
        self.enArqueo = true;
        self.arqueoCompletado = false;
        self.denominaciones.forEach(function (d) { d.cantidad = 0; });
        self.totalReal = 0;
        self.diferencia = 0;
      },

      cancelarArqueo() {
        var self = this;
        self.enArqueo = false;
        self.arqueoCompletado = false;
      },

      actualizarDenominacion(idx, val) {
        var self = this;
        var c = parseInt(val) || 0;
        if (c < 0) c = 0;
        self.denominaciones[idx].cantidad = c;
        self.totalReal = self._calcularTotalReal();
      },

      _calcularTotalReal() {
        var total = 0;
        for (var i = 0; i < this.denominaciones.length; i++) {
          total += this.denominaciones[i].valor * this.denominaciones[i].cantidad;
        }
        return total;
      },

      confirmarArqueo() {
        var self = this;
        var totalContado = self._calcularTotalReal();
        if (totalContado === 0) {
          UI.confirm('\u00bfNing\u00fan billete o moneda registrado? El arqueo quedar\u00e1 con $0.00.', 'Arqueo vac\u00edo').then(function (ok) {
            if (!ok) return;
            self._finalizarArqueo(totalContado);
          });
          return;
        }
        self._finalizarArqueo(totalContado);
      },

      _finalizarArqueo(totalContado) {
        var self = this;
        self.totalReal = totalContado;
        self.diferencia = self.totalReal - self.totalEsperado;
        self.arqueoCompletado = true;
      },

      async cerrarCorte() {
        var self = this;
        if (!self.corteActual || self.guardando) return;
        var difColor = self.diferencia >= 0 ? 'text-success' : 'text-error';
        var difSigno = self.diferencia >= 0 ? '+' : '';
        var gastosHtml = '';
        for (var i = 0; i < self.gastos.length; i++) {
          var g = self.gastos[i];
          gastosHtml += '<div class="flex justify-between text-xs py-1"><span>' + _escAttr(g.concepto) + '</span><span class="tabular-nums text-error">-$' + Number(g.monto).toFixed(2) + '</span></div>';
        }
        var html = '' +
          '<div class="space-y-3">' +
            '<div class="bg-base-200 rounded-xl p-4 space-y-2">' +
              '<div class="flex justify-between text-sm"><span class="text-base-content/50">Ventas del d\u00eda</span><span class="font-semibold tabular-nums text-success">$' + self.ventasHoyTotal.toFixed(2) + '</span></div>' +
              '<div class="flex justify-between text-sm"><span class="text-base-content/50">Total gastos</span><span class="font-semibold tabular-nums text-error">-$' + self.gastosTotal.toFixed(2) + '</span></div>' +
              '<div class="border-t border-base-300 pt-2 flex justify-between text-sm font-bold"><span>Total esperado</span><span class="tabular-nums">$' + self.totalEsperado.toFixed(2) + '</span></div>' +
            '</div>' +
            '<div class="bg-base-200 rounded-xl p-4 space-y-2">' +
              '<div class="flex justify-between text-sm"><span class="text-base-content/50">Total contado (arqueo)</span><span class="font-semibold tabular-nums">$' + self.totalReal.toFixed(2) + '</span></div>' +
              '<div class="border-t border-base-300 pt-2 flex justify-between text-base font-bold">' +
                '<span>Diferencia</span>' +
                '<span class="tabular-nums ' + difColor + '">' + difSigno + '$' + Math.abs(self.diferencia).toFixed(2) + '</span>' +
              '</div>' +
            '</div>' +
            (gastosHtml ? '<div class="bg-base-200 rounded-xl p-4"><div class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Gastos del turno</div>' + gastosHtml + '</div>' : '') +
            '<div class="text-xs text-center text-base-content/40 pt-1">El corte se cerrar\u00e1 y no podr\u00e1 modificarse.</div>' +
          '</div>';
        var ok = await new Promise(function (resolve) {
          var overlay = document.createElement('div');
          overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4';
          var dialog = document.createElement('div');
          dialog.className = 'modal-box max-w-md rounded-2xl';
          dialog.innerHTML =
            '<h3 class="font-bold text-lg mb-2">Resumen de cierre</h3>' +
            html +
            '<div class="modal-action mt-4">' +
            '<button class="btn btn-ghost" data-cancel>Cancelar</button>' +
            '<button class="btn btn-primary" data-confirm>' +
            '<i class="bi bi-lock-fill"></i> Cerrar Corte</button>' +
            '</div>';
          overlay.appendChild(dialog);
          document.body.appendChild(overlay);
          function cleanup() { overlay.remove(); }
          dialog.querySelector('[data-cancel]').onclick = function () { cleanup(); resolve(false); };
          dialog.querySelector('[data-confirm]').onclick = function () { cleanup(); resolve(true); };
          overlay.onclick = function (e) { if (e.target === overlay) { cleanup(); resolve(false); } };
        });
        if (!ok) return;
        self.guardando = true;
        try {
          self.corteActual.cierre = new Date();
          self.corteActual.totalEsperado = self.totalEsperado;
          self.corteActual.totalReal = self.totalReal;
          self.corteActual.updatedAt = new Date();
          await self.mod._guardarCorteDb(self.corteActual);
          UI.toast('Corte cerrado: ' + self.corteActual.folio, 'success');
          await self._refrescar();
        } catch (e) {
          console.error('[corte] Error cerrando corte:', e);
          UI.toast('Error al cerrar: ' + e.message, 'error');
        } finally {
          self.guardando = false;
        }
      },

      imprimirTicket() {
        var self = this;
        try {
          var totalV = self.ventasHoy.reduce(function (s, x) { return s + (x.total || 0); }, 0);
          var totalG = self.gastos.reduce(function (s, x) { return s + (x.monto || 0); }, 0);
          var titulo = self.corteActual ? 'CORTE DE CAJA' : 'CORTE CERRADO';
          var folio = self.corteActual ? self.corteActual.folio : '\u2014';
          var apertura = self.corteActual ? new Date(self.corteActual.apertura).toLocaleString('es-MX') : '';
          var cierre = self.corteActual && self.corteActual.cierre ? new Date(self.corteActual.cierre).toLocaleString('es-MX') : '';

          var w = window.open('', '_blank', 'width=400,height=600');
          if (!w) { UI.toast('Permite ventanas emergentes para imprimir', 'warning'); return; }
          w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + titulo + '</title><style>' +
            'body{font-family:monospace;font-size:12px;padding:16px;text-align:center;}' +
            'h2{font-size:16px;margin:0 0 4px}.folio{font-size:11px;color:#666;margin-bottom:16px}' +
            'table{width:100%;border-collapse:collapse;margin:12px 0;text-align:left}' +
            'th,td{padding:4px 8px;border-bottom:1px solid #ddd}' +
            'th{font-size:10px;text-transform:uppercase;color:#666}' +
            '.total-row{font-weight:bold;border-top:2px solid #000}' +
            '.diferencia{font-size:14px;font-weight:bold;margin:12px 0}' +
            '.footer{margin-top:20px;font-size:10px;color:#999}' +
            '.line{border-top:1px dashed #999;margin:12px 0}' +
            '</style></head><body>' +
            '<h2>AHA POS</h2>' +
            '<div class="folio">' + titulo + '<br>' + folio + '</div>' +
            '<div class="line"></div>' +
            '<div style="text-align:left;font-size:11px;margin-bottom:12px">' +
            'Apertura: ' + apertura + '<br>' +
            (cierre ? 'Cierre: ' + cierre + '<br>' : '') +
            '</div><div class="line"></div>' +
            '<h3 style="text-align:left;font-size:12px;margin:8px 0">Ventas del d\u00eda</h3>' +
            '<table><thead><tr><th>Folio</th><th>M\u00e9todo</th><th style="text-align:right">Total</th></tr></thead><tbody>');
          for (var i = 0; i < self.ventasHoy.length; i++) {
            var v = self.ventasHoy[i];
            w.document.write('<tr><td>' + (v.folio || '\u2014') + '</td><td>' + (v.metodoPago || '\u2014') + '</td><td style="text-align:right">$' + Number(v.total || 0).toFixed(2) + '</td></tr>');
          }
          w.document.write('</tbody></table><div style="text-align:right;font-weight:bold">Total Ventas: $' + totalV.toFixed(2) + '</div><div class="line"></div>' +
            '<h3 style="text-align:left;font-size:12px;margin:8px 0">Gastos</h3>');
          if (self.gastos.length === 0) {
            w.document.write('<div style="text-align:left;font-size:11px;color:#999;margin:4px 0">Sin gastos registrados</div>');
          } else {
            w.document.write('<table><thead><tr><th>Concepto</th><th style="text-align:right">Monto</th></tr></thead><tbody>');
            for (var j = 0; j < self.gastos.length; j++) {
              w.document.write('<tr><td>' + self.gastos[j].concepto + '</td><td style="text-align:right">$' + Number(self.gastos[j].monto || 0).toFixed(2) + '</td></tr>');
            }
            w.document.write('</tbody></table>');
          }
          w.document.write(
            '<div style="text-align:right;font-weight:bold;color:#666">Total Gastos: $' + totalG.toFixed(2) + '</div><div class="line"></div>' +
            '<div class="diferencia">Esperado: $' + self.totalEsperado.toFixed(2) + '</div>' +
            '<div class="diferencia">Real: $' + self.totalReal.toFixed(2) + '</div>' +
            '<div class="diferencia" style="color:' + (self.diferencia >= 0 ? '#059669' : '#ef4444') + '">Diferencia: $' + self.diferencia.toFixed(2) + '</div>' +
            '<div class="line"></div>' +
            '<div class="footer">Generado por AHA POS<br>' + new Date().toLocaleString('es-MX') + '</div>' +
            '</body></html>');
          w.document.close();
          w.focus();
          w.print();
        } catch (e) {
          console.error('[corte] Error imprimiendo ticket:', e);
          UI.toast('Error al imprimir: ' + e.message, 'error');
        }
      }
    };
  };

  // ===================================================
  // Registrar modulo (el router usa este objeto)
  // ===================================================
  window.CorteData = CorteData;
  window.MODULES = window.MODULES || {};
  window.MODULES['corte'] = CorteData;


})();