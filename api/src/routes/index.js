const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const inspectionController = require('../controllers/inspectionController');
const ncrController = require('../controllers/ncrController');
const alertController = require('../controllers/alertController');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorizeRoles } = authMiddleware;

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/logout', authMiddleware, authController.logout);

router.get('/products', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), productController.listProducts);
router.get('/products/:id', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), productController.getProduct);
router.post('/products', authMiddleware, authorizeRoles('ADMIN', 'QC'), productController.createProduct);
router.put('/products/:id', authMiddleware, authorizeRoles('ADMIN', 'QC'), productController.updateProduct);
router.delete('/products/:id', authMiddleware, authorizeRoles('ADMIN'), productController.deleteProduct);

router.get('/inspections', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), inspectionController.listInspections);
router.get('/inspections/:id', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), inspectionController.getInspection);
router.post('/inspections', authMiddleware, authorizeRoles('ADMIN', 'QC'), inspectionController.createInspection);
router.put('/inspections/:id', authMiddleware, authorizeRoles('ADMIN', 'QC'), inspectionController.updateInspection);

router.get('/ncrs', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), ncrController.listNCRs);
router.get('/ncrs/:id', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), ncrController.getNCR);
router.post('/ncrs', authMiddleware, authorizeRoles('ADMIN', 'QC'), ncrController.createNCR);
router.put('/ncrs/:id', authMiddleware, authorizeRoles('ADMIN', 'QC'), ncrController.updateNCR);

router.get('/alerts', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), alertController.listAlerts);
router.post('/alerts', authMiddleware, authorizeRoles('ADMIN', 'QC'), alertController.createAlert);
router.put('/alerts/:id/acknowledge', authMiddleware, authorizeRoles('ADMIN', 'QC'), alertController.acknowledgeAlert);

router.get('/dashboard/summary', authMiddleware, authorizeRoles('ADMIN', 'QC', 'PRODUCTION'), dashboardController.getSummary);

module.exports = router;
