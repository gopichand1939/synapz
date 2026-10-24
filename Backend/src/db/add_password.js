import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding password_hash column to synapz_members if not present...');
    await client.query(`
      ALTER TABLE synapz_members 
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);

    // Update existing members with initial secure hashed password if null
    const members = await client.query('SELECT id, mobile_number FROM synapz_members WHERE password_hash IS NULL');
    for (const m of members.rows) {
      // Default password for seed: Synapz@ + last 4 digits of mobile
      const initialPw = `Synapz@${m.mobile_number.slice(-4)}`;
      const hash = await bcrypt.hash(initialPw, 10);
      await client.query('UPDATE synapz_members SET password_hash = $1 WHERE id = $2', [hash, m.id]);
      console.log(`Updated member ${m.mobile_number} initial password to: ${initialPw}`);
    }

    console.log('password_hash column verified and seeded members updated.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
