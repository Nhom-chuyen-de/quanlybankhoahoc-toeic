/**
 * @file attendance.service.js
 * @description Nghiệp vụ điểm danh học viên cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

const ALLOWED_ATTENDANCE_STATUS = ['co mat', 'vang mat', 'di tre', 'co phep'];

/**
 * Lấy danh sách điểm danh của một buổi học.
 * Trả về toàn bộ học viên đang học trong lớp kèm trạng thái điểm danh hiện tại.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} scheduleId - UUID của buổi học
 * @returns {Promise<{schedule: object, attendance: Array}>}
 */
export async function getAttendanceList(teacherId, scheduleId) {
  if (!scheduleId || typeof scheduleId !== 'string') {
    const err = new Error('Mã buổi học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ScheduleId', sql.UniqueIdentifier, scheduleId);

    // 1. Kiểm tra buổi học và quyền giảng viên
    const scheduleRes = await request.query(`
      SELECT 
        lh.id,
        lh.lop_hoc_id AS lopHocId,
        lh.giao_vien_id AS giaoVienId,
        lh.ngay_hoc AS ngayHoc,
        CONVERT(VARCHAR(8), lh.gio_bat_dau, 108) AS gioBatDau,
        CONVERT(VARCHAR(8), lh.gio_ket_thuc, 108) AS gioKetThuc,
        lh.phong_hoc AS phongHoc,
        lh.duong_link_online AS duongLinkOnline,
        lop.ten_lop AS tenLop
      FROM dbo.lich_hoc lh
      INNER JOIN dbo.lop_hoc lop ON lh.lop_hoc_id = lop.id
      WHERE lh.id = @ScheduleId;
    `);

    const schedule = scheduleRes.recordset[0];
    if (!schedule) {
      const err = new Error('Không tìm thấy thông tin buổi học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (schedule.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền xem điểm danh của buổi học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Lấy danh sách toàn bộ học viên đang học trong lớp và bản ghi điểm danh nếu có
    const listRes = await request.query(`
      SELECT 
        gd.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTen,
        nd.email AS email,
        nd.so_dien_thoai AS soDienThoai,
        nd.anh_dai_dien AS anhDaiDien,
        dd.id AS diemDanhId,
        dd.trang_thai AS trangThaiDiemDanh,
        dd.thoi_gian_diem_danh AS thoiGianDiemDanh,
        dd.nguoi_diem_danh_id AS nguoiDiemDanhId
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.nguoi_dung nd ON gd.hoc_vien_id = nd.id
      LEFT JOIN dbo.diem_danh dd ON dd.lich_hoc_id = @ScheduleId AND dd.hoc_vien_id = gd.hoc_vien_id
      WHERE gd.lop_hoc_id = '${schedule.lopHocId}'
        AND gd.trang_thai = N'dang hoc'
      ORDER BY nd.ho_ten ASC;
    `);

    return {
      schedule,
      students: listRes.recordset,
    };
  });
}

/**
 * Thực hiện điểm danh hoặc cập nhật điểm danh cho học viên trong buổi học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} scheduleId - UUID của buổi học
 * @param {object} payload - { records: Array<{ hocVienId, trangThai }> }
 * @returns {Promise<{message: string, updatedCount: number}>}
 */
export async function saveAttendance(teacherId, scheduleId, payload = {}) {
  if (!scheduleId || typeof scheduleId !== 'string') {
    const err = new Error('Mã buổi học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { records } = payload;
  if (!Array.isArray(records) || records.length === 0) {
    const err = new Error('Danh sách bản ghi điểm danh không được rỗng.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  // Validate từng record
  for (const item of records) {
    if (!item.hocVienId || typeof item.hocVienId !== 'string') {
      const err = new Error('Mã học viên trong bản ghi điểm danh không hợp lệ.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    if (!item.trangThai || !ALLOWED_ATTENDANCE_STATUS.includes(item.trangThai)) {
      const err = new Error(`Trạng thái điểm danh không hợp lệ. Cho phép: ${ALLOWED_ATTENDANCE_STATUS.join(', ')}.`);
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ScheduleId', sql.UniqueIdentifier, scheduleId);

    // 1. Kiểm tra buổi học, quyền giảng viên và không phải buổi học tương lai
    const scheduleRes = await request.query(`
      SELECT 
        lh.id,
        lh.lop_hoc_id,
        lh.giao_vien_id,
        lh.ngay_hoc,
        CAST(SYSDATETIME() AS DATE) AS today
      FROM dbo.lich_hoc lh
      WHERE lh.id = @ScheduleId;
    `);

    const schedule = scheduleRes.recordset[0];
    if (!schedule) {
      const err = new Error('Không tìm thấy thông tin buổi học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (schedule.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền thực hiện điểm danh cho buổi học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    if (new Date(schedule.ngay_hoc) > new Date(schedule.today)) {
      const err = new Error('Không thể điểm danh cho buổi học trong tương lai.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Thực hiện Upsert từng bản ghi điểm danh
    let count = 0;
    for (const record of records) {
      const subReq = new sql.Request(request.transaction);
      subReq
        .input('ScheduleId', sql.UniqueIdentifier, scheduleId)
        .input('StudentId', sql.UniqueIdentifier, record.hocVienId)
        .input('TrangThai', sql.NVarChar(20), record.trangThai)
        .input('TeacherId', sql.UniqueIdentifier, teacherId);

      await subReq.query(`
        IF EXISTS (SELECT 1 FROM dbo.diem_danh WHERE lich_hoc_id = @ScheduleId AND hoc_vien_id = @StudentId)
        BEGIN
          UPDATE dbo.diem_danh
          SET 
            trang_thai = @TrangThai,
            thoi_gian_diem_danh = SYSDATETIME(),
            nguoi_diem_danh_id = @TeacherId
          WHERE lich_hoc_id = @ScheduleId AND hoc_vien_id = @StudentId;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.diem_danh (id, lich_hoc_id, hoc_vien_id, trang_thai, thoi_gian_diem_danh, nguoi_diem_danh_id)
          VALUES (NEWID(), @ScheduleId, @StudentId, @TrangThai, SYSDATETIME(), @TeacherId);
        END
      `);
      count++;
    }

    return {
      message: 'Lưu dữ liệu điểm danh thành công.',
      updatedCount: count,
    };
  });
}

/**
 * Thống kê tỷ lệ chuyên cần của một lớp học do giảng viên phụ trách.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @returns {Promise<object>}
 */
export async function getAttendanceStatsByClass(teacherId, classId) {
  if (!classId || typeof classId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, classId);

    const checkRes = await request.query(`
      SELECT id, giao_vien_id, ten_lop FROM dbo.lop_hoc WHERE id = @ClassId;
    `);

    const cls = checkRes.recordset[0];
    if (!cls) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (cls.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập dữ liệu lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const statsRes = await request.query(`
      SELECT 
        COUNT(*) AS totalRecords,
        COUNT(CASE WHEN dd.trang_thai = N'co mat' THEN 1 END) AS presentCount,
        COUNT(CASE WHEN dd.trang_thai = N'vang mat' THEN 1 END) AS absentCount,
        COUNT(CASE WHEN dd.trang_thai = N'di tre' THEN 1 END) AS lateCount,
        COUNT(CASE WHEN dd.trang_thai = N'co phep' THEN 1 END) AS excusedCount
      FROM dbo.diem_danh dd
      INNER JOIN dbo.lich_hoc lh ON dd.lich_hoc_id = lh.id
      WHERE lh.lop_hoc_id = @ClassId;
    `);

    const s = statsRes.recordset[0] || {};
    const totalRecords = Number(s.totalRecords || 0);
    const presentCount = Number(s.presentCount || 0);
    const lateCount = Number(s.lateCount || 0);
    const attendanceRate = totalRecords > 0
      ? Math.round(((presentCount + lateCount) / totalRecords) * 1000) / 10
      : 0;

    return {
      classId,
      tenLop: cls.ten_lop,
      totalRecords,
      presentCount,
      absentCount: Number(s.absentCount || 0),
      lateCount,
      excusedCount: Number(s.excusedCount || 0),
      attendanceRate,
    };
  });
}
