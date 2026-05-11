const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

let devices = [];


// Registrar dispositivo
app.post("/register-device", (req, res) => {
  const { token, platform } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: "Token é obrigatório"
    });
  }

  const alreadyExists = devices.find(
    (device) => device.token === token
  );

  if (!alreadyExists) {
    devices.push({
      token,
      platform
    });
  }

  console.log("Devices registrados:");
  console.log(devices);

  res.json({
    success: true,
    devices
  });
});


// Enviar push para todos os dispositivos
app.post("/send", async (req, res) => {
  const {
    title,
    body,
    imageUrl,
    color,
    data
  } = req.body;

  try {
    const tokens = devices.map(
      (device) => device.token
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhum device registrado"
      });
    }

    const response = await admin
      .messaging()
      .sendEachForMulticast({
        tokens,

        notification: {
          title: title || "Nova notificação",
          body: body || "Mensagem enviada",
          imageUrl: imageUrl || undefined,
        },

        data: data || {},

        android: {
          notification: {
            color: color || "#2196F3",
          }
        },

        webpush: {
          notification: {
            icon: imageUrl || undefined,
            image: imageUrl || undefined,
          }
        },

        apns: {
          payload: {
            aps: {
              sound: "default"
            }
          }
        }
      });

    res.json({
      success: true,
      totalDevices: tokens.length,
      response
    });

  } catch (e) {
    console.error(e);

    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});


app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});