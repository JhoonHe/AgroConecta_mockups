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

app.use(express.static(path.join(__dirname, "public")));

const pantallas = [
  { archivo: "mockup_login.html", nombre: "1_1_Inicio_Sesion.png" },
  { archivo: "mockup_registro.html", nombre: "1_2_Registro_Usuario.png" },
  {
    archivo: "mockup_colaborativo.html",
    nombre: "1_3_Registro_Colaborativo.png",
  },
  { archivo: "mockup_otp.html", nombre: "1_4_Recuperacion_OTP.png" },
  {
    archivo: "mockup_publicar_vacante.html",
    nombre: "2_1_Publicar_Vacante.png",
  },
  { archivo: "mockup_postulacion.html", nombre: "2_2_Postulacion.png" },
  {
    archivo: "mockup_directorio_trabajadores.html",
    nombre: "3_1_Directorio_Trabajadores.png",
  },
  {
    archivo: "mockup_directorio_fincas.html",
    nombre: "3_2_Directorio_Fincas.png",
  },
  { archivo: "mockup_4_1_chat.html", nombre: "4_1_Chat_Interno.png" },
  {
    archivo: "mockup_4_2_enrutamiento.html",
    nombre: "4_2_Contacto_Externo.png",
  },
  { archivo: "mockup_chat.html", nombre: "4_3_Chat_General.png" },
  { archivo: "mockup_5_1_inicio.html", nombre: "5_1_Inicio_Jornada.png" },
  { archivo: "mockup_5_2_cierre.html", nombre: "5_2_Cierre_Jornada.png" },
];

async function generarCapturas(puerto) {
  let browser;
  try {
    console.log("🚀 Iniciando Puppeteer...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1000 });

    console.log(`📸 Generando capturas para ${pantallas.length} pantallas...\n`);

    for (const [index, pantalla] of pantallas.entries()) {
      process.stdout.write(
        `[${index + 1}/${pantallas.length}] Tomando foto de ${pantalla.archivo}... `
      );
      await page.goto(`http://localhost:${puerto}/${pantalla.archivo}`, {
        waitUntil: "networkidle0",
      });

      // Fondo transparente antes de la foto
      await page.evaluate(() => {
        document.body.style.backgroundColor = "transparent";
        document.documentElement.style.backgroundColor = "transparent";
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

// Endpoint opcional por si también se visita desde el navegador
app.get("/generar-todas", async (req, res) => {
  const exito = await generarCapturas(PORT);
  if (exito) {
    res.send("¡Éxito! Todas las capturas fueron generadas correctamente.");
  } else {
    res.status(500).send("Error al generar las capturas");
  }
});

// Si se pasa --serve o -s, mantiene el servidor abierto. Si no, genera y termina.
const modoServidor = process.argv.includes("--serve") || process.argv.includes("-s");

const server = app.listen(PORT, async () => {
  if (modoServidor) {
    console.log(`🌐 Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`Abre en tu navegador para generar: http://localhost:${PORT}/generar-todas`);
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

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n❌ Error: El puerto ${PORT} ya está en uso.`);
  } else {
    console.error("\n❌ Error en el servidor:", err);
  }
});

