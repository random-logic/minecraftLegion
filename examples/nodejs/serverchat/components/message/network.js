const express = require('express');
const response = require('../../network/response')
const controller = require('./controller')
const router = express.Router();


router.get('/', function (req, res) {
    controller.getMessages()
        .then((messageList) => {
            response.success(req, res, messageList)
        })
        .catch(e => {
            response.error(req, res, 'Error interno', 500, '[message network] Error desconocido')
        });
})

router.post('/', function (req, res) {
    controller.addMessage(req.body.user, req.body.message)
        .then((fullMessage) => {
            response.success(req, res, fullMessage)
        })
        .catch(e => {
            response.error(req, res, 'Informacion Invalida', 500, '[message network] No se ha insertado usuario o contraseña')
        });
})

module.exports = router;