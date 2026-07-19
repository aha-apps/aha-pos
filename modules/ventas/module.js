(function () {
  'use strict';
  if (window.MODULES && window.MODULES['ventas']) return;

  var Ventas = {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'bi bi-cart3',

    carrito: [],
    productos: [],
    searchQuery: '',
    searchResults: [],
    total: 0,
    folioActual: '',
    cargando: false,
    timerBusqueda: null,

    init: async function () {
      this.cargando = true;
      await this.generarFolio();
      await this.cargarProductos();
      this.cargando = false;
    },

    render: async function (params) {
      return '<div x-data="ventasComponent()" x-init="initVentas()" class="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">' +
        '<div class="flex-1 flex flex-col min-h-0">' +
          '<div class="flex items-center gap-3 mb-4">' +
            '<div class="relative flex-1 max-w-md">' +
              '<i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm"></i>' +
              '<input type="text" x-model="searchQuery" @input.debounce.200ms="buscarProductos" placeholder="Buscar producto por nombre o c\u00f3digo..." class="input input-bordered input-sm w-full pl-9 pr-3 rounded-full">' +
              '<button x-show="searchQuery" @click="searchQuery=\'\'; buscarProductos()" class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle text-base-content/40">&times;</button>' +
            '</div>' +
            '<span class="text-sm text-base-content/50 hidden sm:inline"><span x-text="productosFiltrados.length"></span> productos</span>' +
          '</div>' +
          '<div x-show="cargando" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">' +
            '<template x-for="i in 8" :key="i">' +
              '<div class="sk-el sk-card rounded-2xl"></div>' +
            '</template>' +
          '</div>' +
          '<div x-show="!cargando && productosFiltrados.length === 0" class="empty-state flex-1 flex flex-col items-center justify-center py-12">' +
            '<template x-if="!searchQuery">' +
            '<div class="empty-state-icon bg-base-200"><i class="bi bi-box-seam text-3xl text-base-content/30"></i></div>' +
            '<div class="empty-state-title">Ning\u00fan producto disponible</div>' +
            '<div class="empty-state-desc">Agrega productos en el m\u00f3dulo de inventario primero</div>' +
            '</template>' +
            '<template x-if="searchQuery">' +
            '<div class="empty-state-icon bg-warning/10 text-warning"><i class="bi bi-search text-3xl"></i></div>' +
            '<div class="empty-state-title">Sin resultados</div>' +
            '<div class="empty-state-desc">Ning\u00fan producto coincide con <span class="font-medium" x-text="\'\\u201C\' + searchQuery + \'\\u201D\'"></span></div>' +
            '<button @click="searchQuery=\'\';buscarProductos()" class="btn btn-ghost btn-xs gap-1 mt-2"><i class="bi bi-x-lg"></i> Limpiar b\u00fasqueda</button>' +
            '</template>' +
          '</div>' +
          '<div x-show="!cargando" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pb-4 pr-1 ventas-productos-grid" style="max-height:calc(100vh - 280px)">' +
            '<template x-for="(prod, idx) in productosFiltrados" :key="prod.id">' +
              '<div @click="agregarAlCarrito(prod)" ' +
                ':class="ultimoAgregado === prod.id ? \'ring-2 ring-primary scale-[0.97]\' : \'\'" ' +
                'class="card bg-base-100 border border-base-200 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 rounded-2xl p-3 relative overflow-hidden grupo-producto">' +
                '<div class="w-full aspect-square rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-2 overflow-hidden relative">' +
                  '<template x-if="prod.imagen">' +
                    '<img :src="prod.imagen" :alt="prod.nombre" class="w-full h-full object-cover">' +
                  '</template>' +
                  '<template x-if="!prod.imagen">' +
                    '<i class="bi bi-box text-3xl text-primary/30"></i>' +
                  '</template>' +
                  '<div x-show="ultimoAgregado === prod.id" class="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center">' +
                    '<i class="bi bi-check-circle-fill text-white text-2xl drop-shadow-lg"></i>' +
                  '</div>' +
                '</div>' +
                '<div class="text-xs font-semibold truncate leading-tight mb-1" x-text="prod.nombre"></div>' +
                '<div class="flex items-center justify-between">' +
                  '<span class="text-sm font-bold text-primary" x-text="formatearPrecio(prod.precio)"></span>' +
                  '<span class="text-[10px] font-medium text-base-content/40" x-text="\'stock: \' + prod.stock"></span>' +
                '</div>' +
                '<div x-show="prod.stock <= 5 && prod.stock > 0" class="absolute top-2 right-2">' +
                  '<span class="badge badge-warning badge-xs gap-1"><i class="bi bi-exclamation-triangle-fill text-[8px]"></i> <span x-text="prod.stock"></span></span>' +
                '</div>' +
                '<div x-show="prod.stock === 0" class="absolute inset-0 bg-base-100/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">' +
                  '<span class="badge badge-error gap-1 text-[10px]"><i class="bi bi-x-circle-fill"></i> Sin stock</span>' +
                '</div>' +
              '</div>' +
            '</template>' +
          '</div>' +
        '</div>' +
        '<div class="lg:w-96 xl:w-[28rem] flex flex-col bg-base-100 border border-base-200 rounded-2xl shadow-sm ventas-cart-panel" :class="carritoAbierto ? \'fixed inset-0 z-50 rounded-none lg:static lg:rounded-2xl\' : \'\'">' +
          '<div class="flex items-center justify-between px-4 py-3 border-b border-base-200">' +
            '<div class="flex items-center gap-2">' +
              '<i class="bi bi-basket text-lg text-primary"></i>' +
              '<h3 class="font-semibold text-sm">Carrito</h3>' +
              '<span x-show="carrito.length" class="badge badge-primary badge-sm" x-text="carrito.length + \' items\'"></span>' +
            '</div>' +
            '<div class="flex items-center gap-1">' +
              '<span class="text-[10px] text-base-content/40 font-mono" x-text="folioActual"></span>' +
              '<button @click="carritoAbierto = false" x-show="carritoAbierto" class="btn btn-ghost btn-xs btn-circle lg:hidden"><i class="bi bi-x-lg text-sm"></i></button>' +
            '</div>' +
          '</div>' +
          '<div x-show="carrito.length === 0" class="flex-1 flex flex-col items-center justify-center py-10 px-4">' +
            '<div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-3">' +
              '<i class="bi bi-cart text-2xl text-base-content/30"></i>' +
            '</div>' +
            '<p class="text-sm font-medium text-base-content/50">Carrito vac\u00edo</p>' +
            '<p class="text-xs text-base-content/30 mt-1 text-center">Selecciona productos de la lista para agregarlos</p>' +
          '</div>' +
          '<div x-show="carrito.length" class="flex-1 overflow-y-auto px-2 py-2 ventas-cart-items" style="max-height:calc(100vh - 420px)">' +
            '<template x-for="(item, idx) in carrito" :key="idx">' +
              '<div class="flex items-start gap-2 p-2 rounded-xl hover:bg-base-200/50 transition-colors group relative">' +
                '<div class="flex-1 min-w-0">' +
                  '<div class="text-sm font-medium truncate leading-tight" x-text="item.nombre"></div>' +
                  '<div class="text-xs text-base-content/40" x-text="\'$ \' + item.precio.toFixed(2)"></div>' +
                  '<div class="flex items-center gap-1 mt-1.5">' +
                    '<button @click="cambiarCantidad(idx, -1)" class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary" :disabled="item.cantidad <= 1">&minus;</button>' +
                    '<span class="text-sm font-semibold w-8 text-center tabular-nums" x-text="item.cantidad"></span>' +
                    '<button @click="cambiarCantidad(idx, 1)" class="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary" :disabled="item.cantidad >= stockDisponible(item.productoId)">&plus;</button>' +
                  '</div>' +
                '</div>' +
                '<div class="text-right shrink-0">' +
                  '<div class="text-sm font-bold tabular-nums" x-text="\'$ \' + (item.precio * item.cantidad - (item.descuento || 0)).toFixed(2)"></div>' +
                  '<div x-show="item.descuento" class="text-[10px] text-error">-$ <span x-text="item.descuento.toFixed(2)"></span></div>' +
                '</div>' +
                '<button @click="quitarDelCarrito(idx)" class="btn btn-ghost btn-xs btn-circle text-base-content/20 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1">&times;</button>' +
              '</div>' +
            '</template>' +
          '</div>' +
          '<div x-show="carrito.length" class="border-t border-base-200 p-4 space-y-3">' +
            '<div class="flex items-center justify-between text-sm">' +
              '<span class="text-base-content/50">Subtotal</span>' +
              '<span class="font-semibold tabular-nums" x-text="\'$ \' + subtotal.toFixed(2)"></span>' +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="font-bold text-lg">Total</span>' +
              '<span class="font-bold text-lg text-primary tabular-nums" x-text="\'$ \' + total.toFixed(2)"></span>' +
            '</div>' +
            '<button @click="abrirPagoModal" class="btn btn-primary w-full gap-2 btn-spring" :disabled="carrito.length === 0">' +
              '<i class="bi bi-credit-card"></i>' +
              'Cobrar $ <span x-text="total.toFixed(2)"></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div x-show="showPagoModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click.away="showPagoModal = false">' +
          '<div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm"></div>' +
          '<div class="relative bg-base-100 rounded-2xl shadow-2xl border border-base-200 w-full max-w-sm overflow-hidden">' +
            '<div class="px-5 py-4 border-b border-base-200 flex items-center justify-between">' +
              '<h3 class="font-semibold" x-text="showEfectivoForm ? \'Pago en efectivo\' : \'Seleccionar m\u00e9todo de pago\'"></h3>' +
              '<button @click="showPagoModal = false; showEfectivoForm = false" class="btn btn-ghost btn-xs btn-circle"><i class="bi bi-x-lg text-sm"></i></button>' +
            '</div>' +

            '<!-- Step 1: Seleccionar m\u00e9todo -->' +
            '<div x-show="!showEfectivoForm" class="p-5 space-y-3">' +
              '<div class="text-center mb-4">' +
                '<div class="text-3xl font-bold text-primary tabular-nums" x-text="\'$ \' + total.toFixed(2)"></div>' +
                '<div class="text-xs text-base-content/40 mt-1">Total a cobrar</div>' +
              '</div>' +
              '<button @click="iniciarPagoEfectivo()" class="btn btn-outline btn-lg w-full justify-start gap-4 h-16 rounded-2xl">' +
                '<i class="bi bi-cash-stack text-2xl text-success"></i>' +
                '<div class="text-left"><div class="font-semibold">Efectivo</div><div class="text-xs text-base-content/40">Pago en efectivo</div></div>' +
              '</button>' +
              '<button @click="finalizarVenta(\'tarjeta\')" class="btn btn-outline btn-lg w-full justify-start gap-4 h-16 rounded-2xl">' +
                '<i class="bi bi-credit-card-2-front text-2xl text-info"></i>' +
                '<div class="text-left"><div class="font-semibold">Tarjeta</div><div class="text-xs text-base-content/40">D\u00e9bito / Cr\u00e9dito</div></div>' +
              '</button>' +
              '<button @click="finalizarVenta(\'transferencia\')" class="btn btn-outline btn-lg w-full justify-start gap-4 h-16 rounded-2xl">' +
                '<i class="bi bi-phone text-2xl text-secondary"></i>' +
                '<div class="text-left"><div class="font-semibold">Transferencia</div><div class="text-xs text-base-content/40">Sinpe / Transferencia bancaria</div></div>' +
              '</button>' +
            '</div>' +

            '<!-- Step 2: Efectivo - monto recibido + cambio -->' +
            '<div x-show="showEfectivoForm" class="p-5 space-y-4">' +
              '<div class="text-center mb-2">' +
                '<div class="text-xs text-base-content/40 mb-1">Total a cobrar</div>' +
                '<div class="text-3xl font-bold text-primary tabular-nums" x-text="\'$ \' + total.toFixed(2)"></div>' +
              '</div>' +
              '<label class="form-control w-full">' +
                '<span class="label-text font-medium mb-1">Monto recibido</span>' +
                '<div class="relative">' +
                  '<span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-base-content/40">$</span>' +
                  '<input id="modal-efectivo-monto" type="number" x-model="montoRecibido" @input="calcularCambio" step="0.01" min="0" class="input input-bordered w-full pl-8 h-14 text-2xl font-bold text-center tabular-nums" placeholder="0.00">' +
                '</div>' +
              '</label>' +
              '<div x-show="montoRecibido >= total" class="flex items-center justify-between p-3 rounded-xl bg-success/10 border border-success/20">' +
                '<span class="text-sm font-medium text-base-content/70">Cambio</span>' +
                '<span class="text-xl font-bold text-success tabular-nums" x-text="\'$ \' + cambio.toFixed(2)"></span>' +
              '</div>' +
              '<div x-show="montoRecibido > 0 && montoRecibido < total" class="flex items-center justify-between p-3 rounded-xl bg-error/10 border border-error/20">' +
                '<span class="text-sm font-medium text-base-content/70">Faltan</span>' +
                '<span class="text-xl font-bold text-error tabular-nums" x-text="\'$ \' + (total - montoRecibido).toFixed(2)"></span>' +
              '</div>' +
              '<button @click="confirmarPagoEfectivo()" class="btn btn-primary w-full h-14 text-base gap-2 btn-spring" :disabled="!montoRecibido || montoRecibido < total">' +
                '<i class="bi bi-check-lg text-lg"></i> Confirmar pago $ <span x-text="total.toFixed(2)"></span>' +
              '</button>' +
              '<button @click="showEfectivoForm = false; montoRecibido = 0; cambio = 0" class="btn btn-ghost btn-sm w-full">Volver a métodos de pago</button>' +
            '</div>' +

            '<div x-show="!showEfectivoForm" class="px-5 py-3 border-t border-base-200 text-center">' +
              '<button @click="showPagoModal = false" class="btn btn-ghost btn-sm">Cancelar</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div x-show="procesando" class="fixed inset-0 z-[70] flex items-center justify-center">' +
          '<div class="absolute inset-0 bg-base-300/60 backdrop-blur-sm"></div>' +
          '<div class="relative bg-base-100 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">' +
            '<span class="loading loading-spinner loading-lg text-primary"></span>' +
            '<p class="text-sm font-medium">Procesando venta...</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    },

    destroy: function () {
      if (this.timerBusqueda) {
        clearTimeout(this.timerBusqueda);
        this.timerBusqueda = null;
      }
    },

    cargarProductos: async function () {
      try {
        var productos = await db.productos.toArray();
        this.productos = productos;
        this.searchResults = productos;
      } catch (e) {
        console.error('Error cargando productos:', e);
        UI.toast('Error al cargar productos', 'error');
        this.productos = [];
        this.searchResults = [];
      }
    },

    generarFolio: async function () {
      try {
        var ultimaVenta = await db.ventas.orderBy('folio').last();
        if (ultimaVenta && ultimaVenta.folio) {
          var num = parseInt(ultimaVenta.folio.replace('V-', ''), 10) || 0;
          this.folioActual = 'V-' + String(num + 1).padStart(6, '0');
        } else {
          this.folioActual = 'V-000001';
        }
      } catch (e) {
        console.error('Error generando folio:', e);
        this.folioActual = 'V-000001';
      }
    },

    agregarProducto: function (producto) {
      if (!producto || producto.stock <= 0) {
        UI.toast('Producto sin stock disponible', 'error');
        return;
      }
      var existente = null;
      for (var i = 0; i < this.carrito.length; i++) {
        if (this.carrito[i].productoId === producto.id) {
          existente = this.carrito[i];
          break;
        }
      }
      if (existente) {
        if (existente.cantidad >= producto.stock) {
          UI.toast('Stock m\u00e1ximo alcanzado para este producto', 'warning');
          return;
        }
        existente.cantidad += 1;
      } else {
        this.carrito.push({
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          descuento: 0
        });
      }
      this.recalcTotal();
      UI.toast(producto.nombre + ' agregado al carrito', 'info', 1500);
    },

    cambiarCantidad: function (idx, delta) {
      if (idx < 0 || idx >= this.carrito.length) return;
      var item = this.carrito[idx];
      var nuevaCantidad = item.cantidad + delta;
      if (nuevaCantidad < 1) return;
      var producto = this._findProducto(item.productoId);
      if (producto && nuevaCantidad > producto.stock) {
        UI.toast('Stock insuficiente: solo hay ' + producto.stock + ' unidades', 'warning');
        return;
      }
      item.cantidad = nuevaCantidad;
      this.recalcTotal();
    },

    aplicarDescuento: function (idx, desc) {
      if (idx < 0 || idx >= this.carrito.length) return;
      var item = this.carrito[idx];
      var maxDesc = item.precio * item.cantidad;
      desc = Math.max(0, Math.min(desc, maxDesc));
      item.descuento = desc;
      this.recalcTotal();
    },

    quitarProducto: function (idx) {
      if (idx < 0 || idx >= this.carrito.length) return;
      this.carrito.splice(idx, 1);
      this.recalcTotal();
    },

    recalcTotal: function () {
      var t = 0;
      for (var i = 0; i < this.carrito.length; i++) {
        var item = this.carrito[i];
        t += item.precio * item.cantidad - (item.descuento || 0);
      }
      this.total = Math.max(0, t);
    },

    _findProducto: function (productoId) {
      for (var i = 0; i < this.productos.length; i++) {
        if (this.productos[i].id === productoId) return this.productos[i];
      }
      return null;
    },

    buscarProductos: function (query) {
      var self = this;
      if (!query || query.trim() === '') {
        this.searchResults = this.productos.slice();
        return;
      }
      var q = query.toLowerCase().trim();
      if (this.productos.length > 500) {
        this.searchResults = [];
        db.productos.filter(function (p) {
          return (p.nombre && p.nombre.toLowerCase().indexOf(q) !== -1) ||
                 (p.codigoBarras && p.codigoBarras.toLowerCase().indexOf(q) !== -1);
        }).limit(50).toArray().then(function (results) {
          self.searchResults = results;
          self._busquedaCompleta = true;
        });
      } else {
        this.searchResults = this.productos.filter(function (p) {
          return (p.nombre && p.nombre.toLowerCase().indexOf(q) !== -1) ||
                 (p.codigoBarras && p.codigoBarras.toLowerCase().indexOf(q) !== -1);
        }).slice(0, 50);
      }
    },

    finalizarVenta: async function (metodoPago) {
      if (this.carrito.length === 0) {
        UI.toast('El carrito est\u00e1 vac\u00edo', 'error');
        return;
      }
      this.procesando = true;
      try {
        var items = [];
        for (var i = 0; i < this.carrito.length; i++) {
          var item = this.carrito[i];
          items.push({
            productoId: item.productoId,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            descuento: item.descuento || 0
          });
        }
        var venta = {
          id: window.uuid(),
          folio: this.folioActual,
          total: this.total,
          metodoPago: metodoPago,
          items: items,
          createdBy: (window.APP_CONFIG && window.APP_CONFIG.usuarioActual) || 'cajero',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.ventas.put(venta);
        for (var j = 0; j < this.carrito.length; j++) {
          var cartItem = this.carrito[j];
          var prod = await db.productos.get(cartItem.productoId);
          if (prod) {
            prod.stock -= cartItem.cantidad;
            if (prod.stock < 0) prod.stock = 0;
            prod.updatedAt = new Date();
            await db.productos.put(prod);
          }
        }
        UI.toast('Venta ' + this.folioActual + ' registrada con \u00e9xito', 'success');
        var ventaParaTicket = venta;
        this.carrito = [];
        this.total = 0;
        this.recalcTotal();
        await this.generarFolio();
        await this.cargarProductos();
        this.imprimirTicket(ventaParaTicket);
        this.procesando = false;
        return ventaParaTicket;
      } catch (e) {
        console.error('Error al finalizar venta:', e);
        UI.toast('Error al registrar la venta: ' + e.message, 'error');
        this.procesando = false;
      }
    },

    imprimirTicket: function (venta) {
      if (!venta) return;
      var metodoPagoTexto = '';
      switch (venta.metodoPago) {
        case 'efectivo': metodoPagoTexto = 'Efectivo'; break;
        case 'tarjeta': metodoPagoTexto = 'Tarjeta D\u00e9bito/Cr\u00e9dito'; break;
        case 'transferencia': metodoPagoTexto = 'Transferencia'; break;
        default: metodoPagoTexto = venta.metodoPago;
      }
      var now = new Date();
      var fechaStr = now.toLocaleDateString('es-CR', { year: 'numeric', month: '2-digit', day: '2-digit' });
      var horaStr = now.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
      var itemsHtml = '';
      for (var i = 0; i < venta.items.length; i++) {
        var it = venta.items[i];
        var subtotal = it.precio * it.cantidad - (it.descuento || 0);
        itemsHtml += '<tr>' +
          '<td style="padding:4px 0;font-size:12px">' + it.nombre + '</td>' +
          '<td style="padding:4px 0;font-size:12px;text-align:center">' + it.cantidad + '</td>' +
          '<td style="padding:4px 0;font-size:12px;text-align:right">$ ' + subtotal.toFixed(2) + '</td>' +
        '</tr>';
        if (it.descuento) {
          itemsHtml += '<tr><td colspan="3" style="padding:0 0 4px 8px;font-size:10px;color:#999">Desc: -$ ' + it.descuento.toFixed(2) + '</td></tr>';
        }
      }
      var ticketHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket ' + venta.folio + '</title>' +
        '<style>' +
          'body{font-family:"Courier New",monospace;font-size:13px;margin:0;padding:16px;width:280px;color:#222}' +
          '.header{text-align:center;margin-bottom:12px}' +
          '.header h2{margin:0;font-size:16px}' +
          '.header p{margin:2px 0;font-size:11px;color:#666}' +
          'table{width:100%;border-collapse:collapse}' +
          'th{font-size:11px;text-transform:uppercase;color:#666;padding:4px 0;border-top:1px dashed #ccc;border-bottom:1px dashed #ccc}' +
          'td{padding:4px 0;font-size:12px}' +
          '.totals{margin-top:8px;padding-top:8px;border-top:2px solid #222}' +
          '.totals div{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}' +
          '.totals .grand{font-size:16px;font-weight:bold;padding-top:4px}' +
          '.footer{text-align:center;margin-top:12px;padding-top:8px;border-top:1px dashed #ccc;font-size:11px;color:#666}' +
          '@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}' +
        '</style></head><body>' +
        '<div class="header">' +
          '<h2>Mi Tienda</h2>' +
          '<p>' + fechaStr + ' ' + horaStr + '</p>' +
          '<p style="font-size:14px;font-weight:bold;margin-top:4px">' + venta.folio + '</p>' +
        '</div>' +
        '<table><thead><tr><th style="text-align:left">Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Total</th></tr></thead><tbody>' +
        itemsHtml +
        '</tbody></table>' +
        '<div class="totals">' +
          '<div><span>Subtotal</span><span>$ ' + venta.total.toFixed(2) + '</span></div>' +
          '<div class="grand"><span>TOTAL</span><span>$ ' + venta.total.toFixed(2) + '</span></div>' +
          '<div style="margin-top:4px;font-size:11px;color:#666"><span>M\u00e9todo de pago</span><span>' + metodoPagoTexto + '</span></div>' +
        '</div>' +
        '<div class="footer">' +
          '<p>\u00a1Gracias por su compra!</p>' +
          '<p style="font-size:10px">' + venta.id + '</p>' +
        '</div>' +
        '<script>window.onload=function(){window.print();setTimeout(function(){window.close()},500)}<' + '/script>' +
        '</body></html>';
      var win = window.open('', '_blank', 'width=360,height=600,menubar=no,toolbar=no,location=no,status=no');
      if (win) {
        win.document.write(ticketHtml);
        win.document.close();
      }
    }
  };

  window.ventasComponent = function () {
    var mod = window.MODULES && window.MODULES['ventas'];
    return {
      carrito: mod ? mod.carrito : [],
      productos: mod ? mod.productos : [],
      searchResults: mod ? mod.searchResults : [],
      searchQuery: '',
      cargando: mod ? mod.cargando : true,
      showPagoModal: false,
      procesando: false,
      carritoAbierto: false,
      folioActual: mod ? mod.folioActual : '',
      ultimoAgregado: null,
      _timerFeedback: null,
      showEfectivoForm: false,
      montoRecibido: 0,
      cambio: 0,

      get productosFiltrados() {
        if (!this.searchQuery || this.searchQuery.trim() === '') {
          return this.searchResults;
        }
        return this.searchResults;
      },

      get subtotal() {
        var t = 0;
        for (var i = 0; i < this.carrito.length; i++) {
          var item = this.carrito[i];
          t += item.precio * item.cantidad;
        }
        return t;
      },

      get total() {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) mod.recalcTotal();
        var t = 0;
        for (var i = 0; i < this.carrito.length; i++) {
          var item = this.carrito[i];
          t += item.precio * item.cantidad - (item.descuento || 0);
        }
        return Math.max(0, t);
      },

      initVentas: async function () {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          await mod.init();
          this.carrito = mod.carrito;
          this.productos = mod.productos;
          this.searchResults = mod.searchResults;
          this.cargando = mod.cargando;
          this.folioActual = mod.folioActual;
        }
      },

      buscarProductos: function () {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          mod.buscarProductos(this.searchQuery || '');
          this.searchResults = mod.searchResults;
        }
      },

      agregarAlCarrito: function (producto) {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          mod.agregarProducto(producto);
          this.carrito = mod.carrito;
        }
        this.ultimoAgregado = producto.id;
        var self = this;
        clearTimeout(this._timerFeedback);
        this._timerFeedback = setTimeout(function () {
          self.ultimoAgregado = null;
        }, 400);
      },

      cambiarCantidad: function (idx, delta) {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          mod.cambiarCantidad(idx, delta);
          this.carrito = mod.carrito;
        }
      },

      quitarDelCarrito: function (idx) {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          mod.quitarProducto(idx);
          this.carrito = mod.carrito;
        }
      },

      stockDisponible: function (productoId) {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          var prod = mod._findProducto(productoId);
          return prod ? prod.stock : 0;
        }
        return 0;
      },

      abrirPagoModal: function () {
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod && mod.carrito.length === 0) {
          UI.toast('El carrito est\u00e1 vac\u00edo', 'warning');
          return;
        }
        this.showEfectivoForm = false;
        this.montoRecibido = 0;
        this.cambio = 0;
        this.showPagoModal = true;
      },

      iniciarPagoEfectivo: function () {
        this.showEfectivoForm = true;
        this.montoRecibido = 0;
        this.cambio = 0;
        var self = this;
        setTimeout(function () {
          var input = document.querySelector('#modal-efectivo-monto');
          if (input) input.focus();
        }, 100);
      },

      calcularCambio: function () {
        this.cambio = Math.max(0, (parseFloat(this.montoRecibido) || 0) - this.total);
      },

      confirmarPagoEfectivo: function () {
        this.finalizarVenta('efectivo');
      },

      finalizarVenta: async function (metodoPago) {
        this.showPagoModal = false;
        this.procesando = true;
        var mod = window.MODULES && window.MODULES['ventas'];
        if (mod) {
          await mod.finalizarVenta(metodoPago);
          this.carrito = mod.carrito;
          this.cargando = true;
          if (mod.cargarProductos) await mod.cargarProductos();
          this.productos = mod.productos;
          this.searchResults = mod.searchResults;
          this.cargando = mod.cargando || false;
          this.folioActual = mod.folioActual;
        }
        this.procesando = false;
      },

      formatearPrecio: function (precio) {
        return '$ ' + (typeof precio === 'number' ? precio.toFixed(2) : '0.00');
      }
    };
  };

  window.MODULES = window.MODULES || {};
  window.MODULES['ventas'] = Ventas;
})();
