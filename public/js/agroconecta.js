/**
 * AgroConecta - Gestor de Estado Simulado y Enrutamiento DFD
 * Maneja lógica de Cédula existente vs nueva, validación de PIN, RBAC, vacantes y estados.
 */

const AgroDB = {
  // Cédulas previamente registradas en la base de datos simulada
  usuariosRegistrados: [
    { cedula: "10948572", nombre: "Hernán Restrepo", pin: "1234", rol: "productor", finca: "Finca La Esperanza", vereda: "El Caimo" },
    { cedula: "79854120", nombre: "José Albeiro Gómez", pin: "4321", rol: "jornalero", vereda: "El Caimo" },
    { cedula: "12345678", nombre: "Don Mario Valencia", pin: "1111", rol: "productor", finca: "Hacienda El Paraíso", vereda: "Pantanillo" },
    { cedula: "1094000000", nombre: "Carlos Restrepo", pin: "2222", rol: "jornalero", vereda: "Pantanillo" }
  ],

  // Cédula de prueba nueva por defecto
  cedulaNuevaEjemplo: "99887766",

  // Vacantes iniciales
  vacantesIniciales: [
    {
      id: "vac-01",
      finca: "Finca La Esperanza",
      mayordomo: "Don Hernán Restrepo",
      vereda: "Vereda El Caimo",
      distancia: "1.2 km",
      labor: "Recolección de Café",
      cuposTotales: 5,
      cuposDisponibles: 3,
      pago: "A destajo ($850 / kilo)",
      inicio: "Mañana 6:00 AM",
      requisitos: "Canasto propio y cédula física para check-in",
      almuerzo: "Incluido en la finca",
      urgente: true
    },
    {
      id: "vac-02",
      finca: "Finca El Paraíso",
      mayordomo: "Doña Clara Inés",
      vereda: "Vereda Pantanillo",
      distancia: "2.8 km",
      labor: "Guadaña / Desyerba",
      cuposTotales: 2,
      cuposDisponibles: 1,
      pago: "$55.000 / día completo",
      inicio: "Mañana 6:30 AM",
      requisitos: "Experiencia en guadaña 2 tiempos",
      almuerzo: "Traer fiambre",
      urgente: false
    },
    {
      id: "vac-03",
      finca: "Hacienda Buenavista",
      mayordomo: "Don Mario",
      vereda: "Vereda El Caimo",
      distancia: "3.5 km",
      labor: "Fumigación y Plateo",
      cuposTotales: 3,
      cuposDisponibles: 2,
      pago: "$60.000 / día",
      inicio: "Viernes 6:00 AM",
      requisitos: "Equipo de protección básica",
      almuerzo: "Incluido",
      urgente: false
    }
  ],

  // Postulaciones iniciales para el modo productor
  postulacionesIniciales: [
    {
      id: "post-01",
      vacanteId: "vac-01",
      nombre: "José Albeiro Gómez",
      cedula: "79854120",
      vereda: "Vereda El Caimo",
      experiencia: "12 años en cosecha de café (pisa y destajo)",
      telefono: "312 450 8921",
      estado: "pendiente", // 'pendiente', 'aceptado', 'rechazado'
      fecha: "Hace 15 minutos"
    },
    {
      id: "post-02",
      vacanteId: "vac-01",
      nombre: "Marta Lucía Rendón",
      cedula: "52890123",
      vereda: "Vereda Pantanillo",
      experiencia: "Recolectora destacada - 80 kg/día promedio",
      telefono: "314 882 1093",
      estado: "pendiente",
      fecha: "Hace 30 minutos"
    },
    {
      id: "post-03",
      vacanteId: "vac-01",
      nombre: "Jairo de Jesús Osorio",
      cedula: "10943341",
      vereda: "Vereda La Linda",
      experiencia: "Oficios varios y recolector",
      telefono: "311 762 9014",
      estado: "pendiente",
      fecha: "Hace 1 hora"
    }
  ]
};

// Objeto de gestión de sesión y enrutamiento
const AgroConecta = {
  // Inicializar almacenamiento si está vacío
  init() {
    if (!localStorage.getItem('agro_vacantes')) {
      localStorage.setItem('agro_vacantes', JSON.stringify(AgroDB.vacantesIniciales));
    }
    if (!localStorage.getItem('agro_postulaciones')) {
      localStorage.setItem('agro_postulaciones', JSON.stringify(AgroDB.postulacionesIniciales));
    }
  },

  // Obtener parámetro de URL
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  // Guardar y consultar cédula actual
  setCedula(cedula) {
    sessionStorage.setItem('agro_cedula_activa', cedula);
  },

  getCedula() {
    return this.getQueryParam('cedula') || sessionStorage.getItem('agro_cedula_activa') || "10948572";
  },

  // Comprobar si una cédula existe en la base de datos simulada
  cedulaExiste(cedula) {
    if (!cedula) return false;
    const clean = cedula.toString().trim();
    // Si la cédula coincide con las registradas o si fue registrada en esta sesión
    const nuevasRegistradas = JSON.parse(sessionStorage.getItem('agro_nuevas_cedulas') || '[]');
    return AgroDB.usuariosRegistrados.some(u => u.cedula === clean) || nuevasRegistradas.includes(clean);
  },

  // Guardar nueva cédula registrada
  registrarNuevaCedula(cedula, pin) {
    const nuevasRegistradas = JSON.parse(sessionStorage.getItem('agro_nuevas_cedulas') || '[]');
    if (!nuevasRegistradas.includes(cedula)) {
      nuevasRegistradas.push(cedula);
      sessionStorage.setItem('agro_nuevas_cedulas', JSON.stringify(nuevasRegistradas));
    }
    this.setCedula(cedula);
    sessionStorage.setItem('agro_pin_' + cedula, pin);
  },

  // Rol activo (RBAC: 'productor' | 'jornalero')
  setRol(rol) {
    sessionStorage.setItem('agro_rol_activo', rol);
  },

  getRol() {
    return this.getQueryParam('rol') || sessionStorage.getItem('agro_rol_activo') || 'productor';
  },

  // Obtener estado de postulación del jornalero
  getJornaleroEstado() {
    return sessionStorage.getItem('agro_estado_postulacion') || 'aceptado'; // 'enviada' | 'aceptado'
  },

  setJornaleroEstado(estado) {
    sessionStorage.setItem('agro_estado_postulacion', estado);
  },

  // Postulaciones
  getPostulaciones() {
    this.init();
    return JSON.parse(localStorage.getItem('agro_postulaciones') || '[]');
  },

  actualizarPostulacion(id, nuevoEstado) {
    const list = this.getPostulaciones();
    const item = list.find(p => p.id === id);
    if (item) {
      item.estado = nuevoEstado;
      localStorage.setItem('agro_postulaciones', JSON.stringify(list));
    }
    return list;
  },

  // Vacantes
  getVacantes() {
    this.init();
    return JSON.parse(localStorage.getItem('agro_vacantes') || '[]');
  },

  agregarVacante(vacante) {
    const list = this.getVacantes();
    list.unshift(vacante);
    localStorage.setItem('agro_vacantes', JSON.stringify(list));
    return list;
  }
};

// Inicializar al cargar
AgroConecta.init();

// Detectar si está embebido en el simulador de index.html
if (window.self !== window.top) {
  document.documentElement.classList.add('in-iframe');
}

