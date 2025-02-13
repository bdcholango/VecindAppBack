const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const Publication = require('../models/Publication');

const router = express.Router();

// Configuración de almacenamiento de imágenes en servidor
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Crear una nueva publicación (evento o servicio)
router.post('/create', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { type, title, description, location, date } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        if (!type || !title || !description || !location) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        const newPublication = new Publication({
            user: req.user.id,
            type,
            title,
            description,
            location,
            date: type === 'evento' ? date : null,
            image: imageUrl,
        });

        await newPublication.save();
        res.status(201).json({ message: 'Publicación creada exitosamente', publication: newPublication });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la publicación' });
    }
});

// Obtener todas las publicaciones con datos del usuario
router.get('/', async (req, res) => {
    try {
        const publications = await Publication.find()
            .populate('user', 'username') // ✅ Asegura que traiga el nombre del usuario
            .sort({ createdAt: -1 }); // Ordena de más reciente a más antigua
        res.json(publications);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo publicaciones' });
    }
});

// Obtener publicaciones filtradas por tipo
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        if (!['evento', 'servicio'].includes(type)) {
            return res.status(400).json({ message: 'Tipo de publicación inválido' });
        }

        const publications = await Publication.find({ type }).populate('user', 'username');
        res.json(publications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener publicaciones' });
    }
});

module.exports = router;
