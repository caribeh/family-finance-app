const app = require('./app');
const { pool } = require('./config/database');
const { initScheduler } = require('./services/billReminderScheduler');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection verified');

    initScheduler();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
