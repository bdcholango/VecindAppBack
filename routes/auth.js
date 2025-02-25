const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

let refreshTokens = [];

// Middleware para manejar errores de validación
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Función para generar Access Token y Refresh Token
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  }); // 1 dia
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, {
    expiresIn: "5h",
  }); // 7 días

  refreshTokens.push(refreshToken);
  return { accessToken, refreshToken };
};

// Endpoint de Login (devuelve accessToken y refreshToken)
router.post(
  "/login",
  [
    body("username")
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  validateRequest,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user)
        return res.status(400).json({ message: "Usuario no encontrado" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Contraseña incorrecta" });

      const { accessToken, refreshToken } = generateTokens(user._id);

      res.json({ accessToken, refreshToken });
    } catch (error) {
      res.status(500).json({ error: "Error en el login" });
    }
  }
);

// Endpoint para refrescar el token de acceso
router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ message: "Token inválido o no autorizado" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "50m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
});

// Logout (elimina el refresh token de la lista)
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.json({ message: "Logout exitoso" });
});

// Endpoint de Registro
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("El nombre de usuario debe tener al menos 3 caracteres")
      .isAlphanumeric()
      .withMessage("El nombre de usuario solo puede contener letras y números"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres")
      .matches(/\d/)
      .withMessage("La contraseña debe contener al menos un número"),
  ],
  validateRequest,
  async (req, res) => {
    const { username, password } = req.body;

    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "El nombre de usuario ya está en uso" });
      }

      // Hashear la contraseña antes de guardarla
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear un nuevo usuario en la BD
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();

      // Generar tokens para la sesión después del registro
      const { accessToken, refreshToken } = generateTokens(newUser._id);

      res.status(201).json({
        message: "Usuario creado exitosamente",
        accessToken,
        refreshToken,
      });
    } catch (error) {
      res.status(500).json({ error: "Error al registrar el usuario" });
    }
  }
);

module.exports = router;
