const path = require('path');

const stripHtml = (value) => value.replace(/<[^>]*>/g, '').trim();

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return stripHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const sanitizedObject = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
        continue;
      }
      sanitizedObject[key] = sanitizeValue(nestedValue);
    }
    return sanitizedObject;
  }

  return value;
};

const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return 'file';
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
};

const sanitizeRequest = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (Array.isArray(req.files)) {
    req.files = req.files.map((file) => ({
      ...file,
      originalname: sanitizeFileName(file.originalname),
    }));
  }

  if (req.file) {
    req.file.originalname = sanitizeFileName(req.file.originalname);
  }

  next();
};

module.exports = {
  sanitizeRequest,
  sanitizeFileName,
  stripHtml,
};
