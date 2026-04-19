const express = require('express');
const router = express.Router();

// Stub for templates routes
router.get('/', (req, res) => res.json({ message: 'templates route' }));

module.exports = router;
