import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database...');
    await client.query('BEGIN');

    // 1. Create Seats Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_seats (
        id VARCHAR(64) PRIMARY KEY,
        seat_number VARCHAR(20) UNIQUE NOT NULL,
        zone VARCHAR(50) NOT NULL,
        status VARCHAR(30) DEFAULT 'AVAILABLE' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create Members Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_members (
        id VARCHAR(64) PRIMARY KEY,
        member_code VARCHAR(30) UNIQUE NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        mobile_number VARCHAR(15) UNIQUE NOT NULL,
        aadhaar_encrypted TEXT,
        address TEXT,
        study_purpose VARCHAR(150),
        seat_id VARCHAR(64) UNIQUE REFERENCES synapz_seats(id) ON DELETE SET NULL,
        allotted_seat_number VARCHAR(20),
        membership_start_date TIMESTAMPTZ DEFAULT NOW(),
        membership_end_date TIMESTAMPTZ,
        status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create Attendance Table with critical unique constraint
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_attendance (
        id VARCHAR(64) PRIMARY KEY,
        member_id VARCHAR(64) NOT NULL REFERENCES synapz_members(id) ON DELETE CASCADE,
        member_name_snapshot VARCHAR(150) NOT NULL,
        seat_number_snapshot VARCHAR(20),
        attendance_date VARCHAR(10) NOT NULL,
        check_in_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        method VARCHAR(30) DEFAULT 'MEMBER_SELF_SERVICE' NOT NULL,
        status VARCHAR(30) DEFAULT 'CHECKED_IN' NOT NULL,
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_synapz_member_daily_attendance UNIQUE (member_id, attendance_date)
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_synapz_attendance_date ON synapz_attendance(attendance_date);
      CREATE INDEX IF NOT EXISTS idx_synapz_attendance_member ON synapz_attendance(member_id);
      CREATE INDEX IF NOT EXISTS idx_synapz_member_mobile ON synapz_members(mobile_number);
    `);

    // 4. Create Admin Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_admin_users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        password_hash TEXT NOT NULL,
        role VARCHAR(30) DEFAULT 'ADMIN' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Create OTP Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_otp_sessions (
        id VARCHAR(64) PRIMARY KEY,
        mobile_number VARCHAR(15) NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INT DEFAULT 0 NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_synapz_otp_mobile ON synapz_otp_sessions(mobile_number, created_at);
    `);

    // 6. Create Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS synapz_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        actor_id VARCHAR(64) NOT NULL,
        actor_role VARCHAR(30) NOT NULL,
        action VARCHAR(80) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(64) NOT NULL,
        metadata TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Seed the 32 authentic seats if not already present
    const SEATS = [
      // North Aisle (10 seats)
      { code: 'C', zone: 'North Aisle' },
      { code: '9', zone: 'North Aisle' },
      { code: '8', zone: 'North Aisle' },
      { code: '7', zone: 'North Aisle' },
      { code: '6', zone: 'North Aisle' },
      { code: '5', zone: 'North Aisle' },
      { code: '4', zone: 'North Aisle' },
      { code: '3', zone: 'North Aisle' },
      { code: '2', zone: 'North Aisle' },
      { code: '1', zone: 'North Aisle' },
      // Central Cluster (12 seats)
      { code: 'B', zone: 'Central Cluster' },
      { code: 'E', zone: 'Central Cluster' },
      { code: 'A', zone: 'Central Cluster' },
      { code: 'D', zone: 'Central Cluster' },
      { code: '13', zone: 'Central Cluster' },
      { code: '14', zone: 'Central Cluster' },
      { code: '12', zone: 'Central Cluster' },
      { code: '15', zone: 'Central Cluster' },
      { code: '11', zone: 'Central Cluster' },
      { code: '16', zone: 'Central Cluster' },
      { code: '10', zone: 'Central Cluster' },
      { code: '17', zone: 'Central Cluster' },
      // South Aisle (10 seats)
      { code: 'F', zone: 'South Aisle' },
      { code: '26', zone: 'South Aisle' },
      { code: '25', zone: 'South Aisle' },
      { code: '24', zone: 'South Aisle' },
      { code: '23', zone: 'South Aisle' },
      { code: '22', zone: 'South Aisle' },
      { code: '21', zone: 'South Aisle' },
      { code: '20', zone: 'South Aisle' },
      { code: '19', zone: 'South Aisle' },
      { code: '18', zone: 'South Aisle' }
    ];

    for (const seat of SEATS) {
      const seatId = `seat_${seat.code.toLowerCase()}`;
      await client.query(`
        INSERT INTO synapz_seats (id, seat_number, zone, status)
        VALUES ($1, $2, $3, 'AVAILABLE')
        ON CONFLICT (seat_number) DO NOTHING;
      `, [seatId, seat.code, seat.zone]);
    }
    console.log(`Verified 32 study seats in synapz_seats.`);

    // 8. Seed Default Admin User if none exists
    const adminCheck = await client.query('SELECT id FROM synapz_admin_users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedPw = await bcrypt.hash('synapz@focus2026', 10);
      await client.query(`
        INSERT INTO synapz_admin_users (id, username, name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, 'ADMIN', true);
      `, ['admin_master_1', 'admin', 'Synapz Administrator', 'admin@synapzstudyzone.com', hashedPw]);
      console.log('Seeded default admin user: username="admin", password="synapz@focus2026"');
    }

    // 9. Seed 2 initial test members if none exist (for immediate testing)
    const memberCheck = await client.query('SELECT count(*) FROM synapz_members');
    if (parseInt(memberCheck.rows[0].count) === 0) {
      // Find seat C
      const seatC = await client.query('SELECT id FROM synapz_seats WHERE seat_number = $1', ['C']);
      const seatCId = seatC.rows[0]?.id || null;

      await client.query(`
        INSERT INTO synapz_members (
          id, member_code, full_name, mobile_number, address, study_purpose, 
          seat_id, allotted_seat_number, status
        ) VALUES (
          'mem_demo_1', 'SYN-1001', 'Aditya Varma', '9492722891', 
          'Madhurawada, Visakhapatnam', 'UPSC Civil Services 2026',
          $1, 'C', 'ACTIVE'
        );
      `, [seatCId]);

      if (seatCId) {
        await client.query('UPDATE synapz_seats SET status = $1 WHERE id = $2', ['ALLOTTED', seatCId]);
      }

      // Member 2
      const seat13 = await client.query('SELECT id FROM synapz_seats WHERE seat_number = $1', ['13']);
      const seat13Id = seat13.rows[0]?.id || null;

      await client.query(`
        INSERT INTO synapz_members (
          id, member_code, full_name, mobile_number, address, study_purpose, 
          seat_id, allotted_seat_number, status
        ) VALUES (
          'mem_demo_2', 'SYN-1002', 'Sravani Rao', '9876543210', 
          'Midhilapuri Vuda Colony, Vizag', 'NEET PG 2026',
          $1, '13', 'ACTIVE'
        );
      `, [seat13Id]);

      if (seat13Id) {
        await client.query('UPDATE synapz_seats SET status = $1 WHERE id = $2', ['ALLOTTED', seat13Id]);
      }

      console.log('Seeded sample members: 9492722891 (Seat C), 9876543210 (Seat 13)');
    }

    await client.query('COMMIT');
    console.log('Synapz Study Zone migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('migrate.js')) {
  runMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
