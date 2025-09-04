const router = require('express').Router();
const sendMessage = require('../controllers/sendMessage')
const upload = require('../middleware/Upload');

router.post("/send-message", upload.array("files"), sendMessage);

module.exports = router