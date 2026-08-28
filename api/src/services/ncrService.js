const db = require('../db');

async function listNCRs() {
  const result = await db.query(`
    SELECT n.*, i.lot_number, p.product_name
    FROM ncrs n
    JOIN inspections i ON i.id = n.related_inspection_id
    JOIN products p ON p.id = i.product_id
    ORDER BY n.created_at DESC
  `);
  return result.rows;
}

async function getNCRById(id) {
  const result = await db.query(`
    SELECT n.*, i.lot_number, p.product_name
    FROM ncrs n
    JOIN inspections i ON i.id = n.related_inspection_id
    JOIN products p ON p.id = i.product_id
    WHERE n.id = $1
  `, [id]);

  if (!result.rows[0]) {
    const error = new Error('NCR not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function createNCR({ title, description, related_inspection_id }) {
  if (!title || !description || !related_inspection_id) {
    const error = new Error('Title, description, and related inspection are required.');
    error.statusCode = 400;
    throw error;
  }

  const inspection = await db.query(
    'SELECT id, failed_quantity, lot_number FROM inspections WHERE id = $1',
    [related_inspection_id]
  );

  if (!inspection.rows[0]) {
    const error = new Error('Related inspection not found.');
    error.statusCode = 400;
    throw error;
  }

  if (Number(inspection.rows[0].failed_quantity) <= 0) {
    const error = new Error('NCR can only be created from failed inspections.');
    error.statusCode = 400;
    throw error;
  }

  const duplicate = await db.query('SELECT id FROM ncrs WHERE related_inspection_id = $1', [related_inspection_id]);
  if (duplicate.rows[0]) {
    const error = new Error('An NCR already exists for this inspection.');
    error.statusCode = 409;
    throw error;
  }

  const result = await db.query(
    'INSERT INTO ncrs (title, description, status, related_inspection_id, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
    [title.trim(), description.trim(), 'OPEN', related_inspection_id]
  );

  return result.rows[0];
}

async function updateNCR(id, payload) {
  const existing = await getNCRById(id);

  const title = payload.title ?? existing.title;
  const description = payload.description ?? existing.description;
  const status = payload.status ?? existing.status;
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'CLOSED'];

  if (!validStatuses.includes(status)) {
    const error = new Error('Status must be OPEN, IN_PROGRESS, or CLOSED.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    'UPDATE ncrs SET title = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [title.trim(), description.trim(), status, id]
  );

  return result.rows[0];
}

module.exports = {
  listNCRs,
  getNCRById,
  createNCR,
  updateNCR,
};
