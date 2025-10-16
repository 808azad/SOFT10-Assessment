const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

//router for "send" endpoint
router.post('/send', messageController.sendMessage);
module.exports = router;