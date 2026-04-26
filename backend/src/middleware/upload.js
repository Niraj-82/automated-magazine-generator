const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const logger = require('../config/logger');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.doc', '.docx']);

const sanitizeOriginalName = (name) => {
  if (!name || typeof name !== 'string') return 'file';
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.slice(0, 120) || 'file';
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${crypto.randomUUID()}-${Date.now()}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimeValid = allowedMimeTypes.has(file.mimetype);
  const extensionValid = allowedExtensions.has(extension);

  file.originalname = sanitizeOriginalName(file.originalname);

  if (!mimeValid || !extensionValid) {
    return cb(new Error('Invalid file type. Allowed: PDF, DOC/DOCX, TXT, JPG, PNG.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

const deleteFile = async (relativeOrAbsolutePath) => {
  try {
    const filePath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(__dirname, '..', '..', relativeOrAbsolutePath);

    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error(`Failed to delete file ${relativeOrAbsolutePath}: ${error.message}`);
    }
  }
};

module.exports = {
  upload,
  deleteFile,
  sanitizeOriginalName,
};
