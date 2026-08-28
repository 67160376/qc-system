const bcrypt = require('bcryptjs');
const db = require('./db');
const app = require('./app');

const PORT = process.env.PORT || 4000;

async function waitForDatabase(maxAttempts = 30) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      await db.query('SELECT 1');
      return;
    } catch (error) {
      attempt += 1;
      console.log(`Waiting for database... attempt ${attempt}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Database not available after retries.');
}

async function seedDefaultUsers() {
  const seedUsers = [
    { username: 'admin', password: 'admin123', role: 'ADMIN' },
    { username: 'qc_user', password: 'qc123', role: 'QC' },
    { username: 'production_user', password: 'production123', role: 'PRODUCTION' },
  ];

  for (const user of seedUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await db.query(
      `INSERT INTO users (username, password, role, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (username) DO UPDATE
       SET password = EXCLUDED.password,
           role = EXCLUDED.role`,
      [user.username, passwordHash, user.role]
    );
  }

  console.log('Seeded default QC system users.');
}

async function startServer() {
  try {
    await waitForDatabase();
    await seedDefaultUsers();

    app.listen(PORT, () => {
      console.log(`QC API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start API server:', error.message);
    process.exit(1);
  }
}

startServer();
