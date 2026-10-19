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
  },

  // ----------------------------------------------------
  // Captura Manual de Pantalla (lo que está dentro del recuadro mobile)
  // ----------------------------------------------------
  async asegurarHtmlToImage() {
    if (typeof htmlToImage !== 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Detectar ruta relativa o absoluta
      script.src = window.location.pathname.includes('/public/') ? 'js/html-to-image.js' : 'public/js/html-to-image.js';
      script.onload = () => resolve();
      script.onerror = () => {
        // Fallback a CDN si falla la carga local
        const cdn = document.createElement('script');
        cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
        cdn.onload = () => resolve();
        cdn.onerror = (e) => reject(new Error('No se pudo cargar la librería de captura.'));
        document.head.appendChild(cdn);
      };
      document.head.appendChild(script);
    });
  },

  async tomarCapturaManual(nombrePersonalizado) {
    const btn = document.querySelector('.btn-top-captura') || document.querySelector('.capture-chip');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '⏳ Capturando...';
      btn.disabled = true;
    }

    try {
      await this.asegurarHtmlToImage();
      const mobileFrame = document.querySelector('.mobile-frame') || document.body;

      const mapaNombresOficiales = {
        "mockup_login.html": "1_1_Onboarding_Cedula.png",
        "mockup_ingresar_pin.html": "1_1_Ingresar_PIN.png",
        "mockup_crear_pin.html": "1_1_Crear_PIN_Registro.png",
        "mockup_crear_pin.html?error=formato": "1_1_Error_Formato_PIN.png",
        "mockup_crear_pin.html?error=coincidencia": "1_1_Error_Coincidencia_PIN.png",
        "mockup_otp.html": "1_2_Recuperacion_OTP_SMS.png",
        "mockup_1_3_cierre_sesion.html": "1_3_Cierre_Sesion.png",
        "mockup_selector_rol.html": "2_1_Selector_Rol_Principal.png",
        "mockup_2_1_perfil_usuario.html": "2_1_Perfil_Usuario_Contacto.png",
        "mockup_2_2_registro_colaborativo.html": "2_2_Registro_Colaborativo.png",
        "mockup_2_3_gestion_pasivos.html": "2_3_Gestion_Perfiles_Pasivos.png",
        "mockup_3_1_publicar_vacante.html": "3_1_Publicacion_Cierre_Vacante.png",
        "mockup_3_2_postulacion_jornalero.html": "3_2_Postulacion_Jornalero.png",
        "mockup_jornalero_estado.html?estado=enviada": "3_2_Estado_Postulacion_Enviada.png",
        "mockup_jornalero_estado.html?estado=aceptada": "3_2_Estado_Postulacion_Aceptada.png",
        "mockup_jornalero_estado.html": "3_2_Estado_Postulacion_Enviada.png",
        "mockup_3_3_gestion_postulaciones.html": "3_3_Gestion_Postulacion_Productor.png",
        "mockup_4_1_directorio_trabajadores.html": "4_1_Lista_Trabajadores_Region.png",
        "mockup_4_2_directorio_fincas.html": "4_2_Lista_Fincas_Region.png",
        "mockup_5_1_chat_interno.html": "5_1_Chat_Bidireccional_Interno.png",
        "mockup_5_2_contacto_externo.html": "5_2_Contacto_Externo_Llamada_SMS.png",
        "mockup_6_1_checkin_documento.html": "6_1_CheckIn_Captura_Documento.png",
        "mockup_6_2_checkout_evidencia.html": "6_2_CheckOut_Evidencia_Actividad.png"
      };

      let filename = '';
      if (nombrePersonalizado) {
        filename = nombrePersonalizado.endsWith('.png') ? nombrePersonalizado : `AgroConecta_${nombrePersonalizado}.png`;
      } else {
        const fullHref = window.location.href;
        const urlParts = fullHref.split('/');
        const pageWithQuery = urlParts[urlParts.length - 1];
        const pageOnly = pageWithQuery.split('?')[0];

        if (mapaNombresOficiales[pageWithQuery]) {
          filename = mapaNombresOficiales[pageWithQuery];
        } else if (mapaNombresOficiales[pageOnly]) {
          filename = mapaNombresOficiales[pageOnly];
        } else {
          const pageTitle = document.title ? document.title.replace('AgroConecta - ', '').trim() : 'pantalla';
          const cleanName = pageTitle
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_');
          filename = `AgroConecta_${cleanName}.png`;
        }
      }

      // Desactivar animaciones y ocultar scrollbars temporalmente para capturar nítido y respetar scroll
      const freezeStyle = document.createElement('style');
      freezeStyle.id = 'freeze-capture-style';
      freezeStyle.innerHTML = `
        * {
          animation: none !important;
          transition: none !important;
          scrollbar-width: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        .alert, .status-hero, .msg-bubble, [class*="alert"] {
          opacity: 1 !important;
          transform: none !important;
        }
      `;
      document.head.appendChild(freezeStyle);

      const dataUrl = await htmlToImage.toPng(mobileFrame, {
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      freezeStyle.remove();

      // Intentar guardar directamente en la carpeta capturas/ del servidor
      let guardadoEnServidor = false;
      try {
        const resp = await fetch('/guardar-captura', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, image: dataUrl })
        });
        if (resp.ok) {
          const resJson = await resp.json();
          guardadoEnServidor = resJson.success;
        }
      } catch (e) {}

      if (guardadoEnServidor) {
        this.mostrarToastCaptura(filename, dataUrl, true);
      } else {
        // Fallback a descarga regular
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.mostrarToastCaptura(filename, dataUrl, false);
      }

      return dataUrl;
    } catch (err) {
      console.error('Error al tomar captura:', err);
      alert('No se pudo tomar la captura: ' + err.message);
    } finally {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  },

  mostrarToastCaptura(filename, dataUrl, enCarpetaServidor = true) {
    const existing = document.querySelector('.toast-captura');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-captura';
    const badgeText = enCarpetaServidor 
      ? '📁 ¡Guardada en capturas/!' 
      : '⬇ ¡Descargada en tu carpeta de Descargas!';
    const badgeColor = enCarpetaServidor ? '#4ade80' : '#60a5fa';

    toast.innerHTML = `
      <img src="${dataUrl}" alt="Miniatura">
      <div class="toast-captura-info">
        <span class="toast-captura-title" style="color: ${badgeColor};">${badgeText}</span>
        <span class="toast-captura-name">capturas/${filename}</span>
      </div>
    `;

    toast.onclick = () => toast.remove();
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 5000);
  }
};

// Inicializar al cargar
AgroConecta.init();

// Detectar si está embebido en el simulador de index.html
if (window.self !== window.top) {
  document.documentElement.classList.add('in-iframe');
  window.addEventListener('DOMContentLoaded', () => {
    try {
      if (window.parent) {
        window.parent.postMessage({ action: 'PAGINA_CARGADA', href: window.location.href }, '*');
      }
    } catch (e) {}
  });
} else {
  // Standalone: Inyectar botón superior "Tomar captura" si no existe
  window.addEventListener('DOMContentLoaded', () => {
    const testBar = document.querySelector('.test-suite-bar');
    if (testBar && !testBar.querySelector('.capture-chip')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'test-chip capture-chip';
      btn.innerHTML = '📸 Tomar captura';
      btn.title = 'Tomar captura de lo que está dentro del recuadro del mobile';
      btn.onclick = () => AgroConecta.tomarCapturaManual();
      testBar.appendChild(btn);
    } else if (!testBar && !document.querySelector('.standalone-top-bar')) {
      const bar = document.createElement('div');
      bar.className = 'standalone-top-bar';
      bar.innerHTML = '<button type="button" class="btn-top-captura" onclick="AgroConecta.tomarCapturaManual()" title="Tomar captura de la pantalla">📸 Tomar captura</button>';
      document.body.insertBefore(bar, document.body.firstChild);
    }
  });
}

// Escuchar solicitudes de captura desde ventana padre (index.html)
window.addEventListener('message', async (e) => {
  if (e.data && e.data.action === 'TOMAR_CAPTURA_MANUAL') {
    const dataUrl = await AgroConecta.tomarCapturaManual(e.data.filename);
    if (window.parent) {
      window.parent.postMessage({ action: 'CAPTURA_COMPLETA', dataUrl, filename: e.data.filename }, '*');
    }
  }
});

