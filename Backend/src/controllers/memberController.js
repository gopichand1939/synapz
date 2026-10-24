import crypto from 'crypto';
import prisma from '../db/prisma.js';
import { getKolkataToday, formatKolkataTime, formatKolkataDateTime } from '../utils/timezone.js';

/**
 * Member Profile
 * GET /api/member/profile
 */
export async function getMemberProfile(req, res) {
  try {
    const member = req.member;
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
        status: member.status,
        membershipStartDate: member.membershipStartDate,
        membershipEndDate: member.membershipEndDate
      }
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

/**
 * Today's Attendance Status
 * GET /api/member/attendance/today
 */
export async function getTodayAttendanceStatus(req, res) {
  try {
    const member = req.member;
    const today = getKolkataToday();

    const record = await prisma.synapzAttendance.findFirst({
      where: {
        memberId: member.id,
        attendanceDate: today
      }
    });

    return res.json({
      success: true,
      todayDate: today,
      marked: Boolean(record),
      hasCheckedInToday: Boolean(record),
      attendance: record ? {
        id: record.id,
        attendanceDate: record.attendanceDate,
        checkInAt: record.checkInAt,
        checkInTime: formatKolkataTime(record.checkInAt),
        formattedTime: formatKolkataTime(record.checkInAt),
        formattedDateTime: formatKolkataDateTime(record.checkInAt),
        seatNumber: record.seatNumberSnapshot,
        seatNumberSnapshot: record.seatNumberSnapshot,
        status: record.status,
        method: record.method
      } : null,
      record: record ? {
        id: record.id,
        attendanceDate: record.attendanceDate,
        checkInAt: record.checkInAt,
        checkInTime: formatKolkataTime(record.checkInAt),
        formattedTime: formatKolkataTime(record.checkInAt),
        formattedDateTime: formatKolkataDateTime(record.checkInAt),
        seatNumber: record.seatNumberSnapshot,
        seatNumberSnapshot: record.seatNumberSnapshot,
        status: record.status,
        method: record.method
      } : null
    });
  } catch (err) {
    console.error('Get Today Attendance Error:', err);
    return res.status(500).json({ error: 'Failed to verify today attendance status.' });
  }
}

/**
 * Member One-Tap Check-In
 * POST /api/member/attendance/check-in
 */
export async function markTodayAttendance(req, res) {
  try {
    const member = req.member;

    // 1. Verify membership is active
    if (member.status !== 'ACTIVE') {
      return res.status(403).json({
        error: `Attendance cannot be marked. Your membership status is ${member.status}. Please visit the front desk.`
      });
    }

    // 2. Verify member has an allotted seat
    if (!member.allottedSeatNumber) {
      return res.status(400).json({
        error: 'No study seat is currently allotted to your profile. Please contact the administrator.'
      });
    }

    // 3. Compute reading-room date in Asia/Kolkata
    const today = getKolkataToday();

    // 4. Idempotency check: see if record already exists for today
    const existing = await prisma.synapzAttendance.findFirst({
      where: {
        memberId: member.id,
        attendanceDate: today
      }
    });

    if (existing) {
      const existingObj = {
        id: existing.id,
        attendanceDate: existing.attendanceDate,
        checkInAt: existing.checkInAt,
        checkInTime: formatKolkataTime(existing.checkInAt),
        formattedTime: formatKolkataTime(existing.checkInAt),
        formattedDateTime: formatKolkataDateTime(existing.checkInAt),
        seatNumber: existing.seatNumberSnapshot,
        seatNumberSnapshot: existing.seatNumberSnapshot,
        status: existing.status,
        method: existing.method
      };
      return res.json({
        success: true,
        alreadyMarked: true,
        message: `Attendance already recorded for today at ${formatKolkataTime(existing.checkInAt)}.`,
        attendance: existingObj,
        record: existingObj
      });
    }

    // 5. Create the attendance record atomically
    try {
      const newRecord = await prisma.synapzAttendance.create({
        data: {
          id: `att_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          memberId: member.id,
          memberNameSnapshot: member.fullName,
          seatNumberSnapshot: member.allottedSeatNumber,
          attendanceDate: today,
          checkInAt: new Date(), // Verified server timestamp
          method: 'MEMBER_SELF_SERVICE',
          status: 'CHECKED_IN'
        }
      });

      const newObj = {
        id: newRecord.id,
        attendanceDate: newRecord.attendanceDate,
        checkInAt: newRecord.checkInAt,
        checkInTime: formatKolkataTime(newRecord.checkInAt),
        formattedTime: formatKolkataTime(newRecord.checkInAt),
        formattedDateTime: formatKolkataDateTime(newRecord.checkInAt),
        seatNumber: newRecord.seatNumberSnapshot,
        seatNumberSnapshot: newRecord.seatNumberSnapshot,
        status: newRecord.status,
        method: newRecord.method
      };

      return res.status(201).json({
        success: true,
        alreadyMarked: false,
        message: `Attendance successfully marked at ${formatKolkataTime(newRecord.checkInAt)} for Seat ${member.allottedSeatNumber}.`,
        attendance: newObj,
        record: newObj
      });
    } catch (insertError) {
      // Catch possible race condition if double clicked at the exact millisecond
      if (insertError.code === 'P2002' || insertError.message?.includes('unique')) {
        const raceExisting = await prisma.synapzAttendance.findFirst({
          where: {
            memberId: member.id,
            attendanceDate: today
          }
        });
        if (raceExisting) {
          const raceObj = {
            id: raceExisting.id,
            attendanceDate: raceExisting.attendanceDate,
            checkInAt: raceExisting.checkInAt,
            checkInTime: formatKolkataTime(raceExisting.checkInAt),
            formattedTime: formatKolkataTime(raceExisting.checkInAt),
            formattedDateTime: formatKolkataDateTime(raceExisting.checkInAt),
            seatNumber: raceExisting.seatNumberSnapshot,
            seatNumberSnapshot: raceExisting.seatNumberSnapshot,
            status: raceExisting.status,
            method: raceExisting.method
          };
          return res.json({
            success: true,
            alreadyMarked: true,
            message: `Attendance already recorded for today at ${formatKolkataTime(raceExisting.checkInAt)}.`,
            attendance: raceObj,
            record: raceObj
          });
        }
      }
      throw insertError;
    }
  } catch (err) {
    console.error('Mark Attendance Error:', err);
    return res.status(500).json({ error: 'Failed to record attendance. Please try again or notify staff.' });
  }
}

/**
 * Member Attendance History
 * GET /api/member/attendance
 */
export async function getMemberAttendanceHistory(req, res) {
  try {
    const member = req.member;
    const records = await prisma.synapzAttendance.findMany({
      where: { memberId: member.id },
      orderBy: { checkInAt: 'desc' },
      take: 45
    });

    const formattedRecords = records.map(r => ({
      id: r.id,
      date: r.attendanceDate,
      attendanceDate: r.attendanceDate,
      checkInAt: r.checkInAt,
      time: formatKolkataTime(r.checkInAt),
      checkInTime: formatKolkataTime(r.checkInAt),
      formattedTime: formatKolkataTime(r.checkInAt),
      formattedDateTime: formatKolkataDateTime(r.checkInAt),
      seatNumber: r.seatNumberSnapshot,
      seatNumberSnapshot: r.seatNumberSnapshot,
      status: r.status,
      method: r.method
    }));

    return res.json({
      success: true,
      count: formattedRecords.length,
      totalRecords: formattedRecords.length,
      totalDaysPresent: formattedRecords.length,
      records: formattedRecords
    });
  } catch (err) {
    console.error('Get Attendance History Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve attendance history.' });
  }
}
