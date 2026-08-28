const inspectionService = require('../services/inspectionService');

async function listInspections(req, res, next) {
  try {
    const inspections = await inspectionService.listInspections();
    res.json(inspections);
  } catch (error) {
    next(error);
  }
}

async function getInspection(req, res, next) {
  try {
    const inspection = await inspectionService.getInspectionById(req.params.id);
    res.json(inspection);
  } catch (error) {
    next(error);
  }
}

async function createInspection(req, res, next) {
  try {
    const inspection = await inspectionService.createInspection(req.body, req.user.id);
    res.status(201).json(inspection);
  } catch (error) {
    next(error);
  }
}

async function updateInspection(req, res, next) {
  try {
    const inspection = await inspectionService.updateInspection(req.params.id, req.body);
    res.json(inspection);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listInspections,
  getInspection,
  createInspection,
  updateInspection,
};
