const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User'); // Asegúrate de que el modelo User tiene pushToken

// Endpoint para enviar notificaciones a todos los usuarios
router.post('/send', async (req, res) => {
    const { title, description } = req.body;

    console.log('➡️ Solicitud de notificación recibida en el backend:', { title, description });
    
    try {
        // Obtener todos los usuarios que tengan un pushToken registrado
        const users = await User.find({ pushToken: { $exists: true, $ne: null } });
        console.log(`Usuarios encontrados con pushTokens: ${users.length}`);
        if (users.length === 0) {
            return res.status(400).json({ message: 'No hay usuarios registrados para recibir notificaciones' });
        }

        // Construir el array de mensajes para Expo
        const messages = users.map(user => ({
            to: user.pushToken,
            sound: 'default',
            title: `📢 Nueva Publicación: ${title}`,
            body: description,
        }));
        console.log('📨 Mensajes a enviar:', messages);
    
        // Enviar las notificaciones a Expo
        await axios.post('https://exp.host/--/api/v2/push/send', messages, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log('✅ Respuesta de Expo:', expoResponse.data);
        

        res.json({ message: 'Notificaciones enviadas a todos los usuarios' });
    } catch (error) {
        console.error('Error enviando notificaciones:', error);
        res.status(500).json({ error: 'Error enviando notificaciones' });
    }
});

module.exports = router;
