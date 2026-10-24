import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import prisma from '../src/db/prisma.js';
import { getKolkataToday, formatKolkataTime } from '../src/utils/timezone.js';
import { sanitizeMobile } from '../src/controllers/authController.js';
import { sanitizeCsvField, generateCsv } from '../src/utils/csv.js';

describe('SYNAPZ STUDY ZONE — Core Business Logic & Attendance Tests', () => {
  const testMobile = '9998887771';
  let createdMemberId = null;

  before(async () => {
    // Clean up any previous test artifact
    await prisma.synapzAttendance.deleteMany({
      where: { member: { mobileNumber: testMobile } }
    });
    await prisma.synapzMember.deleteMany({
      where: { mobileNumber: testMobile }
    });
  });

  after(async () => {
    // Teardown
    await prisma.synapzAttendance.deleteMany({
      where: { member: { mobileNumber: testMobile } }
    });
    await prisma.synapzMember.deleteMany({
      where: { mobileNumber: testMobile }
    });
  });

  it('1. Correctly formats and validates Indian 10-digit mobile numbers', () => {
    assert.equal(sanitizeMobile('+91 9492722891'), '9492722891');
    assert.equal(sanitizeMobile('09492722891'), '9492722891');
    assert.equal(sanitizeMobile('94927-22891'), '9492722891');
  });

  it('2. Calculates today date formatted YYYY-MM-DD in Asia/Kolkata timezone', () => {
    const today = getKolkataToday();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('3. Successfully registers a new member with unique memberCode and allotted seat', async () => {
    const seatB = await prisma.synapzSeat.findUnique({ where: { seatNumber: 'B' } });
    assert.ok(seatB, 'Seat B should exist');

    const member = await prisma.synapzMember.create({
      data: {
        id: `test_mem_${Date.now()}`,
        memberCode: `SYN-TEST-1`,
        fullName: 'Test Aspirant',
        mobileNumber: testMobile,
        seatId: seatB.id,
        allottedSeatNumber: 'B',
        status: 'ACTIVE'
      }
    });

    createdMemberId = member.id;
    assert.equal(member.mobileNumber, testMobile);
    assert.equal(member.allottedSeatNumber, 'B');
  });

  it('4. Rejects duplicate mobile number registration', async () => {
    await assert.rejects(
      async () => {
        await prisma.synapzMember.create({
          data: {
            id: `test_mem_dup_${Date.now()}`,
            memberCode: `SYN-TEST-2`,
            fullName: 'Duplicate Aspirant',
            mobileNumber: testMobile,
            status: 'ACTIVE'
          }
        });
      },
      (err) => {
        return err.code === 'P2002' || err.message.includes('unique');
      }
    );
  });

  it('5. Successfully records one-tap attendance for current date', async () => {
    const today = getKolkataToday();
    const attendance = await prisma.synapzAttendance.create({
      data: {
        id: `test_att_${Date.now()}`,
        memberId: createdMemberId,
        memberNameSnapshot: 'Test Aspirant',
        seatNumberSnapshot: 'B',
        attendanceDate: today,
        checkInAt: new Date(),
        method: 'MEMBER_SELF_SERVICE',
        status: 'CHECKED_IN'
      }
    });

    assert.equal(attendance.attendanceDate, today);
    assert.equal(attendance.seatNumberSnapshot, 'B');
  });

  it('6. Enforces single attendance per calendar date via database constraint', async () => {
    const today = getKolkataToday();
    await assert.rejects(
      async () => {
        await prisma.synapzAttendance.create({
          data: {
            id: `test_att_dup_${Date.now()}`,
            memberId: createdMemberId,
            memberNameSnapshot: 'Test Aspirant',
            seatNumberSnapshot: 'B',
            attendanceDate: today,
            checkInAt: new Date(),
            method: 'MEMBER_SELF_SERVICE',
            status: 'CHECKED_IN'
          }
        });
      },
      (err) => {
        return err.code === 'P2002' || err.message.includes('unique');
      }
    );
  });

  it('7. Protects CSV exports against formula injection', () => {
    const dangerousCell = '=cmd|"/C calc"!A0';
    const sanitized = sanitizeCsvField(dangerousCell);
    assert.ok(sanitized.startsWith("\"'="), 'Dangerous formula prefix must be neutralized with single quote');

    const normalCell = 'Aditya Varma';
    assert.equal(sanitizeCsvField(normalCell), '"Aditya Varma"');
  });

  it('8. Verifies bcrypt password hashing and mobile+password credentials', async () => {
    const rawPassword = 'SynapzTestPassword@2026';
    const hash = await bcrypt.hash(rawPassword, 10);
    assert.ok(hash.startsWith('$2'), 'Bcrypt hash should start with $2');

    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.strictEqual(isMatch, true, 'Correct password must match hash');

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrongMatch, false, 'Incorrect password must be rejected');
  });
});
