const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator'); // Importar express-validator
const User = require('../models/User');

const router = express.Router();

// Middleware para manejar errores de validación
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Registro con validaciones
router.post(
    '/register',
    [
        body('username')
            .isLength({ min: 3 })
            .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
            .isAlphanumeric()
            .withMessage('El nombre de usuario solo puede contener letras y números'),

        body('password')
            .isLength({ min: 6 })
            .withMessage('La contraseña debe tener al menos 6 caracteres')
            .matches(/\d/)
            .withMessage('La contraseña debe contener al menos un número')
    ],
    validateRequest,
    async (req, res) => {
        const { username, password } = req.body;

        try {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword });
            await newUser.save();
            res.status(201).json({ message: 'Usuario creado exitosamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al registrar el usuario' });
        }
    }
);

// Login con validaciones
router.post(
    '/login',
    [
        body('username')
            .notEmpty()
            .withMessage('El nombre de usuario es obligatorio'),
        
        body('password')
            .notEmpty()
            .withMessage('La contraseña es obligatoria')
    ],
    validateRequest,
    async (req, res) => {
        const { username, password } = req.body;

        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({ message: 'Usuario no encontrado' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Contraseña incorrecta' });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ error: 'Error en el login' });
        }
    }
);

module.exports = router;
