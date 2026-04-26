const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getLogs } = require('../controllers/logs.controller');

const router = express.Router();

// Read only routes, restricted to admins and lab assistants
router.use(requireAuth);
router.use(requireRole('admin', 'lab_assistant'));

router.get('/', getLogs);

// No POST, PATCH, DELETE allowed on logs
router.post('/', (req, res) => res.status(405).json({ success: false, error: 'Method Not Allowed' }));
router.patch('/:id', (req, res) => res.status(405).json({ success: false, error: 'Method Not Allowed' }));
router.delete('/:id', (req, res) => res.status(405).json({ success: false, error: 'Method Not Allowed' }));

module.exports = router;
