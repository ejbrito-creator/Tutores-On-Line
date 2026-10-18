
const express = require("express");
const { obtenerDB } = require("../config/database");

const router = express.Router();

// GET /api/tutores
/* ===== Catálogo público de tutores ===== */
router.get("/", async (req, res) => {
  try {
    const db = obtenerDB();

    // 1. Recuperar los tutores de demostración.
    const tutoresDemo = await db.collection("tutores")
      .find({})
      .toArray();

    // 2. Recuperar únicamente tutores reales aprobados.
    const usuariosTutores = await db.collection("usuarios")
      .find({
        rol: "tutor",
        estado: "activo",
        "perfilTutor.estadoPublicacion": "aprobado"
      })
      .project({
        nombre: 1,
        perfilTutor: 1
      })
      .toArray();

    // 3. Adaptar los perfiles reales al formato del frontend.
    const tutoresRegistrados = usuariosTutores.map(usuario => {
      const perfil = usuario.perfilTutor || {};
      const materias = Array.isArray(perfil.materias)
        ? perfil.materias
        : [];

      const disponibilidad = Array.isArray(perfil.disponibilidad)
        ? perfil.disponibilidad
        : [];

      // Formato esperado por el perfil público:
      // "Lunes:09-11;Viernes:10-12"
       
      
      const av = disponibilidad
        .filter(h => h.dia && h.inicio && h.fin)
        .map(h => {
          return `${h.dia}:${h.inicio}-${h.fin}`;
        })
        .join(";");


      const id = usuario._id.toString();

      return {
        id: `registrado_${id}`,
        usuarioId: id,
        tipoPerfil: "registrado",
        name: usuario.nombre,
        subj: materias.join(", "),
        cats: materias,
        levels: perfil.nivel ? [perfil.nivel] : [],
        loc: perfil.ubicacion || "",
        mode: ["Online"],
        price: perfil.precioHora ?? 0,
        rating: 0,
        reviews: 0,
        desc: `Tutor de ${materias.join(", ")}. Perfil registrado en TutoresOn-Line.`,
        tags: materias,
        av,
        look: [0, 1, 2, 0],
        verified: false
      };
    });

    // 4. Combinar ambas fuentes.
    const catalogo = [
      ...tutoresDemo,
      ...tutoresRegistrados
    ];

    return res.status(200).json(catalogo);

  } catch (error) {
    console.error("Error al consultar el catálogo:", error);

    return res.status(500).json({
      mensaje: "No fue posible consultar los tutores."
    });
  }
});



/* ===== Consultar perfil del tutor autenticado ===== */
router.get('/mi-perfil', async (req, res) => {
  try {
    // Comprobar que exista una sesión activa.
    if (!req.session?.usuarioId) {
      return res.status(401).json({
        mensaje: 'Debes iniciar sesión.'
      });
    }

    const { ObjectId } = require('mongodb');

    if (!ObjectId.isValid(req.session.usuarioId)) {
      return res.status(401).json({
        mensaje: 'Sesión inválida.'
      });
    }

    const db = obtenerDB();

    const usuario = await db.collection('usuarios').findOne({
      _id: new ObjectId(req.session.usuarioId)
    });

    // Comprobar que la cuenta exista y esté activa.
    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({
        mensaje: 'La sesión ya no es válida.'
      });
    }

    // Solo los tutores pueden consultar este endpoint.
    if (usuario.rol !== 'tutor') {
      return res.status(403).json({
        mensaje: 'Acceso exclusivo para tutores.'
      });
    }

    return res.status(200).json({
      perfil: {
        id: usuario._id.toString(),
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        perfilTutor: usuario.perfilTutor || {}
      }
    });

  } catch (error) {
    console.error('Error al consultar perfil del tutor:', error);

    return res.status(500).json({
      mensaje: 'No fue posible consultar el perfil del tutor.'
    });
  }
});


/* ===== Actualizar perfil del tutor autenticado ===== */
router.patch('/mi-perfil', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');

    // 1. Verificar la sesión.
    if (!req.session?.usuarioId ||
        !ObjectId.isValid(req.session.usuarioId)) {
      return res.status(401).json({
        mensaje: 'Debes iniciar sesión como tutor.'
      });
    }

    const db = obtenerDB();
    const usuarios = db.collection('usuarios');
    const usuarioId = new ObjectId(req.session.usuarioId);

    const usuario = await usuarios.findOne({
      _id: usuarioId
    });

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({
        mensaje: 'La sesión ya no es válida.'
      });
    }

    if (usuario.rol !== 'tutor') {
      return res.status(403).json({
        mensaje: 'Acceso exclusivo para tutores.'
      });
    }

    // 2. Validar los datos recibidos.
    const datos = req.body;

    if (!datos || typeof datos !== 'object' ||
        Array.isArray(datos)) {
      return res.status(400).json({
        mensaje: 'Los datos enviados no son válidos.'
      });
    }

    const camposPermitidos = [
      'materias',
      'nivel',
      'ubicacion',
      'precioHora'
    ];

    const camposRecibidos = Object.keys(datos);

    if (
      camposRecibidos.length === 0 ||
      camposRecibidos.some(
        campo => !camposPermitidos.includes(campo)
      )
    ) {
      return res.status(400).json({
        mensaje: 'Se enviaron campos no permitidos.'
      });
    }

    const cambios = {};

    if ('materias' in datos) {
      if (
        !Array.isArray(datos.materias) ||
        datos.materias.length === 0 ||
        datos.materias.length > 8 ||
        !datos.materias.every(
          m => typeof m === 'string' &&
               m.trim().length >= 2 &&
               m.trim().length <= 60
        )
      ) {
        return res.status(400).json({
          mensaje: 'Debes indicar entre 1 y 8 materias válidas.'
        });
      }

      cambios['perfilTutor.materias'] = [
        ...new Set(datos.materias.map(m => m.trim()))
      ];
    }

    if ('nivel' in datos) {
      const niveles = [
        'Primaria',
        'Secundaria',
        'Preparatoria',
        'Universidad'
      ];

      if (!niveles.includes(datos.nivel)) {
        return res.status(400).json({
          mensaje: 'El nivel educativo no es válido.'
        });
      }

      cambios['perfilTutor.nivel'] = datos.nivel;
    }

    if ('ubicacion' in datos) {
      if (
        typeof datos.ubicacion !== 'string' ||
        datos.ubicacion.trim().length < 2 ||
        datos.ubicacion.trim().length > 80
      ) {
        return res.status(400).json({
          mensaje: 'La ubicación no es válida.'
        });
      }

      cambios['perfilTutor.ubicacion'] =
        datos.ubicacion.trim();
    }

    if ('precioHora' in datos) {
      if (
        typeof datos.precioHora !== 'number' ||
        !Number.isFinite(datos.precioHora) ||
        !Number.isInteger(datos.precioHora) ||
        datos.precioHora < 1000 ||
        datos.precioHora > 1000000
      ) {
        return res.status(400).json({
          mensaje: 'La tarifa debe estar entre $1.000 y $1.000.000 COP.'
        });
      }

      cambios['perfilTutor.precioHora'] =
        datos.precioHora;
    }

    // 3. Actualizar únicamente los campos autorizados.
    const resultado = await usuarios.updateOne(
      {
        _id: usuarioId,
        rol: 'tutor',
        estado: 'activo'
      },
      {
        $set: cambios
      }
    );

    if (resultado.matchedCount === 0) {
      return res.status(409).json({
        mensaje: 'La cuenta ya no está disponible para actualizar.'
      });
    }

    // 4. Recuperar el perfil actualizado.
    const actualizado = await usuarios.findOne(
      { _id: usuarioId },
      { projection: { perfilTutor: 1 } }
    );

    return res.status(200).json({
      mensaje: 'Perfil profesional actualizado correctamente.',
      perfilTutor: actualizado.perfilTutor
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    return res.status(500).json({
      mensaje: 'No fue posible actualizar el perfil.'
    });
  }
});


/* ===== Actualizar disponibilidad del tutor ===== */
router.patch('/mi-disponibilidad', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');

    // Comprobar sesión activa.
    if (
      !req.session?.usuarioId ||
      !ObjectId.isValid(req.session.usuarioId)
    ) {
      return res.status(401).json({
        mensaje: 'Debes iniciar sesión como tutor.'
      });
    }

    const db = obtenerDB();
    const usuarios = db.collection('usuarios');
    const usuarioId = new ObjectId(req.session.usuarioId);

    const usuario = await usuarios.findOne({
      _id: usuarioId
    });

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({
        mensaje: 'La sesión ya no es válida.'
      });
    }

    if (usuario.rol !== 'tutor') {
      return res.status(403).json({
        mensaje: 'Acceso exclusivo para tutores.'
      });
    }

    // Validar el arreglo de horarios.
    const disponibilidad = req.body?.disponibilidad;

    if (
      !Array.isArray(disponibilidad) ||
      disponibilidad.length > 30
    ) {
      return res.status(400).json({
        mensaje: 'Debes enviar una lista válida de horarios (máximo 30).'
      });
    }

    const diasPermitidos = [
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo'
    ];

    const formatoHora = /^([01]\d|2[0-3]):[0-5]\d$/;

    // Validar cada horario.
    for (const horario of disponibilidad) {
      if (
        !horario ||
        typeof horario !== 'object' ||
        Array.isArray(horario) ||
        !diasPermitidos.includes(horario.dia) ||
        typeof horario.inicio !== 'string' ||
        typeof horario.fin !== 'string' ||
        !formatoHora.test(horario.inicio) ||
        !formatoHora.test(horario.fin)
      ) {
        return res.status(400).json({
          mensaje: 'Uno o más horarios tienen datos inválidos.'
        });
      }

      if (horario.inicio >= horario.fin) {
        return res.status(400).json({
          mensaje: 'La hora de inicio debe ser anterior a la hora de finalización.'
        });
      }
    }

    // Comprobar horarios superpuestos.
    for (let i = 0; i < disponibilidad.length; i++) {
      for (let j = i + 1; j < disponibilidad.length; j++) {
        const a = disponibilidad[i];
        const b = disponibilidad[j];

        if (
          a.dia === b.dia &&
          a.inicio < b.fin &&
          b.inicio < a.fin
        ) {
          return res.status(400).json({
            mensaje: `Existen horarios superpuestos el día ${a.dia}.`
          });
        }
      }
    }

    // Guardar disponibilidad en MongoDB.
    const resultado = await usuarios.updateOne(
      {
        _id: usuarioId,
        rol: 'tutor',
        estado: 'activo'
      },
      {
        $set: {
          'perfilTutor.disponibilidad': disponibilidad
        }
      }
    );

    if (resultado.matchedCount === 0) {
      return res.status(409).json({
        mensaje: 'La cuenta ya no está disponible para actualizar.'
      });
    }

    return res.status(200).json({
      mensaje: 'Disponibilidad actualizada correctamente.',
      disponibilidad
    });

  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);

    return res.status(500).json({
      mensaje: 'No fue posible actualizar la disponibilidad.'
    });
  }
});


/* ===== Consultar tutores registrados y aprobados ===== */
router.get('/registrados', async (req, res) => {
  try {
    const db = obtenerDB();

    const tutores = await db.collection('usuarios')
      .find(
        {
          rol: 'tutor',
          estado: 'activo',
          'perfilTutor.estadoPublicacion': 'aprobado'
        },
        {
          projection: {
            nombre: 1,
            'perfilTutor.materias': 1,
            'perfilTutor.nivel': 1,
            'perfilTutor.ubicacion': 1,
            'perfilTutor.precioHora': 1,
            'perfilTutor.disponibilidad': 1
          }
        }
      )
      .toArray();

    const resultado = tutores.map(usuario => ({
      id: usuario._id.toString(),
      nombre: usuario.nombre,
      materias: usuario.perfilTutor?.materias || [],
      nivel: usuario.perfilTutor?.nivel || '',
      ubicacion: usuario.perfilTutor?.ubicacion || '',
      precioHora: usuario.perfilTutor?.precioHora ?? null,
      disponibilidad: usuario.perfilTutor?.disponibilidad || []
    }));

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error al consultar tutores registrados:', error);

    return res.status(500).json({
      mensaje: 'No fue posible consultar los tutores registrados.'
    });
  }
});


module.exports = router;
