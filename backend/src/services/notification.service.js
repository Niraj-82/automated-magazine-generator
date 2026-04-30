const { Notification } = require('../models/sql');
const logger = require('../config/logger');

const createNotification = async ({
  userId,
  type = 'info',
  title,
  message,
  link = null,
}) => {
  try {
    if (!userId || !title || !message) {
      return null;
    }

    return await Notification.create({
      userId,
      type,
      title,
      message,
      link,
    });
  } catch (error) {
    logger.error(`Notification creation failed: ${error.message}`);
    return null;
  }
};

const notifyFacultyNewSubmission = async (facultyUsers, submission) => {
  if (!Array.isArray(facultyUsers) || !submission) {
    return;
  }

  await Promise.all(
    facultyUsers.map((faculty) =>
      createNotification({
        userId: faculty.id,
        type: 'action_required',
        title: 'New submission awaiting review',
        message: `${submission.authorName} submitted "${submission.title}"`,
        link: `/faculty/review?submission=${submission._id}`,
      })
    )
  );
};

const notifyStudentStatusChange = async (submission, status, comment = '') => {
  if (!submission || !submission.authorId) {
    return;
  }

  const message = comment
    ? `Your submission "${submission.title}" is now ${status}. Comment: ${comment}`
    : `Your submission "${submission.title}" is now ${status}.`;

  await createNotification({
    userId: submission.authorId,
    type: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'system',
    title: 'Submission status updated',
    message,
    link: `/student/submissions/${submission._id}`,
  });
};

module.exports = {
  createNotification,
  notifyFacultyNewSubmission,
  notifyStudentStatusChange,
};
