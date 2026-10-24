import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { sanitizeMobile } from './authController.js';
import { getKolkataToday, formatKolkataTime, formatKolkataDateTime } from '../utils/timezone.js';
import { generateCsv } from '../utils/csv.js';

/**
 * Overview Metrics
 * GET /api/admin/metrics
 */
export async function getAdminMetrics(req, res) {
  try {
    const today = getKolkataToday();

    const [totalMembers, activeMembers, totalSeats, allottedSeats, todayAttendance] = await Promise.all([
      prisma.synapzMember.count(),
      prisma.synapzMember.count({ where: { status: 'ACTIVE' } }),
      prisma.synapzSeat.count(),
      prisma.synapzSeat.count({ where: { status: 'ALLOTTED' } }),
      prisma.synapzAttendance.count({ where: { attendanceDate: today } })
    ]);

    const notCheckedInToday = Math.max(0, activeMembers - todayAttendance);
    const availableSeats = Math.max(0, totalSeats - allottedSeats);

    return res.json({
      success: true,
      todayDate: today,
      metrics: {
        totalMembers,
        activeMembers,
        todayAttendance,
        notCheckedInToday,
        totalSeats,
        allottedSeats,
        availableSeats
      }
    });
  } catch (err) {
    console.error('Get Admin Metrics Error:', err);
    return res.status(500).json({ error: 'Failed to compute administrative metrics.' });
  }
}

/**
 * Members List
 * GET /api/admin/members
 */
export async function listMembers(req, res) {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.min(100, Math.max(10, parseInt(limit)));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (status && ['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { mobileNumber: { contains: q } },
        { memberCode: { contains: q, mode: 'insensitive' } },
        { allottedSeatNumber: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, members] = await Promise.all([
      prisma.synapzMember.count({ where }),
      prisma.synapzMember.findMany({
        where,
        include: { seat: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
      members: members.map(m => ({
        id: m.id,
        memberCode: m.memberCode,
        fullName: m.fullName,
        mobileNumber: m.mobileNumber,
        allottedSeatNumber: m.allottedSeatNumber,
        studyPurpose: m.studyPurpose,
        address: m.address,
        status: m.status,
        membershipStartDate: m.membershipStartDate,
        membershipEndDate: m.membershipEndDate,
        notes: m.notes,
        createdAt: m.createdAt
      }))
    });
  } catch (err) {
    console.error('List Members Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve members list.' });
  }
}

/**
 * Register Member
 * POST /api/admin/members
 */
export async function registerMember(req, res) {
  try {
    const {
      fullName,
      mobileNumber: rawMobile,
      seatNumber: rawSeatNumber,
      password: rawPassword,
      studyPurpose,
      address,
      membershipStartDate,
      membershipEndDate,
      notes,
      aadhaar
    } = req.body;

    // 1. Validations
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is mandatory.' });
    }

    const mobileNumber = sanitizeMobile(rawMobile);
    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Duplicate mobile check
    const existingMobile = await prisma.synapzMember.findUnique({
      where: { mobileNumber }
    });
    if (existingMobile) {
      return res.status(400).json({
        error: `Mobile number ${mobileNumber} is already registered under member ${existingMobile.fullName} (${existingMobile.memberCode}).`
      });
    }

    const seatNumber = String(rawSeatNumber || '').trim().toUpperCase();
    if (!seatNumber) {
      return res.status(400).json({ error: 'Seat assignment is required before attendance can be enabled.' });
    }

    // 2. Verify seat existence and availability
    const seat = await prisma.synapzSeat.findUnique({
      where: { seatNumber },
      include: { assignedMember: true }
    });

    if (!seat) {
      return res.status(400).json({ error: `Seat ${seatNumber} does not exist in the 32-seat floor plan.` });
    }

    if (seat.assignedMember && seat.assignedMember.status === 'ACTIVE') {
      return res.status(400).json({
        error: `Seat ${seatNumber} is already actively allotted to ${seat.assignedMember.fullName} (${seat.assignedMember.memberCode}).`
      });
    }

    // Provision password
    const initialPassword = (rawPassword && rawPassword.trim().length >= 6)
      ? rawPassword.trim()
      : (`Synapz@${mobileNumber.slice(-4)}`);
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // 3. Generate sequential Member Code: "SYN-1001", "SYN-1002"
    const existingMembers = await prisma.synapzMember.findMany({
      select: { memberCode: true }
    });
    let maxNum = 1000;
    for (const m of existingMembers) {
      if (m.memberCode && m.memberCode.startsWith('SYN-')) {
        const parsed = parseInt(m.memberCode.replace('SYN-', ''), 10);
        if (!isNaN(parsed) && parsed > maxNum) maxNum = parsed;
      }
    }
    const memberCode = `SYN-${maxNum + 1}`;

    // 4. Create member and update seat status in transaction
    const newMemberId = `mem_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Aadhaar masking/protection if provided
    let maskedAadhaar = null;
    if (aadhaar && String(aadhaar).trim().length >= 4) {
      const cleanAadhaar = String(aadhaar).replace(/\D/g, '');
      maskedAadhaar = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.synapzMember.create({
        data: {
          id: newMemberId,
          memberCode,
          fullName: fullName.trim(),
          mobileNumber,
          aadhaarEncrypted: maskedAadhaar,
          address: address?.trim() || null,
          studyPurpose: studyPurpose?.trim() || null,
          seatId: seat.id,
          allottedSeatNumber: seatNumber,
          passwordHash,
          membershipStartDate: membershipStartDate ? new Date(membershipStartDate) : new Date(),
          membershipEndDate: membershipEndDate ? new Date(membershipEndDate) : null,
          status: 'ACTIVE',
          notes: notes?.trim() || null
        }
      });

      await tx.synapzSeat.update({
        where: { id: seat.id },
        data: { status: 'ALLOTTED' }
      });

      await tx.synapzAuditLog.create({
        data: {
          id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          actorId: req.admin.id,
          actorRole: req.admin.role,
          action: 'MEMBER_REGISTER',
          entityType: 'Member',
          entityId: member.id,
          metadata: JSON.stringify({ memberCode, fullName: member.fullName, seatNumber, mobileNumber })
        }
      });

      return member;
    });

    return res.status(201).json({
      success: true,
      message: `Member ${result.fullName} successfully registered with Member ID ${result.memberCode} and assigned Seat ${seatNumber}.`,
      initialPassword,
      member: {
        id: result.id,
        memberCode: result.memberCode,
        fullName: result.fullName,
        mobileNumber: result.mobileNumber,
        allottedSeatNumber: result.allottedSeatNumber,
        status: result.status,
        studyPurpose: result.studyPurpose,
        membershipStartDate: result.membershipStartDate
      }
    });
  } catch (err) {
    console.error('Register Member Error:', err);
    return res.status(500).json({ error: 'Failed to register member. Please check input parameters.' });
  }
}

/**
 * Get Member Details
 * GET /api/admin/members/:id
 */
export async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const member = await prisma.synapzMember.findUnique({
      where: { id },
      include: {
        seat: true,
        attendances: {
          orderBy: { checkInAt: 'desc' },
          take: 30
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    return res.json({
      success: true,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        mobileNumber: member.mobileNumber,
        allottedSeatNumber: member.allottedSeatNumber,
        studyPurpose: member.studyPurpose,
        address: member.address,
        aadhaarMasked: member.aadhaarEncrypted,
        status: member.status,
        membershipStartDate: member.membershipStartDate,
        membershipEndDate: member.membershipEndDate,
        notes: member.notes,
        createdAt: member.createdAt,
        seat: member.seat,
        attendances: member.attendances
      }
    });
  } catch (err) {
    console.error('Get Member Detail Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve member details.' });
  }
}

/**
 * Reset Member Password (Admin Assisted)
 * POST /api/admin/members/:id/reset-password
 */
export async function resetMemberPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const member = await prisma.synapzMember.findUnique({ where: { id } });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const tempPassword = (newPassword && newPassword.trim().length >= 6)
      ? newPassword.trim()
      : (`Synapz@${member.mobileNumber.slice(-4)}`);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.synapzMember.update({
      where: { id },
      data: { passwordHash }
    });

    await prisma.synapzAuditLog.create({
      data: {
        id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        actorId: req.admin.id,
        actorRole: req.admin.role,
        action: 'MEMBER_PASSWORD_RESET',
        entityType: 'Member',
        entityId: id,
        metadata: JSON.stringify({ memberCode: member.memberCode, mobileNumber: member.mobileNumber })
      }
    });

    return res.json({
      success: true,
      message: `Password reset successfully for ${member.fullName}.`,
      tempPassword
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * Update Member Details
 * PATCH /api/admin/members/:id
 */
export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const { fullName, studyPurpose, address, notes, seatNumber: rawSeatNumber } = req.body;

    const member = await prisma.synapzMember.findUnique({
      where: { id },
      include: { seat: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const updateData = {};
    if (fullName && fullName.trim()) updateData.fullName = fullName.trim();
    if (studyPurpose !== undefined) updateData.studyPurpose = studyPurpose?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;

    // Handle seat change if provided
    if (rawSeatNumber && rawSeatNumber.toUpperCase() !== member.allottedSeatNumber) {
      const newSeatNumber = rawSeatNumber.trim().toUpperCase();
      const newSeat = await prisma.synapzSeat.findUnique({
        where: { seatNumber: newSeatNumber },
        include: { assignedMember: true }
      });

      if (!newSeat) {
        return res.status(400).json({ error: `Seat ${newSeatNumber} not found.` });
      }

      if (newSeat.assignedMember && newSeat.assignedMember.id !== member.id && newSeat.assignedMember.status === 'ACTIVE') {
        return res.status(400).json({ error: `Seat ${newSeatNumber} is already occupied by ${newSeat.assignedMember.fullName}.` });
      }

      // Free old seat and allot new seat
      await prisma.$transaction(async (tx) => {
        if (member.seatId) {
          await tx.synapzSeat.update({
            where: { id: member.seatId },
            data: { status: 'AVAILABLE' }
          });
        }
        await tx.synapzSeat.update({
          where: { id: newSeat.id },
          data: { status: 'ALLOTTED' }
        });
      });

      updateData.seatId = newSeat.id;
      updateData.allottedSeatNumber = newSeatNumber;
    }

    const updated = await prisma.synapzMember.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      message: 'Member profile updated successfully.',
      member: updated
    });
  } catch (err) {
    console.error('Update Member Error:', err);
    return res.status(500).json({ error: 'Failed to update member profile.' });
  }
}

/**
 * Toggle Member Status (ACTIVE, SUSPENDED, INACTIVE)
 * PATCH /api/admin/members/:id/status
 */
export async function updateMemberStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Choose ACTIVE, SUSPENDED, or INACTIVE.' });
    }

    const member = await prisma.synapzMember.findUnique({
      where: { id },
      include: { seat: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.synapzMember.update({
        where: { id },
        data: { status }
      });

      // If deactivated or suspended, make seat available
      if (status === 'INACTIVE' && member.seatId) {
        await tx.synapzSeat.update({
          where: { id: member.seatId },
          data: { status: 'AVAILABLE' }
        });
      } else if (status === 'ACTIVE' && member.seatId) {
        await tx.synapzSeat.update({
          where: { id: member.seatId },
          data: { status: 'ALLOTTED' }
        });
      }

      await tx.synapzAuditLog.create({
        data: {
          id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          actorId: req.admin.id,
          actorRole: req.admin.role,
          action: 'MEMBER_STATUS_CHANGE',
          entityType: 'Member',
          entityId: id,
          metadata: JSON.stringify({ from: member.status, to: status })
        }
      });
    });

    return res.json({
      success: true,
      message: `Member status successfully updated to ${status}.`
    });
  } catch (err) {
    console.error('Update Member Status Error:', err);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
}

/**
 * Daily Attendance Screen
 * GET /api/admin/attendance?date=YYYY-MM-DD
 */
export async function getDailyAttendance(req, res) {
  try {
    const queryDate = req.query.date || getKolkataToday();
    const { search, sortBy = 'time', sortOrder = 'desc' } = req.query;

    // 1. Fetch all attendance records for this date
    const attendanceRecords = await prisma.synapzAttendance.findMany({
      where: { attendanceDate: queryDate },
      include: {
        member: {
          select: { id: true, memberCode: true, fullName: true, mobileNumber: true, status: true }
        }
      },
      orderBy: { checkInAt: sortOrder === 'asc' ? 'asc' : 'desc' }
    });

    // 2. Fetch all active members to identify who did NOT check in
    const activeMembers = await prisma.synapzMember.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        memberCode: true,
        fullName: true,
        mobileNumber: true,
        allottedSeatNumber: true,
        studyPurpose: true
      },
      orderBy: { allottedSeatNumber: 'asc' }
    });

    const checkedInMemberIds = new Set(attendanceRecords.map(r => r.memberId));
    const absentMembers = activeMembers.filter(m => !checkedInMemberIds.has(m.id));

    // Format records
    let records = attendanceRecords.map(r => ({
      id: r.id,
      memberId: r.memberId,
      memberCode: r.member?.memberCode || 'N/A',
      fullName: r.memberNameSnapshot,
      memberName: r.memberNameSnapshot,
      mobileNumber: r.member?.mobileNumber || 'N/A',
      seatNumber: r.seatNumberSnapshot,
      attendanceDate: r.attendanceDate,
      checkInAt: r.checkInAt,
      time: formatKolkataTime(r.checkInAt),
      checkInTime: formatKolkataTime(r.checkInAt),
      formattedTime: formatKolkataTime(r.checkInAt),
      formattedDateTime: formatKolkataDateTime(r.checkInAt),
      method: r.method,
      status: r.status,
      memberStatus: r.member?.status || 'ACTIVE'
    }));

    // Filter if search query provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      records = records.filter(r =>
        r.fullName.toLowerCase().includes(q) ||
        r.memberName.toLowerCase().includes(q) ||
        r.mobileNumber.includes(q) ||
        r.memberCode.toLowerCase().includes(q) ||
        (r.seatNumber && r.seatNumber.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      date: queryDate,
      summary: {
        totalPresent: records.length,
        totalAbsent: absentMembers.length,
        totalActive: activeMembers.length
      },
      totalPresent: records.length,
      totalAbsent: absentMembers.length,
      totalActive: activeMembers.length,
      attendance: records,
      presentRecords: records,
      absentMembers
    });
  } catch (err) {
    console.error('Get Daily Attendance Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve daily attendance.' });
  }
}

/**
 * Attendance History View
 * GET /api/admin/attendance/history
 */
export async function getAttendanceHistory(req, res) {
  try {
    const { startDate, endDate, memberId, seatNumber, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const take = Math.min(100, Math.max(10, parseInt(limit)));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (startDate && endDate) {
      where.attendanceDate = { gte: startDate, lte: endDate };
    } else if (startDate) {
      where.attendanceDate = { gte: startDate };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (seatNumber) {
      where.seatNumberSnapshot = seatNumber.trim().toUpperCase();
    }

    const [total, records] = await Promise.all([
      prisma.synapzAttendance.count({ where }),
      prisma.synapzAttendance.findMany({
        where,
        include: {
          member: {
            select: { memberCode: true, mobileNumber: true }
          }
        },
        orderBy: { checkInAt: 'desc' },
        skip,
        take
      })
    ]);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
      records: records.map(r => ({
        id: r.id,
        memberId: r.memberId,
        memberCode: r.member?.memberCode || 'N/A',
        fullName: r.memberNameSnapshot,
        memberName: r.memberNameSnapshot,
        mobileNumber: r.member?.mobileNumber || 'N/A',
        seatNumber: r.seatNumberSnapshot,
        seatNumberSnapshot: r.seatNumberSnapshot,
        date: r.attendanceDate,
        attendanceDate: r.attendanceDate,
        checkInAt: r.checkInAt,
        time: formatKolkataTime(r.checkInAt),
        checkInTime: formatKolkataTime(r.checkInAt),
        formattedTime: formatKolkataTime(r.checkInAt),
        formattedDateTime: formatKolkataDateTime(r.checkInAt),
        method: r.method,
        status: r.status
      }))
    });
  } catch (err) {
    console.error('Get Attendance History Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendance history.' });
  }
}

/**
 * Safe CSV Export
 * GET /api/admin/attendance/export
 */
export async function exportAttendanceCsv(req, res) {
  try {
    const { date, startDate, endDate, memberId } = req.query;

    const where = {};
    if (date) {
      where.attendanceDate = date;
    } else if (startDate && endDate) {
      where.attendanceDate = { gte: startDate, lte: endDate };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const records = await prisma.synapzAttendance.findMany({
      where,
      include: {
        member: { select: { memberCode: true, mobileNumber: true } }
      },
      orderBy: { checkInAt: 'desc' }
    });

    const headers = [
      { key: 'memberCode', label: 'Member ID' },
      { key: 'fullName', label: 'Member Name' },
      { key: 'mobileNumber', label: 'Mobile Number' },
      { key: 'seatNumber', label: 'Seat' },
      { key: 'attendanceDate', label: 'Attendance Date' },
      { key: 'checkInTime', label: 'Check-In Time (IST)' },
      { key: 'method', label: 'Check-In Method' },
      { key: 'status', label: 'Status' }
    ];

    const rows = records.map(r => ({
      memberCode: r.member?.memberCode || 'N/A',
      fullName: r.memberNameSnapshot,
      mobileNumber: r.member?.mobileNumber || 'N/A',
      seatNumber: r.seatNumberSnapshot || 'N/A',
      attendanceDate: r.attendanceDate,
      checkInTime: formatKolkataTime(r.checkInAt),
      method: r.method,
      status: r.status
    }));

    const csvData = generateCsv(headers, rows);
    const filename = `Synapz_Attendance_${date || `${startDate || 'all'}_to_${endDate || 'now'}`}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvData);
  } catch (err) {
    console.error('Export CSV Error:', err);
    return res.status(500).json({ error: 'Failed to generate attendance CSV export.' });
  }
}

/**
 * Seat Management List
 * GET /api/admin/seats
 */
export async function listSeats(req, res) {
  try {
    const seats = await prisma.synapzSeat.findMany({
      include: {
        assignedMember: {
          select: { id: true, memberCode: true, fullName: true, mobileNumber: true, status: true }
        }
      },
      orderBy: { seatNumber: 'asc' }
    });

    return res.json({
      success: true,
      total: seats.length,
      seats: seats.map(s => ({
        id: s.id,
        seatNumber: s.seatNumber,
        zone: s.zone,
        status: s.status,
        member: s.assignedMember ? {
          id: s.assignedMember.id,
          memberCode: s.assignedMember.memberCode,
          fullName: s.assignedMember.fullName,
          mobileNumber: s.assignedMember.mobileNumber,
          status: s.assignedMember.status
        } : null
      }))
    });
  } catch (err) {
    console.error('List Seats Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve seats.' });
  }
}

/**
 * Public Seat Availability (Status Only, Privacy-Safe for Website)
 * GET /api/public/seats
 */
export async function getPublicSeatAvailability(req, res) {
  try {
    const seats = await prisma.synapzSeat.findMany({
      select: {
        id: true,
        seatNumber: true,
        zone: true,
        status: true // 'AVAILABLE' | 'ALLOTTED' | 'MAINTENANCE'
      },
      orderBy: { seatNumber: 'asc' }
    });

    const totalSeats = seats.length;
    const availableSeats = seats.filter(s => s.status === 'AVAILABLE').length;
    const allottedSeats = seats.filter(s => s.status === 'ALLOTTED').length;
    const maintenanceSeats = seats.filter(s => s.status === 'MAINTENANCE').length;

    return res.json({
      success: true,
      summary: {
        totalSeats,
        availableSeats,
        allottedSeats,
        maintenanceSeats
      },
      seats: seats.map(s => ({
        seatNumber: s.seatNumber,
        zone: s.zone,
        status: s.status
      }))
    });
  } catch (err) {
    console.error('Public Seat Availability Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve public seat availability.' });
  }
}

/**
 * Assign Seat to Member
 * POST /api/admin/seats/assign
 */
export async function assignSeat(req, res) {
  try {
    const { seatNumber: rawSeatNumber, memberId } = req.body;
    const seatNumber = String(rawSeatNumber || '').trim().toUpperCase();

    if (!seatNumber || !memberId) {
      return res.status(400).json({ error: 'Seat number and member ID are required.' });
    }

    const [seat, member] = await Promise.all([
      prisma.synapzSeat.findUnique({
        where: { seatNumber },
        include: { assignedMember: true }
      }),
      prisma.synapzMember.findUnique({
        where: { id: memberId },
        include: { seat: true }
      })
    ]);

    if (!seat) {
      return res.status(404).json({ error: `Seat ${seatNumber} not found.` });
    }

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (seat.assignedMember && seat.assignedMember.id !== member.id && seat.assignedMember.status === 'ACTIVE') {
      return res.status(400).json({ error: `Seat ${seatNumber} is currently occupied by ${seat.assignedMember.fullName}.` });
    }

    await prisma.$transaction(async (tx) => {
      // Free old seat
      if (member.seatId && member.seatId !== seat.id) {
        await tx.synapzSeat.update({
          where: { id: member.seatId },
          data: { status: 'AVAILABLE' }
        });
      }

      // Assign new seat
      await tx.synapzSeat.update({
        where: { id: seat.id },
        data: { status: 'ALLOTTED' }
      });

      await tx.synapzMember.update({
        where: { id: member.id },
        data: {
          seatId: seat.id,
          allottedSeatNumber: seatNumber
        }
      });

      await tx.synapzAuditLog.create({
        data: {
          id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          actorId: req.admin.id,
          actorRole: req.admin.role,
          action: 'SEAT_ASSIGN',
          entityType: 'Seat',
          entityId: seat.id,
          metadata: JSON.stringify({ seatNumber, memberId, memberCode: member.memberCode })
        }
      });
    });

    return res.json({
      success: true,
      message: `Seat ${seatNumber} successfully assigned to ${member.fullName} (${member.memberCode}).`
    });
  } catch (err) {
    console.error('Assign Seat Error:', err);
    return res.status(500).json({ error: 'Failed to assign seat.' });
  }
}

/**
 * Update Seat Status / Details
 * PATCH /api/admin/seats/:id
 */
export async function updateSeat(req, res) {
  try {
    const { id } = req.params;
    const { status, zone } = req.body;

    const seat = await prisma.synapzSeat.findUnique({
      where: { id }
    });

    if (!seat) {
      return res.status(404).json({ error: 'Seat not found.' });
    }

    const updateData = {};
    if (status && ['AVAILABLE', 'ALLOTTED', 'MAINTENANCE'].includes(status)) {
      updateData.status = status;
    }
    if (zone) {
      updateData.zone = zone;
    }

    const updated = await prisma.synapzSeat.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      message: `Seat ${seat.seatNumber} status updated to ${updated.status}.`,
      seat: updated
    });
  } catch (err) {
    console.error('Update Seat Error:', err);
    return res.status(500).json({ error: 'Failed to update seat status.' });
  }
}
