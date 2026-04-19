const express = require('express');
const router = express.Router();

// Stub for users routes
router.get('/', (req, res) => res.json({ message: 'users route' }));

module.exports = router;
