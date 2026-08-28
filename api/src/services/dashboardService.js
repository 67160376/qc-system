const db = require('../db');

async function getDashboardSummary() {
  const [products, inspections, ncrs, alerts] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total FROM products'),
    db.query(`
      SELECT
        COUNT(*)::int AS total_inspections,
        COALESCE(SUM(quantity), 0)::int AS total_quantity,
        COALESCE(SUM(passed_quantity), 0)::int AS total_passed_quantity,
        COALESCE(SUM(failed_quantity), 0)::int AS total_failed_quantity
      FROM inspections
    `),
    db.query('SELECT COUNT(*)::int AS total FROM ncrs WHERE status = \'OPEN\''),
    db.query('SELECT COUNT(*)::int AS total FROM alerts WHERE acknowledged = false')
  ]);

  const totalQuantity = Number(inspections.rows[0].total_quantity || 0);
  const totalPassedQuantity = Number(inspections.rows[0].total_passed_quantity || 0);
  const totalFailedQuantity = Number(inspections.rows[0].total_failed_quantity || 0);
  const passRate = totalQuantity > 0 ? Math.round((totalPassedQuantity / totalQuantity) * 100) : 0;

  return {
    total_products: Number(products.rows[0].total || 0),
    total_inspections: Number(inspections.rows[0].total_inspections || 0),
    total_quantity: totalQuantity,
    total_passed_quantity: totalPassedQuantity,
    total_failed_quantity: totalFailedQuantity,
    pass_rate: passRate,
    open_ncrs: Number(ncrs.rows[0].total || 0),
    unacknowledged_alerts: Number(alerts.rows[0].total || 0),
  };
}

module.exports = {
  getDashboardSummary,
};
