const crypto = require('crypto');
const { Submission } = require('../models/mongo');
const { User, AuditLog } = require('../models/sql');
const { deleteFile } = require('../middleware/upload');
const logger = require('../config/logger');
const {
  notifyFacultyNewSubmission,
  notifyStudentStatusChange,
} = require('../services/notification.service');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAttachments = (files = []) =>
  files.map((file) => ({
    id: crypto.randomUUID(),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: `uploads/${file.filename}`,
    uploadedAt: new Date(),
  }));

const allowedTransitions = {
  draft: ['ai_triage', 'needs_review'],
  ai_triage: ['needs_review', 'blocked'],
  needs_review: ['approved', 'rejected', 'blocked'],
  approved: [],
  rejected: ['needs_review'],
  blocked: [],
};

const canManageSubmission = (user, submission) => {
  if (!user || !submission) return false;
  if (user.role === 'student') return submission.authorId === user.id;
  return ['faculty', 'lab_assistant', 'admin'].includes(user.role);
};

const createSubmission = async (req, res) => {
  const uploadedFiles = req.files || [];
  try {
    const { title, content, category } = req.body;
    const submission = await Submission.create({
      title,
      content,
      category,
      status: 'ai_triage',
      authorId: req.user.id,
      authorName: req.user.name,
      authorRoll: req.user.rollNumber || '',
      department: req.user.department || '',
      attachments: buildAttachments(uploadedFiles),
    });

    await AuditLog.logAction(
      'SUBMISSION_CREATE',
      req.user.id,
      { submissionId: submission._id.toString() },
      req.ip
    );

    const facultyUsers = await User.findAll({
      where: { role: 'faculty', isActive: true },
      attributes: ['id'],
    });
    await notifyFacultyNewSubmission(facultyUsers, submission);

    try {
      const aiService = require('../services/ai.pipeline.service');
      aiService
        .processSubmission(submission._id.toString())
        .catch((err) => logger.error('AI pipeline:', err.message));
    } catch (_error) {
      // AI service may not exist yet; fail silently by requirement.
    }

    return res.status(201).json({ success: true, data: submission });
  } catch (error) {
    await Promise.all(uploadedFiles.map((file) => deleteFile(`uploads/${file.filename}`)));
    logger.error(`Create submission failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to create submission.' });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.authorId = req.user.id;
    }
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      const escaped = escapeRegex(String(search));
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { authorName: { $regex: escaped, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Submission.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        data,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    logger.error(`Get submissions failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch submissions.' });
  }
};

const getById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    if (!canManageSubmission(req.user, submission)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    logger.error(`Get submission by id failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch submission.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, facultyComment = '' } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    const transitions = allowedTransitions[submission.status] || [];
    if (!transitions.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status transition.' });
    }

    submission.status = status;
    submission.facultyComment = facultyComment;
    await submission.save();

    await AuditLog.logAction(
      'SUBMISSION_STATUS_CHANGE',
      req.user.id,
      { submissionId: submission._id.toString(), status, facultyComment },
      req.ip
    );

    await notifyStudentStatusChange(submission, status, facultyComment);

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    logger.error(`Update submission status failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to update submission status.' });
  }
};

const updateSubmission = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    if (!canManageSubmission(req.user, submission)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    submission.versionHistory.push({
      version: submission.version,
      content: submission.content,
      updatedBy: req.user.id,
      updatedAt: new Date(),
    });

    if (title) submission.title = title;
    if (content) submission.content = content;
    if (category) submission.category = category;
    submission.version += 1;
    submission.status = 'ai_triage';

    await submission.save();

    await AuditLog.logAction(
      'SUBMISSION_UPDATE',
      req.user.id,
      { submissionId: submission._id.toString(), version: submission.version },
      req.ip
    );

    try {
      const aiService = require('../services/ai.pipeline.service');
      aiService
        .processSubmission(submission._id.toString())
        .catch((err) => logger.error('AI pipeline:', err.message));
    } catch (_error) {
      // AI service may not exist yet; fail silently by requirement.
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    logger.error(`Update submission failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to update submission.' });
  }
};

const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    if (req.user.role === 'student' && submission.authorId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    await Promise.all((submission.attachments || []).map((file) => deleteFile(file.path)));
    await submission.deleteOne();

    await AuditLog.logAction(
      'SUBMISSION_DELETE',
      req.user.id,
      { submissionId: req.params.id },
      req.ip
    );

    return res.status(200).json({ success: true, message: 'Submission deleted successfully.' });
  } catch (error) {
    logger.error(`Delete submission failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to delete submission.' });
  }
};

const setLabTemplate = async (req, res) => {
  try {
    const { templateId } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    submission.labOverrideTemplate = templateId;
    await submission.save();

    await AuditLog.logAction(
      'SUBMISSION_TEMPLATE_OVERRIDE',
      req.user.id,
      { submissionId: submission._id.toString(), templateId },
      req.ip
    );

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    logger.error(`Set lab template failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to set template override.' });
  }
};

const getSubmissionStats = async (req, res) => {
  try {
    const match = req.user.role === 'student' ? { authorId: req.user.id } : {};
    const [stats] = await Submission.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
          },
          needsReview: {
            $sum: { $cond: [{ $eq: ['$status', 'needs_review'] }, 1, 0] },
          },
          blocked: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] },
          },
          avgGrammarScore: { $avg: '$aiAnalysis.grammarScore' },
          avgToneScore: { $avg: '$aiAnalysis.toneScore' },
          totalSafetyFlags: {
            $sum: { $cond: [{ $in: ['$aiAnalysis.riskLevel', ['flagged', 'blocked']] }, 1, 0] },
          },
          pipelineSuccess: {
            $sum: { $cond: [{ $ne: ['$aiAnalysis', null] }, 1, 0] },
          },
        },
      },
    ]);

    const finalStats = stats || {
      total: 0,
      approved: 0,
      rejected: 0,
      needsReview: 0,
      blocked: 0,
      avgGrammarScore: 0,
      avgToneScore: 0,
      totalSafetyFlags: 0,
      pipelineSuccess: 0,
    };

    finalStats.pipelineSuccessRate = finalStats.total > 0 ? Math.round((finalStats.pipelineSuccess / finalStats.total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: finalStats,
    });
  } catch (error) {
    logger.error(`Submission stats failed: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Failed to fetch submission stats.' });
  }
};

module.exports = {
  createSubmission,
  getSubmissions,
  getById,
  updateStatus,
  updateSubmission,
  deleteSubmission,
  getSubmissionStats,
  setLabTemplate,
};
