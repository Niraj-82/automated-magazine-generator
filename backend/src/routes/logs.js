const express = require('express');
const router = express.Router();

// Stub for logs routes
router.get('/', (req, res) => res.json({ message: 'logs route' }));

module.exports = router;
