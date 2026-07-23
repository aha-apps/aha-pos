(function () {
  'use strict';

  window.Reportes = {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'bi bi-graph-up',

    stats: { ventasHoy: 0, ventasSemana: 0, ventasMes: 0, totalVentasHoy: 0, totalVentasSemana: 0, totalVentasMes: 0, totalProductos: 0, stockBajo: 0, totalDevoluciones: 0 },
    ventas: [],
    productosTop: [],
    chartInstances: {},
    periodo: 'semana',

    init: async function () {
      console.log('[reportes] Inicializado');
      this.destruirGraficos();
    },

    render: async function (params) {
      var self = this;

      var html = '<div class="space-y-6">';

      // Toolbar
      html += '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">';
      html += '  <h2 class="text-xl font-bold">Reportes y Estadísticas</h2>';
      html += '  <button class="btn btn-primary btn-sm btn-spring gap-2" onclick="window.Reportes.exportCSV()">';
      html += '    <i class="bi bi-download"></i> Exportar CSV';
      html += '  </button>';
      html += '</div>';

      // KPI Cards
      html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4 stagger-item" style="animation-delay:0s">';
      html += '    <div class="kpi-label">Ventas Hoy</div>';
      html += '    <div class="kpi-value text-primary mt-1" id="stat-ventas-hoy-valor">0</div>';
      html += '    <div class="text-xs text-base-content/50 mt-1" id="stat-ventas-hoy-total">$0</div>';
      html += '  </div>';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4 stagger-item" style="animation-delay:0.05s">';
      html += '    <div class="kpi-label">Ventas Esta Semana</div>';
      html += '    <div class="kpi-value text-secondary mt-1" id="stat-ventas-semana-valor">0</div>';
      html += '    <div class="text-xs text-base-content/50 mt-1" id="stat-ventas-semana-total">$0</div>';
      html += '  </div>';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4 stagger-item" style="animation-delay:0.1s">';
      html += '    <div class="kpi-label">Ventas Este Mes</div>';
      html += '    <div class="kpi-value text-accent mt-1" id="stat-ventas-mes-valor">0</div>';
      html += '    <div class="text-xs text-base-content/50 mt-1" id="stat-ventas-mes-total">$0</div>';
      html += '  </div>';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4 stagger-item" style="animation-delay:0.15s">';
      html += '    <div class="kpi-label">Stock Bajo</div>';
      html += '    <div class="kpi-value text-error mt-1" id="stat-stock-bajo">0</div>';
      html += '    <div class="text-xs text-base-content/50 mt-1">Productos con stock &lt; 5</div>';
      html += '  </div>';

      html += '</div>';

      // Period selector
      html += '<div class="flex gap-2" role="tablist">';
      html += '  <button class="btn btn-sm period-tab" data-period="hoy" onclick="window.Reportes.cambiarPeriodo(\'hoy\')">Hoy</button>';
      html += '  <button class="btn btn-sm period-tab btn-active" data-period="semana" onclick="window.Reportes.cambiarPeriodo(\'semana\')">Esta Semana</button>';
      html += '  <button class="btn btn-sm period-tab" data-period="mes" onclick="window.Reportes.cambiarPeriodo(\'mes\')">Este Mes</button>';
      html += '</div>';

      // Charts row 1
      html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4">';
      html += '    <div class="kpi-label mb-3">Ventas por Día</div>';
      html += '    <div class="relative" style="height:260px">';
      html += '      <canvas id="chart-ventas-diarias"></canvas>';
      html += '    </div>';
      html += '  </div>';

      html += '  <div class="card bg-base-100 border border-base-200 rounded-xl p-4">';
      html += '    <div class="kpi-label mb-3">Productos Más Vendidos</div>';
      html += '    <div class="relative" style="height:260px">';
      html += '      <canvas id="chart-productos-top"></canvas>';
      html += '    </div>';
      html += '  </div>';

      html += '</div>';

      // Chart row 2
      html += '<div class="card bg-base-100 border border-base-200 rounded-xl p-4 max-w-md mx-auto">';
      html += '  <div class="kpi-label mb-3">Ventas por Método de Pago</div>';
      html += '  <div class="relative" style="height:220px">';
      html += '    <canvas id="chart-metodo-pago"></canvas>';
      html += '  </div>';
      html += '</div>';

      html += '</div>';

      // Defer chart rendering — done() inyecta el HTML via microtask antes de este setTimeout
      setTimeout(function () {
        self.destruirGraficos();
        self.cargarDatos().then(function () {
          self.renderGraficos();
        });
      }, 0);

      return html;
    },

    destroy: function () {
      this.destruirGraficos();
    },

    cargarDatos: async function () {
      try {
        var ahora = new Date();
        var inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        var inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        var inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

        var todasVentas = await db.ventas.toArray();
        var totalProductos = await db.productos.count();

        var ventasHoy = todasVentas.filter(function (v) {
          var d = new Date(v.createdAt);
          return d >= inicioHoy;
        });
        var ventasSemana = todasVentas.filter(function (v) {
          var d = new Date(v.createdAt);
          return d >= inicioSemana;
        });
        var ventasMes = todasVentas.filter(function (v) {
          var d = new Date(v.createdAt);
          return d >= inicioMes;
        });

        var ventasFiltradas = [];
        if (this.periodo === 'hoy') ventasFiltradas = ventasHoy;
        else if (this.periodo === 'semana') ventasFiltradas = ventasSemana;
        else ventasFiltradas = ventasMes;

        this.ventas = ventasFiltradas;

        // Productos top: aggregate from ventas items
        var productCount = {};
        ventasFiltradas.forEach(function (v) {
          if (v.items && Array.isArray(v.items)) {
            v.items.forEach(function (item) {
              var pid = item.productoId || item.id;
              if (pid) {
                if (!productCount[pid]) productCount[pid] = { id: pid, nombre: item.nombre || 'Producto', cantidad: 0, total: 0 };
                productCount[pid].cantidad += item.cantidad || 1;
                productCount[pid].total += item.subtotal || item.precio || 0;
              }
            });
          }
        });
        this.productosTop = Object.values(productCount)
          .sort(function (a, b) { return b.cantidad - a.cantidad; })
          .slice(0, 10);

        // Stock bajo
        var productos = await db.productos.toArray();
        var stockBajo = productos.filter(function (p) { return p.stock < 5; }).length;

        // Devoluciones
        var totalDevoluciones = await db.devoluciones.count();

        this.stats = {
          ventasHoy: ventasHoy.length,
          ventasSemana: ventasSemana.length,
          ventasMes: ventasMes.length,
          totalVentasHoy: ventasHoy.reduce(function (s, v) { return s + (v.total || 0); }, 0),
          totalVentasSemana: ventasSemana.reduce(function (s, v) { return s + (v.total || 0); }, 0),
          totalVentasMes: ventasMes.reduce(function (s, v) { return s + (v.total || 0); }, 0),
          totalProductos: totalProductos,
          stockBajo: stockBajo,
          totalDevoluciones: totalDevoluciones
        };

        this._actualizarUI();
      } catch (err) {
        console.error('[reportes] Error cargando datos:', err);
        if (window.UI) UI.toast('Error al cargar datos: ' + err.message, 'error');
      }
    },

    _actualizarUI: function () {
      var s = this.stats;
      var setText = function (id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      setText('stat-ventas-hoy-valor', s.ventasHoy);
      setText('stat-ventas-hoy-total', UI.formatCurrency(s.totalVentasHoy));
      setText('stat-ventas-semana-valor', s.ventasSemana);
      setText('stat-ventas-semana-total', UI.formatCurrency(s.totalVentasSemana));
      setText('stat-ventas-mes-valor', s.ventasMes);
      setText('stat-ventas-mes-total', UI.formatCurrency(s.totalVentasMes));
      setText('stat-stock-bajo', s.stockBajo);
    },

    renderGraficos: function () {
      this.destruirGraficos();

      var ventasPeriodo = this.ventas;

      // Chart 1: Ventas por día (bar) — last 7 days
      var dias = [];
      var totals = [];
      var ahora = new Date();
      for (var i = 6; i >= 0; i--) {
        var d = new Date(ahora);
        d.setDate(ahora.getDate() - i);
        var key = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
        dias.push(key);
        var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        var dayEnd = new Date(dayStart.getTime() + 86400000);
        var total = ventasPeriodo
          .filter(function (v) {
            var vd = new Date(v.createdAt);
            return vd >= dayStart && vd < dayEnd;
          })
          .reduce(function (s, v) { return s + (v.total || 0); }, 0);
        totals.push(total);
      }

      var ctx1 = document.getElementById('chart-ventas-diarias');
      if (ctx1) {
        this.chartInstances.ventasDiarias = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: dias,
            datasets: [{
              label: 'Ventas',
              data: totals,
              backgroundColor: 'rgba(5, 150, 105, 0.7)',
              borderColor: '#059669',
              borderWidth: 2,
              borderRadius: 6,
              barThickness: 32
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function (val) { return '$' + Number(val).toLocaleString('es-MX'); }
                },
                grid: { color: 'rgba(0,0,0,0.06)' }
              },
              x: {
                grid: { display: false }
              }
            }
          }
        });
      }

      // Chart 2: Productos top (horizontal bar)
      var top = this.productosTop;
      var labels = top.map(function (p) { return p.nombre.length > 20 ? p.nombre.substring(0, 20) + '...' : p.nombre; });
      var data = top.map(function (p) { return p.cantidad; });

      var ctx2 = document.getElementById('chart-productos-top');
      if (ctx2) {
        this.chartInstances.productosTop = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Unidades vendidas',
              data: data,
              backgroundColor: [
                'rgba(5, 150, 105, 0.8)',
                'rgba(120, 113, 108, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(34, 211, 238, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(52, 211, 153, 0.8)',
                'rgba(248, 113, 113, 0.8)'
              ],
              borderColor: '#fff',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                grid: { color: 'rgba(0,0,0,0.06)' }
              },
              y: {
                grid: { display: false }
              }
            }
          }
        });
      }

      // Chart 3: Ventas por método de pago (doughnut)
      var metodoCount = {};
      ventasPeriodo.forEach(function (v) {
        var mp = v.metodoPago || 'Efectivo';
        if (!metodoCount[mp]) metodoCount[mp] = 0;
        metodoCount[mp] += v.total || 0;
      });
      var metLabels = Object.keys(metodoCount);
      var metData = Object.values(metodoCount);
      var metColors = ['#059669', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444', '#78716c'];

      var ctx3 = document.getElementById('chart-metodo-pago');
      if (ctx3) {
        this.chartInstances.metodoPago = new Chart(ctx3, {
          type: 'doughnut',
          data: {
            labels: metLabels,
            datasets: [{
              data: metData,
              backgroundColor: metColors.slice(0, metLabels.length),
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 16,
                  usePointStyle: true,
                  font: { size: 12 }
                }
              },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                    var pct = ((ctx.parsed / total) * 100).toFixed(1);
                    return ctx.label + ': ' + UI.formatCurrency(ctx.parsed) + ' (' + pct + '%)';
                  }
                }
              }
            }
          }
        });
      }
    },

    cambiarPeriodo: async function (periodo) {
      this.periodo = periodo;

      document.querySelectorAll('.period-tab').forEach(function (btn) {
        btn.classList.remove('btn-active');
        var p = btn.getAttribute('data-period');
        if (p === periodo) btn.classList.add('btn-active');
      });

      await this.cargarDatos();
      this.destruirGraficos();
      this.renderGraficos();
    },

    exportCSV: function () {
      try {
        var ventas = this.ventas;
        if (!ventas || ventas.length === 0) {
          UI.toast('No hay datos para exportar del período seleccionado', 'warning');
          return;
        }

        var headers = ['Folio', 'Total', 'Método de Pago', 'Artículos', 'Fecha'];
        var rows = ventas.map(function (v) {
          var itemsStr = '';
          if (v.items && Array.isArray(v.items)) {
            itemsStr = v.items.map(function (i) { return i.nombre || 'Producto'; }).join('; ');
          }
          var fecha = v.createdAt ? new Date(v.createdAt).toLocaleString('es-MX') : '';
          return [v.folio || '', v.total || 0, v.metodoPago || '', itemsStr, fecha];
        });

        var csv = '\uFEFF' + headers.join(',') + '\n';
        rows.forEach(function (row) {
          var escaped = row.map(function (cell) {
            if (typeof cell === 'string' && (cell.indexOf(',') !== -1 || cell.indexOf('"') !== -1 || cell.indexOf('\n') !== -1)) {
              return '"' + cell.replace(/"/g, '""') + '"';
            }
            return String(cell);
          });
          csv += escaped.join(',') + '\n';
        });

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'reporte-ventas-' + this.periodo + '-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        UI.toast('CSV exportado correctamente', 'success');
      } catch (err) {
        console.error('[reportes] Error exportando CSV:', err);
        UI.toast('Error al exportar: ' + err.message, 'error');
      }
    },

    destruirGraficos: function () {
      Object.keys(this.chartInstances).forEach(function (key) {
        if (this.chartInstances[key]) {
          this.chartInstances[key].destroy();
          delete this.chartInstances[key];
        }
      }, this);
    }
  };

  window.MODULES = window.MODULES || {};
  window.MODULES.reportes = window.Reportes;
})();
