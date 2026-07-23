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
        '<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">' +
        '<div class="flex items-center gap-3 w-full sm:w-auto">' +
        '<div class="relative flex-1 sm:w-56">' +
        '<i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"></i>' +
        '<input type="text" x-model="searchQuery" @input.debounce.300ms="buscarProductos()" class="input input-bordered w-full pl-10 h-10 text-sm" placeholder="Buscar por nombre o c\u00f3digo...">' +
        '</div>' +
        '<select x-model="catFiltro" @change="aplicarFiltro()" class="select select-bordered select-sm w-full sm:w-44">' +
        '<option value="">Todas las categor\u00edas</option>' +
        '<template x-for="c in categorias" :key="c.id">' +
        '<option :value="c.id" x-text="c.nombre"></option>' +
        '</template></select>' +
        '<div class="flex gap-1">' +
        '<button @click="abrirFormProducto()" class="btn btn-primary btn-sm gap-1.5">' +
        '<i class="bi bi-plus-lg text-sm"></i><span class="hidden sm:inline">Agregar</span></button>' +
        '<button @click="gestionarCategorias()" class="btn btn-ghost btn-sm btn-square" title="Gestionar categor\u00edas">' +
        '<i class="bi bi-tags text-sm"></i></button>' +
        '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">' +
        '<span class="text-xs text-base-content/50" x-text="(catFiltro || searchQuery ? productosFiltrados.length + \' de \' : \'\') + productos.length + \' producto\' + (productos.length !== 1 ? \'s\' : \'\')"></span>' +
        '</div></div>' +
        '<!-- Loading skeleton -->' +
        '<template x-if="loading"><div class="space-y-3">' +
        '<template x-for="i in 5" :key="i">' +
        '<div class="flex items-center gap-4 p-3">' +
        '<div class="sk-avatar"></div>' +
        '<div class="flex-1 space-y-2"><div class="sk-row w-1/3"></div><div class="sk-row w-1/4"></div></div>' +
        '<div class="sk-badge"></div><div class="sk-badge"></div>' +
        '</div></template></div></template>' +
        '<!-- Empty state (sin productos) -->' +
        '<template x-if="!loading && productos.length === 0">' +
        '<div class="empty-state">' +
        '<div class="empty-state-icon bg-primary/10 text-primary"><i class="bi bi-box text-4xl"></i></div>' +
        '<h3 class="empty-state-title">No hay productos</h3>' +
        '<p class="empty-state-desc">Agrega tu primer producto para comenzar a vender.</p>' +
        '<button @click="abrirFormProducto()" class="btn btn-primary gap-2"><i class="bi bi-plus-lg"></i> Agregar Producto</button>' +
        '</div></template>' +
        '<!-- Empty state (filtro sin resultados) -->' +
        '<template x-if="!loading && productos.length > 0 && productosFiltrados.length === 0">' +
        '<div class="empty-state">' +
        '<div class="empty-state-icon bg-warning/10 text-warning"><i class="bi bi-funnel text-4xl"></i></div>' +
        '<h3 class="empty-state-title">Sin resultados</h3>' +
        '<p class="empty-state-desc">Ning\u00fan producto coincide con el filtro o b\u00fasqueda.</p>' +
        '<button @click="catFiltro=\'\';searchQuery=\'\';aplicarFiltro()" class="btn btn-ghost gap-2"><i class="bi bi-x-lg"></i> Limpiar filtros</button>' +
        '</div></template>' +
        '<!-- Table -->' +
        '<template x-if="!loading && productosFiltrados.length > 0">' +
        '<div class="overflow-x-auto rounded-2xl border border-base-200 bg-base-100">' +
        '<table class="table table-zebra"><thead>' +
        '<tr class="text-xs uppercase tracking-wider text-base-content/50">' +
        '<th class="w-10"></th>' +
        '<th class="cursor-pointer select-none" @click="toggleSort(\'nombre\')">' +
        'Nombre<i :class="sortArrow(\'nombre\')" class="ml-1"></i></th>' +
        '<th class="hidden md:table-cell cursor-pointer select-none" @click="toggleSort(\'codigoBarras\')">' +
        'C\u00f3digo<i :class="sortArrow(\'codigoBarras\')" class="ml-1"></i></th>' +
        '<th class="hidden md:table-cell cursor-pointer select-none" @click="toggleSort(\'categoriaId\')">' +
        'Categor\u00eda<i :class="sortArrow(\'categoriaId\')" class="ml-1"></i></th>' +
        '<th class="text-right cursor-pointer select-none" @click="toggleSort(\'precio\')">' +
        'Precio<i :class="sortArrow(\'precio\')" class="ml-1"></i></th>' +
        '<th class="text-center cursor-pointer select-none" @click="toggleSort(\'stock\')">' +
        'Stock<i :class="sortArrow(\'stock\')" class="ml-1"></i></th>' +
        '<th class="text-right w-24">Acciones</th>' +
        '</tr></thead><tbody>' +
        '<template x-for="(p, i) in productosFiltrados" :key="p.id">' +
        '<tr class="hover" :style="\'animation-delay:\' + (i * 30) + \'ms\'">' +
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
        '    <input type="text" name="nombre" class="input input-bordered w-full" value="' + this._escAttr(isNombre) + '" required>' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">C\u00f3digo de barras</span>' +
        '    <input type="text" name="codigoBarras" class="input input-bordered w-full" value="' + this._escAttr(isCodigo) + '">' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Categor\u00eda</span>' +
        '    <select name="categoriaId" class="select select-bordered w-full">' +
        catOptions +
        '    </select>' +
        '  </label>' +
        '  <div class="flex gap-3">' +
        '    <label class="form-control flex-1">' +
        '      <span class="label-text">Precio *</span>' +
        '      <input type="number" name="precio" step="0.01" min="0" class="input input-bordered w-full" value="' + isPrecio + '" required>' +
        '    </label>' +
        '    <label class="form-control w-28">' +
        '      <span class="label-text">Stock</span>' +
        '      <input type="number" name="stock" step="1" min="0" class="input input-bordered w-full" value="' + isStock + '">' +
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

    _catDialogId: null,

    async gestionarCategorias() {
      await this.cargarCategorias();
      var id = 'cat-mgmt-' + Date.now();
      this._catDialogId = id;
      var rows = '';
      for (var i = 0; i < this.categorias.length; i++) {
        var c = this.categorias[i];
        var color = c.color || '#6366f1';
        rows +=
          '<tr>' +
          '<td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + color + ';border:2px solid ' + color + '40"></span></td>' +
          '<td class="font-medium text-sm">' + this._escAttr(c.nombre) + '</td>' +
          '<td class="text-xs text-base-content/40 font-mono" x-text="c.id">' + c.id.slice(0, 8) + '</td>' +
          '<td class="text-right"><div class="flex gap-1 justify-end">' +
          '<button class="btn btn-ghost btn-xs btn-square" data-edit="' + c.id + '" title="Editar"><i class="bi bi-pencil text-sm"></i></button>' +
          '<button class="btn btn-ghost btn-xs btn-square text-error" data-delete="' + c.id + '" title="Eliminar"><i class="bi bi-trash text-sm"></i></button>' +
          '</div></td></tr>';
      }
      var container = document.createElement('div');
      container.innerHTML =
        '<dialog id="' + id + '" class="modal">' +
        '  <div class="modal-box w-11/12 max-w-md">' +
        '    <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">\u2715</button></form>' +
        '    <div class="flex items-center justify-between mb-4">' +
        '      <h3 class="font-bold text-lg">Gestionar Categor\u00edas</h3>' +
        '      <button class="btn btn-primary btn-sm gap-1" data-add-cat>' +
        '        <i class="bi bi-plus-lg"></i> Agregar' +
        '      </button>' +
        '    </div>' +
        '    <table class="table table-sm w-full">' +
        '      <thead><tr><th class="w-8"></th><th>Nombre</th><th>ID</th><th class="w-24 text-right">Acciones</th></tr></thead>' +
        '      <tbody>' + (rows || '<tr><td colspan="4" class="text-center text-base-content/40 text-sm py-6">No hay categor\u00edas. Crea la primera.</td></tr>') + '</tbody>' +
        '    </table>' +
        '  </div>' +
        '  <form method="dialog" class="modal-backdrop"><button>cerrar</button></form>' +
        '</dialog>';
      document.body.appendChild(container);
      var dialog = document.getElementById(id);
      dialog.showModal();
      dialog.querySelector('[data-add-cat]').onclick = function () { Productos._addCatClick(); };
      dialog.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.onclick = function () { Productos._editCatClick(this.getAttribute('data-edit')); };
      });
      dialog.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.onclick = function () { Productos._delCatClick(this.getAttribute('data-delete')); };
      });
      dialog.addEventListener('close', function () { setTimeout(function () { container.remove(); Productos._catDialogId = null; }, 300); });
    },

    _buildCatTable() {
      var rows = '';
      for (var i = 0; i < this.categorias.length; i++) {
        var c = this.categorias[i];
        var color = c.color || '#6366f1';
        rows +=
          '<tr>' +
          '<td><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:' + color + ';border:2px solid ' + color + '40"></span></td>' +
          '<td class="font-medium text-sm">' + this._escAttr(c.nombre) + '</td>' +
          '<td class="text-xs text-base-content/40 font-mono">' + c.id.slice(0, 8) + '</td>' +
          '<td class="text-right"><div class="flex gap-1 justify-end">' +
          '<button class="btn btn-ghost btn-xs btn-square" data-edit="' + c.id + '" title="Editar"><i class="bi bi-pencil text-sm"></i></button>' +
          '<button class="btn btn-ghost btn-xs btn-square text-error" data-delete="' + c.id + '" title="Eliminar"><i class="bi bi-trash text-sm"></i></button>' +
          '</div></td></tr>';
      }
      return rows || '<tr><td colspan="4" class="text-center text-base-content/40 text-sm py-6">No hay categor\u00edas. Crea la primera.</td></tr>';
    },

    _refreshCatDialog() {
      var id = this._catDialogId;
      if (!id) return;
      var dialog = document.getElementById(id);
      if (!dialog) return;
      var tbody = dialog.querySelector('table tbody');
      if (!tbody) return;
      // Re-bind events after replacing content
      tbody.innerHTML = this._buildCatTable();
      dialog.querySelectorAll('[data-edit]').forEach(function (btn) {
        btn.onclick = function () { Productos._editCatClick(this.getAttribute('data-edit')); };
      });
      dialog.querySelectorAll('[data-delete]').forEach(function (btn) {
        btn.onclick = function () { Productos._delCatClick(this.getAttribute('data-delete')); };
      });
    },

    async _addCatClick() {
      var html =
        '<div class="space-y-4">' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Nombre de la categor\u00eda *</span>' +
        '    <input type="text" name="nombre" class="input input-bordered w-full" required>' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Color</span>' +
        '    <input type="color" name="color" class="input input-bordered w-full h-10" value="#6366f1">' +
        '  </label>' +
        '</div>';
      await UI.modalForm('Nueva Categor\u00eda', html, async function (data) {
        if (!data.nombre || data.nombre.trim() === '') {
          UI.toast('El nombre es obligatorio', 'error');
          return;
        }
        await Productos._guardarCategoria({
          id: window.uuid(),
          nombre: data.nombre.trim(),
          color: data.color || '#6366f1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    },

    async _editCatClick(id) {
      var cat = await db.categorias.get(id);
      if (!cat) { UI.toast('Categor\u00eda no encontrada', 'error'); return; }
      var html =
        '<div class="space-y-4">' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Nombre de la categor\u00eda *</span>' +
        '    <input type="text" name="nombre" class="input input-bordered w-full" value="' + this._escAttr(cat.nombre) + '" required>' +
        '  </label>' +
        '  <label class="form-control w-full">' +
        '    <span class="label-text">Color</span>' +
        '    <input type="color" name="color" class="input input-bordered w-full h-10" value="' + (cat.color || '#6366f1') + '">' +
        '  </label>' +
        '</div>';
      await UI.modalForm('Editar Categor\u00eda', html, async function (data) {
        if (!data.nombre || data.nombre.trim() === '') {
          UI.toast('El nombre es obligatorio', 'error');
          return;
        }
        cat.nombre = data.nombre.trim();
        cat.color = data.color || '#6366f1';
        cat.updatedAt = new Date().toISOString();
        await Productos._guardarCategoria(cat);
      });
    },

    async _delCatClick(id) {
      var cat = await db.categorias.get(id);
      if (!cat) return;
      var ok = await UI.confirm('\u00bfEliminar la categor\u00eda "' + cat.nombre + '"?\nLos productos con esta categor\u00eda quedar\u00e1n sin categor\u00eda.', 'Eliminar Categor\u00eda');
      if (!ok) return;
      try {
        var conProductos = await db.productos.where('categoriaId').equals(id).toArray();
        for (var i = 0; i < conProductos.length; i++) {
          conProductos[i].categoriaId = '';
          await db.productos.put(conProductos[i]);
        }
        await db.categorias.delete(id);
        UI.toast('Categor\u00eda eliminada', 'success');
        await this.cargarCategorias();
        this._refreshCatDialog();
        var comp = Alpine.$data(document.querySelector('[x-data="productosComponent()"]'));
        if (comp) { comp.categorias = this.categorias; comp.load(); }
      } catch (e) {
        UI.toast('Error al eliminar categor\u00eda: ' + e.message, 'error');
      }
    },

    async _guardarCategoria(cat) {
      try {
        await db.categorias.put(cat);
        UI.toast('Categor\u00eda guardada', 'success');
        await Productos.cargarCategorias();
        Productos._refreshCatDialog();
        var comp = Alpine.$data(document.querySelector('[x-data="productosComponent()"]'));
        if (comp) { comp.categorias = Productos.categorias; comp.load(); }
      } catch (e) {
        UI.toast('Error al guardar categor\u00eda: ' + e.message, 'error');
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
      catFiltro: '',
      sortBy: 'nombre',
      sortAsc: true,
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

      aplicarFiltro() {
        var self = this;
        if (self.searchQuery && self.searchQuery.trim() !== '') {
          self.buscarProductos();
        } else {
          self.load();
        }
      },

      toggleSort(col) {
        var self = this;
        if (self.sortBy === col) {
          self.sortAsc = !self.sortAsc;
        } else {
          self.sortBy = col;
          self.sortAsc = col === 'nombre' ? true : false;
        }
      },

      sortArrow(col) {
        if (this.sortBy !== col) return 'bi bi-arrow-down-up opacity-30';
        return this.sortAsc ? 'bi bi-sort-up' : 'bi bi-sort-down';
      },

      async gestionarCategorias() {
        var self = this;
        await self.mod.gestionarCategorias();
        // Refresh local categories after dialog closes
        self.categorias = self.mod.categorias;
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
      },

      get productosFiltrados() {
        var self = this;
        var items = self.productos;
        if (self.catFiltro) {
          items = items.filter(function (p) { return p.categoriaId === self.catFiltro; });
        }
        if (self.searchQuery) {
          var q = self.searchQuery.toLowerCase();
          items = items.filter(function (p) {
            var nombre = (p.nombre || '').toLowerCase();
            var codigo = (p.codigoBarras || '').toLowerCase();
            return nombre.indexOf(q) !== -1 || codigo.indexOf(q) !== -1;
          });
        }
        var field = self.sortBy;
        var dir = self.sortAsc ? 1 : -1;
        items = items.slice().sort(function (a, b) {
          var va = a[field]; var vb = b[field];
          if (va === null || va === undefined) va = '';
          if (vb === null || vb === undefined) vb = '';
          if (typeof va === 'string') va = va.toLowerCase();
          if (typeof vb === 'string') vb = vb.toLowerCase();
          if (field === 'precio' || field === 'stock') {
            va = Number(va) || 0; vb = Number(vb) || 0;
          }
          if (va < vb) return -dir;
          if (va > vb) return dir;
          return 0;
        });
        return items;
      }
    };
  };
})();
