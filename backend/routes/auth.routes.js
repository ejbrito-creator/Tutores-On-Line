
const express = require("express");
const bcrypt = require("bcrypt");
const { obtenerDB } = require("../config/database");

const router = express.Router();

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
  try {
    const {
      name, email, pw, role,
      subj, level, loc, price
    } = req.body || {};

    // 1. Validar datos generales
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof pw !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Nombre, correo y contraseña son obligatorios."
      });
    }

    const nombre = name.trim();
    const correo = email.trim().toLowerCase();

    if (nombre.length < 3 || nombre.length > 100) {
      return res.status(400).json({
        mensaje: "El nombre debe tener entre 3 y 100 caracteres."
      });
    }

    if (
      correo.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      return res.status(400).json({
        mensaje: "El correo electrónico no es válido."
      });
    }

    if (pw.length < 8 || pw.length > 72) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener entre 8 y 72 caracteres."
      });
    }

    if (!["student", "tutor"].includes(role)) {
      return res.status(400).json({
        mensaje: "Selecciona un tipo de cuenta válido."
      });
    }

    // 2. Construir el usuario
    const usuario = {
      nombre,
      correo,
      passwordHash: await bcrypt.hash(pw, 12),
      rol: role === "student" ? "estudiante" : "tutor",
      estado: "activo",
      fechaRegistro: new Date()
    };

    // 3. Validar datos adicionales del tutor
    if (role === "tutor") {
      const campos = [subj, level, loc];

      if (
        campos.some(c => typeof c !== "string" || !c.trim()) ||
        !Number.isSafeInteger(price) ||
        price <= 0
      ) {
        return res.status(400).json({
          mensaje: "Completa correctamente los datos del tutor."
        });
      }

      const materias = subj.split(",")
        .map(m => m.trim())
        .filter(Boolean);

      if (
        materias.length === 0 ||
        materias.length > 10 ||
        materias.some(m => m.length > 80) ||
        level.length > 100 ||
        loc.length > 100
      ) {
        return res.status(400).json({
          mensaje: "Revisa las materias, el nivel y la ubicación."
        });
      }

      usuario.perfilTutor = {
        materias,
        nivel: level.trim(),
        ubicacion: loc.trim(),
        precioHora: price,
        estadoPublicacion: "pendiente"
      };
    }

    // 4. Guardar en MongoDB
    const db = obtenerDB();
    const resultado = await db
      .collection("usuarios")
      .insertOne(usuario);

    // 5. Responder sin revelar la contraseña
    return res.status(201).json({
      mensaje: "Cuenta creada correctamente.",
      usuario: {
        id: resultado.insertedId.toString(),
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    // Índice único: correo duplicado
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: "Ese correo ya está registrado."
      });
    }

    console.error("Error al registrar usuario:", error);

    return res.status(500).json({
      mensaje: "No fue posible crear la cuenta."
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, pw } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof pw !== "string" ||
      !email.trim() ||
      !pw
    ) {
      return res.status(400).json({
        mensaje: "Debes ingresar correo y contraseña."
      });
    }

    const correo = email.trim().toLowerCase();
    const db = obtenerDB();

    const usuario = await db.collection("usuarios").findOne({
      correo
    });

    // No revelamos si el correo existe o no.
    if (!usuario) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos."
      });
    }

    const contraseñaValida = await bcrypt.compare(
      pw,
      usuario.passwordHash
    );

    if (!contraseñaValida) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos."
      });
    }

    if (usuario.estado !== "activo") {
      return res.status(403).json({
        mensaje: "Esta cuenta no está activa."
      });
    }

    // Regenerar la sesión para evitar reutilizar un identificador anterior.
    await new Promise((resolve, reject) => {
      req.session.regenerate(error => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Guardar únicamente el identificador del usuario.
    req.session.usuarioId = usuario._id.toString();

    // Confirmar que la sesión quedó guardada antes de responder.
    await new Promise((resolve, reject) => {
      req.session.save(error => {
        if (error) return reject(error);
        resolve();
      });
    });


    return res.status(200).json({
      mensaje: "Credenciales verificadas correctamente.",
      usuario: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error al verificar credenciales:", error);

    return res.status(500).json({
      mensaje: "No fue posible verificar las credenciales."
    });
  }
});


router.get("/me", async (req, res) => {
  try {
    if (!req.session.usuarioId) {
      return res.status(401).json({
        mensaje: "No hay una sesión activa."
      });
    }

    const { ObjectId } = require("mongodb");

    if (!ObjectId.isValid(req.session.usuarioId)) {
      return res.status(401).json({
        mensaje: "Sesión inválida."
      });
    }

    const db = obtenerDB();

    const usuario = await db.collection("usuarios").findOne({
      _id: new ObjectId(req.session.usuarioId)
    });

    if (!usuario || usuario.estado !== "activo") {
      return res.status(401).json({
        mensaje: "La sesión ya no es válida."
      });
    }

    return res.status(200).json({
      usuario: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error al recuperar la sesión:", error);

    return res.status(500).json({
      mensaje: "No fue posible recuperar la sesión."
    });
  }
});


router.post("/logout", (req, res) => {
  if (!req.session.usuarioId) {
    return res.status(200).json({
      mensaje: "No había una sesión activa."
    });
  }

  req.session.destroy(error => {
    if (error) {
      console.error("Error al cerrar sesión:", error);

      return res.status(500).json({
        mensaje: "No fue posible cerrar la sesión."
      });
    }

    res.clearCookie("tutoresonline.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false
    });

    return res.status(200).json({
      mensaje: "Sesión cerrada correctamente."
    });
  });
});


module.exports = router;
