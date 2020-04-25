const express = require('express');
const router = express.Router();
const onboard = require('../services/onboard')

router.post('/test/connection', onboard.testConnection)

module.exports = router;
