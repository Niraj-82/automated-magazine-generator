const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './data/magazine.sqlite',
  logging: false,
});

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query("UPDATE Users SET name = 'Dr. Smita Dange' WHERE email = 'faculty@fcrit.ac.in'");
    console.log('Update successful');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}
run();
