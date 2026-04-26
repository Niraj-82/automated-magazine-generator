const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { sanitizeRequest } = require('../middleware/sanitize');
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/templates.controller');

router.use(requireAuth);

router.get('/', getTemplates);
router.post('/', requireRole('lab_assistant', 'admin'), sanitizeRequest, createTemplate);
router.patch('/:id', requireRole('lab_assistant', 'admin'), sanitizeRequest, updateTemplate);
router.delete('/:id', requireRole('lab_assistant', 'admin'), deleteTemplate);

module.exports = router;
