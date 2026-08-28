const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};
