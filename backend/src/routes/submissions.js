const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { sanitizeRequest } = require('../middleware/sanitize');
const { upload } = require('../middleware/upload');
const {
  createSubmission,
  getSubmissions,
  getById,
  updateStatus,
  updateSubmission,
  deleteSubmission,
  getSubmissionStats,
} = require('../controllers/submissions.controller');

router.use(requireAuth);

// Keep /stats before /:id so "stats" never gets parsed as id.
router.get('/stats', getSubmissionStats);
router.post('/', requireRole('student'), upload.array('attachments', 5), sanitizeRequest, createSubmission);
router.get('/', getSubmissions);
router.get('/:id', getById);
router.patch('/:id/status', requireRole('faculty', 'lab_assistant', 'admin'), sanitizeRequest, updateStatus);
router.patch('/:id/template', requireRole('lab_assistant', 'admin'), sanitizeRequest, require('../controllers/submissions.controller').setLabTemplate);
router.patch('/:id', sanitizeRequest, updateSubmission);
router.delete('/:id', deleteSubmission);

module.exports = router;
