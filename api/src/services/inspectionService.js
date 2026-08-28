const db = require('../db');

function calculateStatus(failedQuantity) {
  return failedQuantity === 0 ? 'COMPLETED' : 'FAILED';
}

async function listInspections() {
  const result = await db.query(`
    SELECT i.*, p.product_name, u.username AS inspector_name
    FROM inspections i
    JOIN products p ON p.id = i.product_id
    JOIN users u ON u.id = i.inspector_id
    ORDER BY i.created_at DESC
  `);
  return result.rows;
}

async function getInspectionById(id) {
  const result = await db.query(
    `SELECT i.*, p.product_name, u.username AS inspector_name
     FROM inspections i
     JOIN products p ON p.id = i.product_id
     JOIN users u ON u.id = i.inspector_id
     WHERE i.id = $1`,
    [id]
  );

  if (!result.rows[0]) {
    const error = new Error('Inspection not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function createInspection({ product_id, inspection_type, lot_number, quantity, passed_quantity, failed_quantity }, inspectorId) {
  if (!product_id || !inspection_type || !lot_number || !quantity) {
    const error = new Error('Product, inspection type, lot number, and quantity are required.');
    error.statusCode = 400;
    throw error;
  }

  const product = await db.query('SELECT id FROM products WHERE id = $1', [product_id]);
  if (!product.rows[0]) {
    const error = new Error('Product not found.');
    error.statusCode = 400;
    throw error;
  }

  const qty = Number(quantity);
  const passed = Number(passed_quantity || 0);
  const failed = Number(failed_quantity || 0);

  if (qty <= 0 || passed < 0 || failed < 0) {
    const error = new Error('Quantity must be greater than 0 and passed/failed quantities cannot be negative.');
    error.statusCode = 400;
    throw error;
  }

  if (passed + failed > qty) {
    const error = new Error('Passed quantity plus failed quantity cannot exceed total quantity.');
    error.statusCode = 400;
    throw error;
  }

  const status = calculateStatus(failed);

  const result = await db.query(
    `INSERT INTO inspections (product_id, inspection_type, lot_number, quantity, passed_quantity, failed_quantity, status, inspector_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
    [product_id, inspection_type, lot_number.trim(), qty, passed, failed, status, inspectorId]
  );

  return result.rows[0];
}

async function updateInspection(id, payload) {
  const existing = await getInspectionById(id);
  const productId = payload.product_id ?? existing.product_id;
  const inspectionType = payload.inspection_type ?? existing.inspection_type;
  const lotNumber = payload.lot_number ?? existing.lot_number;
  const quantity = Number(payload.quantity ?? existing.quantity);
  const passedQuantity = Number(payload.passed_quantity ?? existing.passed_quantity);
  const failedQuantity = Number(payload.failed_quantity ?? existing.failed_quantity);

  if (!productId || !inspectionType || !lotNumber || quantity <= 0) {
    const error = new Error('Product, inspection type, lot number, and valid quantity are required.');
    error.statusCode = 400;
    throw error;
  }

  if (passedQuantity + failedQuantity > quantity) {
    const error = new Error('Passed quantity plus failed quantity cannot exceed total quantity.');
    error.statusCode = 400;
    throw error;
  }

  const nextStatus = calculateStatus(failedQuantity);

  const result = await db.query(
    `UPDATE inspections SET product_id = $1, inspection_type = $2, lot_number = $3, quantity = $4, passed_quantity = $5, failed_quantity = $6, status = $7 WHERE id = $8 RETURNING *`,
    [productId, inspectionType, lotNumber.trim(), quantity, passedQuantity, failedQuantity, nextStatus, id]
  );

  return result.rows[0];
}

module.exports = {
  listInspections,
  getInspectionById,
  createInspection,
  updateInspection,
};
