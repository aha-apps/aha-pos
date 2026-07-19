(function () {
  'use strict';
  if (typeof window.MODULES !== 'undefined' && window.MODULES['productos']) return;

  var Productos = {
    id: 'productos',
    titulo: 'Productos',
    icono: 'bi bi-box',

    datos: [],
    categorias: [],
    searchTimeout: null,

    async init() {
      this.cargarDatos();
    },

    async render(params) {
      return '<div x-data="productosComponent()" x-init="initProductos()" class="space-y-6">' +
        '<!-- Toolbar -->' +
        '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">' +
        '<div class="flex items-center gap-3 w-full sm:w-auto">' +
        '<div class="relative flex-1 sm:w-64">' +
        '<i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>' +
        '<input type="text" x-model="searchQuery" @input.debounce.300ms="buscarProductos()" class="input input-bordered w-full pl-10 h-10 text-sm" placeholder="Buscar por nombre o c\u00f3digo...">' +
        '</div>' +
        '<button @click="abrirFormProducto()" class="btn btn-primary btn-sm gap-1.5">' +
        '<i class="bi bi-plus-lg text-sm"></i><span class="hidden sm:inline">Agregar</span></button>' +
        '</div>' +
        '<div class="flex items-center gap-2 w-full sm:w-auto">' +
        '<span class="text-xs text-base-content/50" x-text="productos.length + \' producto\' + (productos.length !== 1 ? \'s\' : \'\')"></span>' +
        '</div></div>' +
        '<!-- Loading skeleton -->' +
        '<template x-if="loading"><div class="space-y-3">' +
        '<template x-for="i in 5" :key="i">' +
        '<div class="flex items-center gap-4 p-3">' +
        '<div class="sk-avatar"></div>' +
        '<div class="flex-1 space-y-2"><div class="sk-row w-1/3"></div><div class="sk-row w-1/4"></div></div>' +
        '<div class="sk-badge"></div><div class="sk-badge"></div>' +
        '</div></template></div></template>' +
        '<!-- Empty state -->' +
        '<template x-if="!loading && productos.length === 0">' +
        '<div class="empty-state">' +
        '<div class="empty-state-icon bg-primary/10 text-primary"><i class="bi bi-box text-4xl"></i></div>' +
        '<h3 class="empty-state-title">No hay productos</h3>' +
        '<p class="empty-state-desc">Agrega tu primer producto para comenzar a vender.</p>' +
        '<button @click="abrirFormProducto()" class="btn btn-primary gap-2"><i class="bi bi-plus-lg"></i> Agregar Producto</button>' +
        '</div></template>' +
        '<!-- Table -->' +
        '<template x-if="!loading && productos.length > 0">' +
        '<div class="overflow-x-auto rounded-2xl border border-base-200 bg-base-100">' +
        '<table class="table table-zebra"><thead>' +
        '<tr class="text-xs uppercase tracking-wider text-base-content/50">' +
        '<th class="w-10"></th><th>Nombre</th>' +
        '<th class="hidden md:table-cell">C\u00f3digo</th>' +
        '<th class="hidden md:table-cell">Categor\u00eda</th>' +
        '<th class="text-right">Precio</th><th class="text-center">Stock</th>' +
        '<th class="text-right w-24">Acciones</th>' +
        '</tr></thead><tbody>' +
        '<template x-for="(p, i) in productos" :key="p.id">' +
        '<tr class="hover" :class="\'stagger-item\'">' +
        '<td><div class="avatar placeholder"><div class="w-9 rounded-lg bg-base-200 text-base-content/40"><i class="bi bi-box text-lg"></i></div></div></td>' +
        '<td><div class="font-medium text-sm" x-text="p.nombre"></div></td>' +
        '<td class="hidden md:table-cell"><span class="text-sm text-base-content/60 font-mono" x-text="p.codigoBarras || \'\u2014\'"></span></td>' +
        '<td class="hidden md:table-cell">' +
        '<template x-if="p.categoriaId">' +
        '<span class="badge badge-sm" :style="\'background:\' + (categoriaColor(p.categoriaId) || \'#e2e8f0\') + \'20; color:\' + (categoriaColor(p.categoriaId) || \'#64748b\') + \'; border-color:\' + (categoriaColor(p.categoriaId) || \'#e2e8f0\') + \'40\'" x-text="categoriaNombre(p.categoriaId)"></span>' +
        '</template>' +
        '<template x-if="!p.categoriaId"><span class="text-xs text-base-content/30">\u2014</span></template>' +
        '</td>' +
        '<td class="text-right"><span class="font-semibold text-sm" x-text="formatPrecio(p.precio)"></span></td>' +
        '<td class="text-center"><span :class="\'badge badge-sm \' + (p.stock <= 0 ? \'badge-error\' : p.stock <= 5 ? \'badge-warning\' : \'badge-ghost\')" x-text="p.stock"></span></td>' +
        '<td class="text-right"><div class="flex items-center justify-end gap-1">' +
        '<button @click="editarProducto(p)" class="btn btn-ghost btn-xs btn-square" title="Editar"><i class="bi bi-pencil text-sm"></i></button>' +
        '<button @click="eliminarProducto(p)" class="btn btn-ghost btn-xs btn-square text-error" title="Eliminar"><i class="bi bi-trash text-sm"></i></button>' +
        '</div></td></tr></template></tbody></table></div></template></div>';
    },

    destroy() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = null;
      }
    },

    async cargarDatos() {
      try {
        this.datos = await db.productos.orderBy('nombre').toArray();
        this.categorias = await db.categorias.orderBy('nombre').toArray();
        var store = Alpine.store('app');
        if (store) store.loading = false;
      } catch (e) {
        console.error('[productos] Error cargando datos:', e);
        if (window.UI) UI.toast('Error al cargar productos', 'error');
      }
    },

    async abrirForm(item) {
      var editando = !!item;
      var isNombre = '';
      var isCodigo = '';
      var isCategoriaId = '';
      var isPrecio = '';
      var isStock = '';

      if (editando) {
        isNombre = item.nombre || '';
        isCodigo = item.codigoBarras || '';
        isCategoriaId = item.categoriaId || '';
        isPrecio = item.precio || 0;
        isStock = item.stock || 0;
      }

      var catOptions = '<option value="">Sin categor\u00eda</option>';
      for (var i = 0; i < this.categorias.length; i++) {
        var c = this.categorias[i];
        var sel = c.id === isCategoriaId ? ' selected' : '';
        catOptions += '<option value="' + c.id + '"' + sel + '>' + c.nombre + '</option>';
      }

      var html =
        '<div class="space-y-4">' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Nombre del producto *</span>' +
        '    <input type="text" name="nombre" x-model="form.nombre" class="input input-bordered w-full" value="' + this._escAttr(isNombre) + '" required>' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">C\u00f3digo de barras</span>' +
        '    <input type="text" name="codigoBarras" x-model="form.codigoBarras" class="input input-bordered w-full" value="' + this._escAttr(isCodigo) + '">' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Categor\u00eda</span>' +
        '    <select name="categoriaId" x-model="form.categoriaId" class="select select-bordered w-full">' +
        catOptions +
        '    </select>' +
        '  </label>' +
        '  <div class="flex gap-3">' +
        '    <label class="form-control flex-1">' +
        '      <span class="label-text">Precio *</span>' +
        '      <input type="number" name="precio" x-model="form.precio" step="0.01" min="0" class="input input-bordered w-full" value="' + isPrecio + '" required>' +
        '    </label>' +
        '    <label class="form-control w-28">' +
        '      <span class="label-text">Stock</span>' +
        '      <input type="number" name="stock" x-model="form.stock" step="1" min="0" class="input input-bordered w-full" value="' + isStock + '">' +
        '    </label>' +
        '  </div>' +
        '</div>';

      await UI.modalForm(
        editando ? 'Editar Producto' : 'Nuevo Producto',
        html,
        async function (data) {
          if (!data.nombre || data.nombre.trim() === '') {
            UI.toast('El nombre es obligatorio', 'error');
            return;
          }
          if (!data.precio || parseFloat(data.precio) <= 0) {
            UI.toast('El precio debe ser mayor a 0', 'error');
            return;
          }
          if (editando) {
            await Productos.actualizar(item.id, data);
          } else {
            await Productos.guardar(data);
          }
          await Productos.cargarDatos();
        }
      );
    },

    async guardar(datos) {
      var registro = {
        id: window.uuid(),
        nombre: datos.nombre.trim(),
        codigoBarras: datos.codigoBarras || '',
        categoriaId: datos.categoriaId || '',
        precio: parseFloat(datos.precio) || 0,
        stock: parseInt(datos.stock, 10) || 0,
        imagen: '',
        createdBy: 'anon',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      try {
        await db.productos.put(registro);
        UI.toast('Producto guardado', 'success');
      } catch (e) {
        UI.toast('Error al guardar: ' + e.message, 'error');
      }
    },

    async actualizar(id, datos) {
      try {
        var existente = await db.productos.get(id);
        if (!existente) {
          UI.toast('Producto no encontrado', 'error');
          return;
        }
        existente.nombre = datos.nombre.trim();
        existente.codigoBarras = datos.codigoBarras || '';
        existente.categoriaId = datos.categoriaId || '';
        existente.precio = parseFloat(datos.precio) || 0;
        existente.stock = parseInt(datos.stock, 10) || 0;
        existente.updatedAt = new Date().toISOString();
        await db.productos.put(existente);
        UI.toast('Producto actualizado', 'success');
      } catch (e) {
        UI.toast('Error al actualizar: ' + e.message, 'error');
      }
    },

    async eliminar(item) {
      var ok = await UI.confirm('\u00bfEliminar "' + (item.nombre || '') + '"?', 'Eliminar Producto');
      if (!ok) return;
      try {
        await db.productos.delete(item.id);
        UI.toast('Producto eliminado', 'success');
        this.cargarDatos();
      } catch (e) {
        UI.toast('Error al eliminar: ' + e.message, 'error');
      }
    },

    async buscar(query) {
      if (!query || query.trim() === '') {
        this.cargarDatos();
        return;
      }
      var q = query.toLowerCase().trim();
      try {
        var todos = await db.productos.toArray();
        this.datos = todos.filter(function (p) {
          var nombre = (p.nombre || '').toLowerCase();
          var codigo = (p.codigoBarras || '').toLowerCase();
          return nombre.indexOf(q) !== -1 || codigo.indexOf(q) !== -1;
        });
      } catch (e) {
        console.error('[productos] Error en b\u00fasqueda:', e);
      }
    },

    _escAttr(str) {
      if (typeof str !== 'string') return '';
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES['productos'] = Productos;

  window.productosComponent = function () {
    return {
      productos: [],
      categorias: [],
      loading: true,
      searchQuery: '',
      mod: null,

      initProductos() {
        var self = this;
        self.mod = window.MODULES['productos'];
        if (!self.mod) return;
        self.load();
      },

      async load() {
        var self = this;
        self.loading = true;
        await self.mod.cargarDatos();
        self.productos = self.mod.datos;
        self.categorias = self.mod.categorias;
        self.loading = false;
      },

      async buscarProductos() {
        var self = this;
        if (!self.searchQuery || self.searchQuery.trim() === '') {
          self.load();
          return;
        }
        self.loading = true;
        await self.mod.buscar(self.searchQuery);
        self.productos = self.mod.datos;
        self.loading = false;
      },

      async abrirFormProducto() {
        var self = this;
        await self.mod.abrirForm(null);
        self.load();
      },

      async editarProducto(item) {
        var self = this;
        await self.mod.abrirForm(item);
        self.load();
      },

      async eliminarProducto(item) {
        var self = this;
        await self.mod.eliminar(item);
        self.load();
      },

      categoriaNombre(id) {
        if (!id) return '';
        for (var i = 0; i < this.categorias.length; i++) {
          if (this.categorias[i].id === id) return this.categorias[i].nombre;
        }
        return id;
      },

      categoriaColor(id) {
        if (!id) return '';
        for (var i = 0; i < this.categorias.length; i++) {
          if (this.categorias[i].id === id) return this.categorias[i].color;
        }
        return '';
      },

      formatPrecio(n) {
        if (n === null || n === undefined || isNaN(n)) return '$0.00';
        return '$' + parseFloat(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    };
  };
})();

