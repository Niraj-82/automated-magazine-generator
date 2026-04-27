// src/routes/generate.js
// ─────────────────────────────────────────────────────────
// Magazine generation routes — all lab_assistant only.
//  POST /           → trigger generation
//  GET  /download/:filename → download a PDF
//  GET  /history    → list all generated PDFs
// ─────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  generate,
  downloadPDF,
  getHistory,
} = require('../controllers/generate.controller');

// All generate routes require authentication + lab_assistant role
router.use(requireAuth);
router.use(requireRole('lab_assistant', 'admin'));

// POST /api/generate — trigger PDF generation
router.post('/', generate);

// GET /api/generate/history — list all generated PDFs
// (must be before /download/:filename to avoid "history" matching as filename)
router.get('/history', getHistory);

// GET /api/generate/download/:filename — download a specific PDF
router.get('/download/:filename', downloadPDF);

module.exports = router;
