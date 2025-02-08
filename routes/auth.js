const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Almacenar Refresh Tokens temporalmente (opcional: guardarlos en la BD en el modelo User)
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
    const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '10m' }); // 10 minutos
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' }); // 7 días

    refreshTokens.push(refreshToken); // Guardar temporalmente (mejor guardarlo en la BD)
    return { accessToken, refreshToken };
};

// Endpoint de Login (devuelve accessToken y refreshToken)
router.post('/login', 
    [
        body('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
        body('password').notEmpty().withMessage('La contraseña es obligatoria')
    ], 
    validateRequest, 
    async (req, res) => {
        const { username, password } = req.body;

        try {
            const user = await User.findOne({ username });
            if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

            const { accessToken, refreshToken } = generateTokens(user._id);

            res.json({ accessToken, refreshToken });
        } catch (error) {
            res.status(500).json({ error: 'Error en el login' });
        }
    }
);

// Endpoint para refrescar el token de acceso
router.post('/refresh-token', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken || !refreshTokens.includes(refreshToken)) {
        return res.status(403).json({ message: 'Token inválido o no autorizado' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '10m' });

        res.json({ accessToken: newAccessToken });
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
});

// Logout (elimina el refresh token de la lista)
router.post('/logout', (req, res) => {
    const { refreshToken } = req.body;
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);
    res.json({ message: 'Logout exitoso' });
});

module.exports = router;
