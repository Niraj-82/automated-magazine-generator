const logger = require('../../config/logger');
const Submission = require('./Submission.model');
const Template = require('./Template.model');

const defaultTemplates = [
  {
    name: 'Classic Two Column',
    description: 'Balanced editorial layout for long-form articles.',
    thumbnail: '/assets/templates/two-column.png',
    layout: 'two_column',
    sections: [
      { id: 'heading-1', type: 'heading', title: 'Cover Story', order: 0 },
      { id: 'text-1', type: 'text', title: 'Main Article', order: 1 },
    ],
  },
  {
    name: 'Campus Gallery',
    description: 'Visual-first style for events and achievements.',
    thumbnail: '/assets/templates/gallery.png',
    layout: 'gallery',
    sections: [
      { id: 'heading-1', type: 'heading', title: 'Event Highlights', order: 0 },
      { id: 'gallery-1', type: 'gallery', title: 'Photos', order: 1 },
    ],
  },
];

const seedTemplates = async () => {
  try {
    const templateCount = await Template.countDocuments();
    if (templateCount > 0) {
      return;
    }

    await Template.insertMany(defaultTemplates);
    logger.info('Default templates seeded.');
  } catch (error) {
    logger.error(`Template seed failed: ${error.message}`);
  }
};

module.exports = {
  Submission,
  Template,
  seedTemplates,
};
