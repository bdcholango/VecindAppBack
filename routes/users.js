const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Guardar o actualizar el token de notificación del usuario
router.post("/push-token", async (req, res) => {
  const { pushToken } = req.body;
  const userId = req.user.id; // Extrae el ID del usuario autenticado
  console.log(`📲 Guardando pushToken para el usuario ${userId}: ${pushToken}`);
  try {
    await User.findByIdAndUpdate(userId, { pushToken });
    res.json({ message: "Token de notificación guardado correctamente" });
  } catch (error) {
    console.error("Error guardando el token:", error);
    res.status(500).json({ error: "Error al guardar el token" });
  }
});

module.exports = router;
