const ncrService = require('../services/ncrService');

async function listNCRs(req, res, next) {
  try {
    const ncrs = await ncrService.listNCRs();
    res.json(ncrs);
  } catch (error) {
    next(error);
  }
}

async function getNCR(req, res, next) {
  try {
    const ncr = await ncrService.getNCRById(req.params.id);
    res.json(ncr);
  } catch (error) {
    next(error);
  }
}

async function createNCR(req, res, next) {
  try {
    const ncr = await ncrService.createNCR(req.body);
    res.status(201).json(ncr);
  } catch (error) {
    next(error);
  }
}

async function updateNCR(req, res, next) {
  try {
    const ncr = await ncrService.updateNCR(req.params.id, req.body);
    res.json(ncr);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNCRs,
  getNCR,
  createNCR,
  updateNCR,
};
