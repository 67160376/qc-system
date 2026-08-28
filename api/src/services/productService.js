const db = require('../db');

async function listProducts() {
  const result = await db.query(
    'SELECT * FROM products ORDER BY created_at DESC'
  );
  return result.rows;
}

async function getProductById(id) {
  const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);

  if (!result.rows[0]) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

async function createProduct({ product_code, product_name, description }) {
  if (!product_code || !product_name) {
    const error = new Error('Product code and product name are required.');
    error.statusCode = 400;
    throw error;
  }

  const exists = await db.query('SELECT id FROM products WHERE product_code = $1', [product_code.trim()]);
  if (exists.rows.length > 0) {
    const error = new Error('Product code already exists.');
    error.statusCode = 409;
    throw error;
  }

  const result = await db.query(
    'INSERT INTO products (product_code, product_name, description, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [product_code.trim(), product_name.trim(), description || '']
  );

  return result.rows[0];
}

async function updateProduct(id, payload) {
  const existing = await getProductById(id);
  const productCode = payload.product_code ?? existing.product_code;
  const productName = payload.product_name ?? existing.product_name;
  const description = payload.description ?? existing.description;

  if (!productCode || !productName) {
    const error = new Error('Product code and product name are required.');
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    'UPDATE products SET product_code = $1, product_name = $2, description = $3 WHERE id = $4 RETURNING *',
    [productCode.trim(), productName.trim(), description || '', id]
  );

  return result.rows[0];
}

async function deleteProduct(id) {
  await getProductById(id);
  await db.query('DELETE FROM products WHERE id = $1', [id]);
  return { message: 'Product deleted successfully.' };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
