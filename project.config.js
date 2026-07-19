window.APP_CONFIG = {
  app: { id: 'aha-pos', nombre: 'AHA POS', version: '1.0.0' },
  perfil: 'lite',
  iaJutia: { perfil: 'lite' },
  modulosActivos: ['ventas', 'productos', 'corte', 'devoluciones', 'reportes'],
  modulos: {
    ventas: { titulo: 'Ventas', icono: 'bi bi-cart3', activo: true },
    productos: { titulo: 'Productos', icono: 'bi bi-box', activo: true },
    corte: { titulo: 'Corte', icono: 'bi bi-cash-stack', activo: true },
    devoluciones: { titulo: 'Devoluciones', icono: 'bi bi-arrow-return-left', activo: true },
    reportes: { titulo: 'Reportes', icono: 'bi bi-graph-up', activo: true }
  },
  tema: {
    modo: 'light',
    colores: { primary: '#059669', secondary: '#78716c', accent: '#f59e0b' },
    tipografia: { familia: 'Inter, system-ui, sans-serif' },
    radius: '1rem'
  },
  cifrado: { camposSensibles: [], storageKey: 'aha-pos-key' },
  ui: { formsMode: 'modal', alerts: 'toast', confirmDelete: true, avatars: false },
  data: { dir: 'data/', maxFileSize: 10485760, tipos: ['avatar', 'foto', 'doc', 'logo', 'backup'] },
  sync: { primaryFormat: 'json', includeFiles: true, encrypt: true, maxExportSize: 52428800 },
  extraLibs: ['chart.js']
};
