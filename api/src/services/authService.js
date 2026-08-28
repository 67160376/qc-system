const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

async function createUser({ username, password, role = 'QC' }) {
  if (!username || !password) {
    const error = new Error('Username and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    const error = new Error('Username cannot be empty.');
    error.statusCode = 400;
    throw error;
  }

  const duplicate = await db.query('SELECT id FROM users WHERE username = $1', [normalizedUsername]);
  if (duplicate.rows.length > 0) {
    const error = new Error('Username already exists.');
    error.statusCode = 409;
    throw error;
  }

  const validRoles = ['ADMIN', 'QC', 'PRODUCTION'];
  if (!validRoles.includes(role)) {
    const error = new Error('Role must be ADMIN, QC, or PRODUCTION.');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await db.query(
    'INSERT INTO users (username, password, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, role, created_at',
    [normalizedUsername, hashedPassword, role]
  );

  return result.rows[0];
}

async function loginUser({ username, password }) {
  if (!username || !password) {
    const error = new Error('Username and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
  const user = result.rows[0];

  if (!user) {
    const error = new Error('Invalid username or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid username or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.created_at,
    },
  };
}

async function getCurrentUser(userId) {
  const result = await db.query(
    'SELECT id, username, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (!result.rows[0]) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
};
