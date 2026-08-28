const dashboardService = require('../services/dashboardService');

async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
};
