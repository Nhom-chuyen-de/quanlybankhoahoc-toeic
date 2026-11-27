/**
 * @file schedule.service.js
 * @description Nghiệp vụ quản lý lịch dạy cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách lịch dạy của giảng viên.
 * Hỗ trợ lọc theo khoảng thời gian (fromDate, toDate), theo lớp (classId).
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} options - Bộ lọc
 * @returns {Promise<Array>}
 */
export async function getTeacherSchedules(teacherId, options = {}) {
  const { fromDate, toDate, classId } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    let whereClause = `WHERE lh.giao_vien_id = @TeacherId`;

    if (classId && typeof classId === 'string' && classId.trim()) {
      request.input('ClassId', sql.UniqueIdentifier, classId.trim());
      whereClause += ` AND lh.lop_hoc_id = @ClassId`;
    }

    if (fromDate) {
      request.input('FromDate', sql.Date, new Date(fromDate));
      whereClause += ` AND lh.ngay_hoc >= @FromDate`;
    }

    if (toDate) {
      request.input('ToDate', sql.Date, new Date(toDate));
      whereClause += ` AND lh.ngay_hoc <= @ToDate`;
    }

    const listRes = await request.query(`
      SELECT 
        lh.id,
        lh.lop_hoc_id AS lopHocId,
        lop.ten_lop AS tenLop,
        lh.giao_vien_id AS giaoVienId,
        lh.ngay_hoc AS ngayHoc,
        CONVERT(VARCHAR(8), lh.gio_bat_dau, 108) AS gioBatDau,
        CONVERT(VARCHAR(8), lh.gio_ket_thuc, 108) AS gioKetThuc,
        lh.phong_hoc AS phongHoc,
        lh.duong_link_online AS duongLinkOnline,
        (SELECT COUNT(*) FROM dbo.diem_danh dd WHERE dd.lich_hoc_id = lh.id) AS soHocVienDaDiemDanh
      FROM dbo.lich_hoc lh
      INNER JOIN dbo.lop_hoc lop ON lh.lop_hoc_id = lop.id
      ${whereClause}
      ORDER BY lh.ngay_hoc ASC, lh.gio_bat_dau ASC;
    `);

    return listRes.recordset.map((item) => ({
      ...item,
      soHocVienDaDiemDanh: Number(item.soHocVienDaDiemDanh || 0),
    }));
  });
}

/**
 * Xem chi tiết buổi học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} scheduleId - UUID của lịch học
 * @returns {Promise<object>}
 */
export async function getScheduleDetail(teacherId, scheduleId) {
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

    const res = await request.query(`
      SELECT 
        lh.id,
        lh.lop_hoc_id AS lopHocId,
        lop.ten_lop AS tenLop,
        lh.giao_vien_id AS giaoVienId,
        lh.ngay_hoc AS ngayHoc,
        CONVERT(VARCHAR(8), lh.gio_bat_dau, 108) AS gioBatDau,
        CONVERT(VARCHAR(8), lh.gio_ket_thuc, 108) AS gioKetThuc,
        lh.phong_hoc AS phongHoc,
        lh.duong_link_online AS duongLinkOnline,
        (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id = lop.id AND gd.trang_thai = N'dang hoc') AS siSoLop,
        (SELECT COUNT(*) FROM dbo.diem_danh dd WHERE dd.lich_hoc_id = lh.id) AS soHocVienDaDiemDanh
      FROM dbo.lich_hoc lh
      INNER JOIN dbo.lop_hoc lop ON lh.lop_hoc_id = lop.id
      WHERE lh.id = @ScheduleId;
    `);

    const schedule = res.recordset[0];
    if (!schedule) {
      const err = new Error('Không tìm thấy thông tin buổi học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (schedule.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập buổi học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    return {
      ...schedule,
      siSoLop: Number(schedule.siSoLop || 0),
      soHocVienDaDiemDanh: Number(schedule.soHocVienDaDiemDanh || 0),
    };
  });
}

/**
 * Tạo mới buổi học trong lịch giảng dạy.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} payload - { lopHocId, ngayHoc, gioBatDau, gioKetThuc, phongHoc, duongLinkOnline }
 * @returns {Promise<object>}
 */
export async function createSchedule(teacherId, payload = {}) {
  const { lopHocId, ngayHoc, gioBatDau, gioKetThuc, phongHoc, duongLinkOnline } = payload;

  if (!lopHocId || typeof lopHocId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (!ngayHoc) {
    const err = new Error('Ngày học không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (!gioBatDau || !gioKetThuc) {
    const err = new Error('Giờ bắt đầu và kết thúc không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (!phongHoc && !duongLinkOnline) {
    const err = new Error('Phải có ít nhất phòng học trực tiếp hoặc đường dẫn online.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, lopHocId)
      .input('NgayHoc', sql.Date, new Date(ngayHoc))
      .input('GioBatDau', sql.VarChar(8), String(gioBatDau).trim())
      .input('GioKetThuc', sql.VarChar(8), String(gioKetThuc).trim())
      .input('PhongHoc', sql.NVarChar(100), phongHoc ? String(phongHoc).trim() : null)
      .input('DuongLinkOnline', sql.NVarChar(500), duongLinkOnline ? String(duongLinkOnline).trim() : null);

    // Kiểm tra lớp và quyền phụ trách
    const classRes = await request.query(`
      SELECT id, giao_vien_id, ngay_bat_dau, ngay_ket_thuc
      FROM dbo.lop_hoc
      WHERE id = @ClassId;
    `);

    const cls = classRes.recordset[0];
    if (!cls) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (cls.giao_vien_id !== teacherId) {
      const err = new Error('Bạn chỉ được tạo lịch học cho lớp do mình phụ trách.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Insert rồi SELECT để an toàn với trigger
    const insertRes = await request.query(`
      DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

      INSERT INTO dbo.lich_hoc (
        id, lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, phong_hoc, duong_link_online
      )
      VALUES (
        @NewId, @ClassId, @TeacherId, @NgayHoc, CAST(@GioBatDau AS TIME(0)), CAST(@GioKetThuc AS TIME(0)), @PhongHoc, @DuongLinkOnline
      );

      SELECT 
        id,
        lop_hoc_id AS lopHocId,
        giao_vien_id AS giaoVienId,
        ngay_hoc AS ngayHoc,
        CONVERT(VARCHAR(8), gio_bat_dau, 108) AS gioBatDau,
        CONVERT(VARCHAR(8), gio_ket_thuc, 108) AS gioKetThuc,
        phong_hoc AS phongHoc,
        duong_link_online AS duongLinkOnline
      FROM dbo.lich_hoc
      WHERE id = @NewId;
    `);

    return insertRes.recordset[0];
  });
}

/**
 * Cập nhật buổi học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} scheduleId - UUID của buổi học
 * @param {object} payload - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function updateSchedule(teacherId, scheduleId, payload = {}) {
  if (!scheduleId || typeof scheduleId !== 'string') {
    const err = new Error('Mã buổi học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { ngayHoc, gioBatDau, gioKetThuc, phongHoc, duongLinkOnline } = payload;

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ScheduleId', sql.UniqueIdentifier, scheduleId);

    const checkRes = await request.query(`
      SELECT 
        id, lop_hoc_id, giao_vien_id, ngay_hoc, 
        CONVERT(VARCHAR(8), gio_bat_dau, 108) AS gio_bat_dau,
        CONVERT(VARCHAR(8), gio_ket_thuc, 108) AS gio_ket_thuc,
        phong_hoc, duong_link_online
      FROM dbo.lich_hoc
      WHERE id = @ScheduleId;
    `);

    const current = checkRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy thông tin buổi học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền chỉnh sửa buổi học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const updatedNgayHoc = ngayHoc ? new Date(ngayHoc) : current.ngay_hoc;
    const updatedGioBatDau = gioBatDau ? String(gioBatDau).trim() : current.gio_bat_dau;
    const updatedGioKetThuc = gioKetThuc ? String(gioKetThuc).trim() : current.gio_ket_thuc;
    const updatedPhongHoc = phongHoc !== undefined ? (phongHoc ? String(phongHoc).trim() : null) : current.phong_hoc;
    const updatedLink = duongLinkOnline !== undefined ? (duongLinkOnline ? String(duongLinkOnline).trim() : null) : current.duong_link_online;

    request
      .input('NgayHoc', sql.Date, updatedNgayHoc)
      .input('GioBatDau', sql.VarChar(8), updatedGioBatDau)
      .input('GioKetThuc', sql.VarChar(8), updatedGioKetThuc)
      .input('PhongHoc', sql.NVarChar(100), updatedPhongHoc)
      .input('DuongLinkOnline', sql.NVarChar(500), updatedLink);

    const updateRes = await request.query(`
      UPDATE dbo.lich_hoc
      SET 
        ngay_hoc = @NgayHoc,
        gio_bat_dau = CAST(@GioBatDau AS TIME(0)),
        gio_ket_thuc = CAST(@GioKetThuc AS TIME(0)),
        phong_hoc = @PhongHoc,
        duong_link_online = @DuongLinkOnline
      WHERE id = @ScheduleId;

      SELECT 
        id,
        lop_hoc_id AS lopHocId,
        giao_vien_id AS giaoVienId,
        ngay_hoc AS ngayHoc,
        CONVERT(VARCHAR(8), gio_bat_dau, 108) AS gioBatDau,
        CONVERT(VARCHAR(8), gio_ket_thuc, 108) AS gioKetThuc,
        phong_hoc AS phongHoc,
        duong_link_online AS duongLinkOnline
      FROM dbo.lich_hoc
      WHERE id = @ScheduleId;
    `);

    return updateRes.recordset[0];
  });
}

/**
 * Xóa buổi học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} scheduleId - UUID của buổi học
 * @returns {Promise<{message: string}>}
 */
export async function deleteSchedule(teacherId, scheduleId) {
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

    const checkRes = await request.query(`
      SELECT id, giao_vien_id FROM dbo.lich_hoc WHERE id = @ScheduleId;
    `);

    const current = checkRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy thông tin buổi học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền xóa buổi học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    await request.query(`
      DELETE FROM dbo.lich_hoc WHERE id = @ScheduleId;
    `);

    return { message: 'Xóa buổi học thành công.' };
  });
}
