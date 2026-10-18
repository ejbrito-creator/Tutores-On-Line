
require("dotenv").config();

const path = require("path");
const authRoutes = require("./routes/auth.routes");
const tutoresRoutes = require("./routes/tutores.routes");
const express = require("express");

const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const app = express();
const PORT = process.env.PORT || 3000;
const esProduccion = process.env.NODE_ENV === "production";

if (esProduccion) {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));
const { conectarDB, obtenerDB } = require("./config/database");


app.use(session({
  name: "tutoresonline.sid",

  secret: process.env.SESSION_SECRET,

  resave: false,
  saveUninitialized: false,

  store: new MongoStore({
  mongoUrl: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME,
  collectionName: "sesiones",
  ttl: 60 * 60 * 24
}),

  cookie: {
    httpOnly: true,
    secure: esProduccion, 
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use("/api/tutores", tutoresRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    mensaje: "Backend de TutoresOn-Line funcionando",
    estado: "OK",
    baseDatos: "MongoDB conectado"
  });
});

async function iniciarServidor() {
  try {
    await conectarDB();

    app.listen(PORT, () => {
      console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Error al iniciar el servidor:",
      error.message
    );
    process.exit(1);
  }
}

iniciarServidor();

