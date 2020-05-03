const express = require('express');
const router = express.Router();
const webhook = require('../services/webhook')

router.post('/onalert', webhook.onAlert);

module.exports = router;
