const db = require('../db');

async function listAlerts() {
  const result = await db.query('SELECT * FROM alerts ORDER BY created_at DESC');
  return result.rows;
}

async function createAlert({ message, level }) {
  if (!message || !level) {
    const error = new Error('Message and level are required.');
    error.statusCode = 400;
    throw error;
  }

  const validLevels = ['info', 'warning', 'critical'];
  if (!validLevels.includes(level)) {
    const error = new Error('Level must be info, warning, or critical.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    'INSERT INTO alerts (message, level, acknowledged, created_at) VALUES ($1, $2, false, NOW()) RETURNING *',
    [message.trim(), level]
  );

  return result.rows[0];
}

async function acknowledgeAlert(id) {
  const result = await db.query(
    'UPDATE alerts SET acknowledged = true WHERE id = $1 RETURNING *',
    [id]
  );

  if (!result.rows[0]) {
    const error = new Error('Alert not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  listAlerts,
  createAlert,
  acknowledgeAlert,
};
