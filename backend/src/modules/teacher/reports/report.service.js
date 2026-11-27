/**
 * @file report.service.js
 * @description Nghiệp vụ báo cáo và thống kê cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

const ALLOWED_REPORT_TYPES = ['nguoi dung', 'khoa hoc', 'diem danh', 'doanh thu'];

/**
 * Lấy báo cáo thống kê tổng quan của giảng viên.
 * Số liệu 100% từ database thật: số lớp, học viên, bài tập, bài nộp, tỷ lệ chấm, tỷ lệ điểm danh.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @returns {Promise<object>}
 */
export async function getTeacherOverviewReport(teacherId) {
  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    // 1. Thống kê lớp học & học viên
    const classRes = await request.query(`
      SELECT 
        COUNT(*) AS totalClasses,
        COUNT(CASE WHEN lh.trang_thai = N'dang dien ra' THEN 1 END) AS activeClasses,
        COUNT(CASE WHEN lh.trang_thai = N'da hoan thanh' THEN 1 END) AS completedClasses
      FROM dbo.lop_hoc lh
      WHERE lh.giao_vien_id = @TeacherId AND lh.trang_thai <> N'da huy';
    `);
    const cStats = classRes.recordset[0] || {};

    // 2. Tổng số học viên duy nhất đang học
    const studentRes = await request.query(`
      SELECT COUNT(DISTINCT gd.hoc_vien_id) AS totalStudents
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.lop_hoc lh ON gd.lop_hoc_id = lh.id
      WHERE lh.giao_vien_id = @TeacherId
        AND gd.trang_thai = N'dang hoc'
        AND lh.trang_thai <> N'da huy';
    `);
    const totalStudents = Number(studentRes.recordset[0]?.totalStudents || 0);

    // 3. Thống kê bài tập & chấm điểm
    const assignmentRes = await request.query(`
      SELECT 
        COUNT(DISTINCT bt.id) AS totalAssignments,
        COUNT(btn.id) AS totalSubmissions,
        COUNT(CASE WHEN btn.diem IS NOT NULL THEN 1 END) AS gradedSubmissions,
        COUNT(CASE WHEN btn.diem IS NULL THEN 1 END) AS pendingSubmissions,
        AVG(CASE WHEN btn.diem IS NOT NULL THEN CAST(btn.diem AS FLOAT) END) AS avgScore
      FROM dbo.bai_tap bt
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      LEFT JOIN dbo.bai_tap_nop btn ON bt.id = btn.bai_tap_id
      WHERE lh.giao_vien_id = @TeacherId AND lh.trang_thai <> N'da huy';
    `);
    const aStats = assignmentRes.recordset[0] || {};

    // 4. Thống kê điểm danh
    const attendanceRes = await request.query(`
      SELECT 
        COUNT(*) AS totalAttendanceRecords,
        COUNT(CASE WHEN dd.trang_thai IN (N'co mat', N'di tre') THEN 1 END) AS attendedRecords
      FROM dbo.diem_danh dd
      INNER JOIN dbo.lich_hoc lh ON dd.lich_hoc_id = lh.id
      INNER JOIN dbo.lop_hoc lop ON lh.lop_hoc_id = lop.id
      WHERE lop.giao_vien_id = @TeacherId;
    `);
    const attStats = attendanceRes.recordset[0] || {};
    const totalAttRecords = Number(attStats.totalAttendanceRecords || 0);
    const attendedRecords = Number(attStats.attendedRecords || 0);
    const avgAttendanceRate = totalAttRecords > 0
      ? Math.round((attendedRecords / totalAttRecords) * 1000) / 10
      : 0;

    return {
      classes: {
        total: Number(cStats.totalClasses || 0),
        active: Number(cStats.activeClasses || 0),
        completed: Number(cStats.completedClasses || 0),
      },
      students: {
        totalActive: totalStudents,
      },
      assignments: {
        totalAssigned: Number(aStats.totalAssignments || 0),
        totalSubmissions: Number(aStats.totalSubmissions || 0),
        graded: Number(aStats.gradedSubmissions || 0),
        pending: Number(aStats.pendingSubmissions || 0),
        avgScore: aStats.avgScore != null ? Math.round(Number(aStats.avgScore) * 10) / 10 : null,
      },
      attendance: {
        totalRecords: totalAttRecords,
        attendanceRate: avgAttendanceRate,
      },
    };
  });
}

/**
 * Báo cáo chi tiết hiệu suất học tập của một lớp học do giảng viên phụ trách.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @returns {Promise<object>}
 */
export async function getClassPerformanceReport(teacherId, classId) {
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

    // 1. Kiểm tra lớp và quyền phụ trách
    const classRes = await request.query(`
      SELECT 
        lh.id,
        lh.ten_lop AS tenLop,
        lh.khoa_hoc_id AS khoaHocId,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        lh.giao_vien_id AS giaoVienId,
        lh.si_so_toi_da AS siSoToiDa,
        lh.trang_thai AS trangThai,
        lh.ngay_bat_dau AS ngayBatDau,
        lh.ngay_ket_thuc AS ngayKetThuc
      FROM dbo.lop_hoc lh
      INNER JOIN dbo.khoa_hoc kh ON lh.khoa_hoc_id = kh.id
      WHERE lh.id = @ClassId;
    `);

    const cls = classRes.recordset[0];
    if (!cls) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (cls.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập báo cáo của lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Thống kê bài tập trong lớp
    const assignStatsRes = await request.query(`
      SELECT 
        COUNT(DISTINCT bt.id) AS totalAssignments,
        COUNT(btn.id) AS totalSubmissions,
        AVG(CASE WHEN btn.diem IS NOT NULL THEN CAST(btn.diem AS FLOAT) END) AS classAvgScore
      FROM dbo.bai_tap bt
      LEFT JOIN dbo.bai_tap_nop btn ON bt.id = btn.bai_tap_id
      WHERE bt.lop_hoc_id = @ClassId;
    `);
    const aStats = assignStatsRes.recordset[0] || {};

    // 3. Danh sách học viên và điểm trung bình + tỷ lệ có mặt
    const studentListRes = await request.query(`
      SELECT 
        gd.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTen,
        nd.email AS email,
        gd.trang_thai AS trangThaiGhiDanh,
        (
          SELECT AVG(CAST(btn.diem AS FLOAT))
          FROM dbo.bai_tap_nop btn
          INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
          WHERE bt.lop_hoc_id = @ClassId AND btn.hoc_vien_id = gd.hoc_vien_id AND btn.diem IS NOT NULL
        ) AS diemTrungBinh,
        (
          SELECT COUNT(*)
          FROM dbo.diem_danh dd
          INNER JOIN dbo.lich_hoc lh ON dd.lich_hoc_id = lh.id
          WHERE lh.lop_hoc_id = @ClassId AND dd.hoc_vien_id = gd.hoc_vien_id AND dd.trang_thai IN (N'co mat', N'di tre')
        ) AS soBuoiCoMat,
        (
          SELECT COUNT(*)
          FROM dbo.diem_danh dd
          INNER JOIN dbo.lich_hoc lh ON dd.lich_hoc_id = lh.id
          WHERE lh.lop_hoc_id = @ClassId AND dd.hoc_vien_id = gd.hoc_vien_id
        ) AS tongBuoiDiemDanh
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.nguoi_dung nd ON gd.hoc_vien_id = nd.id
      WHERE gd.lop_hoc_id = @ClassId
      ORDER BY nd.ho_ten ASC;
    `);

    return {
      classInfo: {
        id: cls.id,
        tenLop: cls.tenLop,
        tenKhoaHoc: cls.tenKhoaHoc,
        trangThai: cls.trangThai,
        siSoToiDa: Number(cls.siSoToiDa || 0),
        tongSoHocVien: studentListRes.recordset.length,
      },
      assignments: {
        totalAssignments: Number(aStats.totalAssignments || 0),
        totalSubmissions: Number(aStats.totalSubmissions || 0),
        classAvgScore: aStats.classAvgScore != null ? Math.round(Number(aStats.classAvgScore) * 10) / 10 : null,
      },
      students: studentListRes.recordset.map((st) => {
        const total = Number(st.tongBuoiDiemDanh || 0);
        const present = Number(st.soBuoiCoMat || 0);
        const attendanceRate = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
        return {
          hocVienId: st.hocVienId,
          hoTen: st.hoTen,
          email: st.email,
          trangThaiGhiDanh: st.trangThaiGhiDanh,
          diemTrungBinh: st.diemTrungBinh != null ? Math.round(Number(st.diemTrungBinh) * 10) / 10 : null,
          soBuoiCoMat: present,
          tongBuoiDiemDanh: total,
          attendanceRate,
        };
      }),
    };
  });
}

/**
 * Tạo một bản ghi báo cáo mới lưu trong bảng dbo.bao_cao.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} payload - { loaiBaoCao, boLoc, duongDanTep }
 * @returns {Promise<object>}
 */
export async function createReportRecord(teacherId, payload = {}) {
  const { loaiBaoCao, boLoc, duongDanTep } = payload;

  if (!loaiBaoCao || !ALLOWED_REPORT_TYPES.includes(loaiBaoCao)) {
    const err = new Error(`Loại báo cáo không hợp lệ. Cho phép: ${ALLOWED_REPORT_TYPES.join(', ')}.`);
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  let jsonFilter = null;
  if (boLoc !== undefined && boLoc !== null) {
    if (typeof boLoc === 'object') {
      jsonFilter = JSON.stringify(boLoc);
    } else if (typeof boLoc === 'string') {
      try {
        JSON.parse(boLoc);
        jsonFilter = boLoc;
      } catch {
        const err = new Error('Bộ lọc báo cáo phải là chuỗi JSON hợp lệ.');
        err.statusCode = 400;
        err.isSafeMessage = true;
        throw err;
      }
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('LoaiBaoCao', sql.NVarChar(20), loaiBaoCao)
      .input('BoLoc', sql.NVarChar(sql.MAX), jsonFilter)
      .input('DuongDanTep', sql.NVarChar(255), duongDanTep ? String(duongDanTep).trim() : null);

    const insertRes = await request.query(`
      DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

      INSERT INTO dbo.bao_cao (id, loai_bao_cao, nguoi_tao_id, bo_loc, duong_dan_tep)
      VALUES (@NewId, @LoaiBaoCao, @TeacherId, @BoLoc, @DuongDanTep);

      SELECT 
        id,
        loai_bao_cao AS loaiBaoCao,
        nguoi_tao_id AS nguoiTaoId,
        bo_loc AS boLoc,
        duong_dan_tep AS duongDanTep,
        ngay_tao AS ngayTao,
        ngay_het_han AS ngayHetHan
      FROM dbo.bao_cao
      WHERE id = @NewId;
    `);

    return insertRes.recordset[0];
  });
}
