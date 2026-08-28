const alertService = require('../services/alertService');

async function listAlerts(req, res, next) {
  try {
    const alerts = await alertService.listAlerts();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
}

async function createAlert(req, res, next) {
  try {
    const alert = await alertService.createAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
}

async function acknowledgeAlert(req, res, next) {
  try {
    const alert = await alertService.acknowledgeAlert(req.params.id);
    res.json(alert);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAlerts,
  createAlert,
  acknowledgeAlert,
};
