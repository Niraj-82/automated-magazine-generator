const { Template, seedTemplates } = require('../models/mongo');
const { AuditLog } = require('../models/sql');
const logger = require('../config/logger');

const getTemplates = async (_req, res) => {
  try {
    await seedTemplates();
    const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    logger.error(`Get templates failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch templates.' });
  }
};

const createTemplate = async (req, res) => {
  try {
    const template = await Template.create(req.body);
    await AuditLog.logAction(
      'TEMPLATE_CREATE',
      req.user.id,
      { templateId: template._id.toString(), name: template.name },
      req.ip
    );
    return res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error(`Create template failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to create template.' });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }

    await AuditLog.logAction(
      'TEMPLATE_UPDATE',
      req.user.id,
      { templateId: template._id.toString() },
      req.ip
    );
    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    logger.error(`Update template failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to update template.' });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found.' });
    }

    template.isActive = false;
    await template.save();

    await AuditLog.logAction(
      'TEMPLATE_DELETE',
      req.user.id,
      { templateId: template._id.toString() },
      req.ip
    );
    return res.status(200).json({ success: true, message: 'Template deactivated successfully.' });
  } catch (error) {
    logger.error(`Delete template failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to delete template.' });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
