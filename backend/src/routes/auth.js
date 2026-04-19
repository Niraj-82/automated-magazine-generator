const express = require('express');
const router = express.Router();

// Stub for auth routes
router.get('/', (req, res) => res.json({ message: 'auth route' }));

module.exports = router;
