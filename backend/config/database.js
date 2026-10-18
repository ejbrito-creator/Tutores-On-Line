
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);

let database;

async function conectarDB() {
  await client.connect();

  database = client.db(process.env.DB_NAME);

  // Comprueba que MongoDB responde
  await database.command({ ping: 1 });

  console.log("Conexión con MongoDB exitosa");
  return database;
}

function obtenerDB() {
  if (!database) {
    throw new Error("La base de datos no está conectada");
  }

  return database;
}

module.exports = { conectarDB, obtenerDB };
