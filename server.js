const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const capturasDir = path.join(__dirname, "capturas");

// Asegurar que exista la carpeta de capturas
if (!fs.existsSync(capturasDir)) {
  fs.mkdirSync(capturasDir, { recursive: true });
}

// Soporte para recibir imágenes base64 de gran tamaño
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Servir estáticos en / y /public para compatibilidad
app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Endpoint para guardar capturas manuales directamente en la carpeta capturas/
app.post("/guardar-captura", (req, res) => {
  try {
    const { filename, image } = req.body;
    if (!filename || !image) {
      return res.status(400).json({ error: "Faltan parámetros filename o image" });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const safeName = path.basename(filename);
    const destPath = path.join(capturasDir, safeName);

    fs.writeFileSync(destPath, buffer);
    console.log(`📸 Captura manual guardada exitosamente en: capturas/${safeName}`);

    return res.json({ success: true, filename: safeName, path: `capturas/${safeName}` });
  } catch (err) {
    console.error("❌ Error guardando captura:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Servir index.html en la raíz y en /index.html
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Descomposición oficial en 6 Componentes DFD y sus subcomponentes
const pantallas = [
  // Componente 1: Autenticación y Seguridad
  { archivo: "mockup_login.html", nombre: "1_1_Onboarding_Cedula.png" },
  { archivo: "mockup_ingresar_pin.html", nombre: "1_1_Ingresar_PIN.png" },
  { archivo: "mockup_crear_pin.html", nombre: "1_1_Crear_PIN_Registro.png" },
  { archivo: "mockup_crear_pin.html?error=formato", nombre: "1_1_Error_Formato_PIN.png" },
  { archivo: "mockup_crear_pin.html?error=coincidencia", nombre: "1_1_Error_Coincidencia_PIN.png" },
  { archivo: "mockup_otp.html", nombre: "1_2_Recuperacion_OTP_SMS.png" },
  { archivo: "mockup_1_3_cierre_sesion.html", nombre: "1_3_Cierre_Sesion.png" },

  // Componente 2: Gestión de Usuarios y Roles
  { archivo: "mockup_selector_rol.html", nombre: "2_1_Selector_Rol_Principal.png" },
  { archivo: "mockup_2_1_perfil_usuario.html", nombre: "2_1_Perfil_Usuario_Contacto.png" },
  { archivo: "mockup_2_2_registro_colaborativo.html", nombre: "2_2_Registro_Colaborativo.png" },
  { archivo: "mockup_2_3_gestion_pasivos.html", nombre: "2_3_Gestion_Perfiles_Pasivos.png" },

  // Componente 3: Módulo de Publicaciones y Ofertas
  { archivo: "mockup_3_1_publicar_vacante.html", nombre: "3_1_Publicacion_Cierre_Vacante.png" },
  { archivo: "mockup_3_2_postulacion_jornalero.html", nombre: "3_2_Postulacion_Jornalero.png" },
  { archivo: "mockup_jornalero_estado.html?estado=enviada", nombre: "3_2_Estado_Postulacion_Enviada.png" },
  { archivo: "mockup_jornalero_estado.html?estado=aceptada", nombre: "3_2_Estado_Postulacion_Aceptada.png" },
  { archivo: "mockup_3_3_gestion_postulaciones.html", nombre: "3_3_Gestion_Postulacion_Productor.png" },

  // Componente 4: Directorio y Geolocalización (Módulo Lista)
  { archivo: "mockup_4_1_directorio_trabajadores.html", nombre: "4_1_Lista_Trabajadores_Region.png" },
  { archivo: "mockup_4_2_directorio_fincas.html", nombre: "4_2_Lista_Fincas_Region.png" },

  // Componente 5: Interacción y Contacto
  { archivo: "mockup_5_1_chat_interno.html", nombre: "5_1_Chat_Bidireccional_Interno.png" },
  { archivo: "mockup_5_2_contacto_externo.html", nombre: "5_2_Contacto_Externo_Llamada_SMS.png" },

  // Componente 6: Validación de Asistencia en Campo (Evidencia)
  { archivo: "mockup_6_1_checkin_documento.html", nombre: "6_1_CheckIn_Captura_Documento.png" },
  { archivo: "mockup_6_2_checkout_evidencia.html", nombre: "6_2_CheckOut_Evidencia_Actividad.png" }
];

async function generarCapturas(puerto) {
  let browser;
  try {
    console.log("🚀 Iniciando Puppeteer...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000 });

    console.log(`📸 Generando capturas para ${pantallas.length} pantallas (6 Componentes DFD)...\n`);

    for (const [index, pantalla] of pantallas.entries()) {
      process.stdout.write(
        `[${index + 1}/${pantallas.length}] Tomando foto de ${pantalla.archivo}... `
      );
      await page.goto(`http://localhost:${puerto}/${pantalla.archivo}`, {
        waitUntil: "networkidle0",
      });

      // Fondo transparente y desactivar animaciones antes de la foto
      await page.evaluate(() => {
        document.body.style.backgroundColor = "transparent";
        document.documentElement.style.backgroundColor = "transparent";
        const style = document.createElement("style");
        style.innerHTML = `
          * { animation: none !important; transition: none !important; scrollbar-width: none !important; }
          ::-webkit-scrollbar { display: none !important; }
          .alert, .status-hero, .msg-bubble { opacity: 1 !important; transform: none !important; }
        `;
        document.head.appendChild(style);
      });

      const elementoCelular = await page.$(".mobile-frame");
      if (elementoCelular) {
        await elementoCelular.screenshot({
          path: path.join(capturasDir, pantalla.nombre),
          omitBackground: true,
        });
        console.log(`✔ Guardado en: ${pantalla.nombre}`);
      } else {
        console.log("⚠️ No se encontró .mobile-frame");
      }
    }

    console.log('\n🎉 ¡Todas las capturas fueron generadas exitosamente en la carpeta "capturas"!\n');
    return true;
  } catch (error) {
    console.error("\n❌ Error al generar las capturas:", error);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

app.get("/generar-todas", async (req, res) => {
  const exito = await generarCapturas(PORT);
  if (exito) {
    res.send("¡Éxito! Todas las capturas de los 6 componentes fueron generadas correctamente.");
  } else {
    res.status(500).send("Error al generar las capturas");
  }
});

const modoServidor = process.argv.includes("--serve") || process.argv.includes("-s");

const server = app.listen(PORT, async () => {
  if (modoServidor) {
    console.log(`🌐 Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`Abre en tu navegador: http://localhost:${PORT}`);
    console.log(`Generar capturas vía web: http://localhost:${PORT}/generar-todas`);
  } else {
    console.log(`🌐 Servidor iniciado temporalmente en http://localhost:${PORT}`);
    await generarCapturas(PORT);
    server.close(() => {
      console.log("🔒 Servidor cerrado. Proceso completado.");
      process.exit(0);
    });
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
  } else {
    console.error("\n❌ Error en el servidor:", err);
  }
});
