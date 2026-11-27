/**
 * @file grading.service.js
 * @description Nghiệp vụ chấm điểm bài tập cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách toàn bộ bài nộp cần chấm của các lớp do giảng viên phụ trách.
 * Hỗ trợ lọc theo lớp học (classId), phân trang.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} options - Bộ lọc và phân trang
 * @returns {Promise<{submissions: Array, pagination: object}>}
 */
export async function getPendingGradingSubmissions(teacherId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { classId } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    let whereClause = `
      WHERE lh.giao_vien_id = @TeacherId
        AND btn.diem IS NULL
    `;

    if (classId && typeof classId === 'string' && classId.trim()) {
      request.input('ClassId', sql.UniqueIdentifier, classId.trim());
      whereClause += ` AND bt.lop_hoc_id = @ClassId`;
    }

    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        btn.id AS submissionId,
        btn.bai_tap_id AS baiTapId,
        bt.tieu_de AS tieuDeBaiTap,
        bt.han_nop AS hanNopBaiTap,
        lh.id AS lopHocId,
        lh.ten_lop AS tenLop,
        btn.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTenHocVien,
        nd.email AS emailHocVien,
        btn.duong_dan_file AS duongDanFile,
        btn.ngay_nop AS ngayNop
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      INNER JOIN dbo.nguoi_dung nd ON btn.hoc_vien_id = nd.id
      ${whereClause}
      ORDER BY btn.ngay_nop ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    return {
      submissions: listRes.recordset,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  });
}

/**
 * Chấm điểm và nhận xét bài nộp của học viên.
 * Thang điểm: 0 - 100 theo ràng buộc ck_bai_tap_diem.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} submissionId - UUID của bài nộp
 * @param {object} payload - { diem, nhanXet }
 * @returns {Promise<object>}
 */
export async function gradeSubmission(teacherId, submissionId, payload = {}) {
  if (!submissionId || typeof submissionId !== 'string') {
    const err = new Error('Mã bài nộp không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { diem, nhanXet } = payload;

  if (diem === undefined || diem === null || isNaN(Number(diem))) {
    const err = new Error('Điểm số không được để trống và phải là số hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const numericScore = Number(diem);
  if (numericScore < 0 || numericScore > 100) {
    const err = new Error('Điểm số phải nằm trong khoảng từ 0 đến 100.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('SubmissionId', sql.UniqueIdentifier, submissionId);

    // Kiểm tra quyền chấm bài
    const checkRes = await request.query(`
      SELECT 
        btn.id,
        btn.bai_tap_id,
        lh.giao_vien_id
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE btn.id = @SubmissionId;
    `);

    const sub = checkRes.recordset[0];
    if (!sub) {
      const err = new Error('Không tìm thấy thông tin bài nộp.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (sub.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền chấm bài nộp này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    request
      .input('Diem', sql.Decimal(5, 2), numericScore)
      .input('NhanXet', sql.NVarChar(sql.MAX), nhanXet ? String(nhanXet).trim() : null);

    // Update then select để an toàn với trigger
    const updateRes = await request.query(`
      UPDATE dbo.bai_tap_nop
      SET 
        diem = @Diem,
        nhan_xet = @NhanXet,
        nguoi_cham_id = @TeacherId,
        ngay_cham = SYSDATETIME(),
        ngay_cap_nhat = SYSDATETIME()
      WHERE id = @SubmissionId;

      SELECT 
        btn.id AS submissionId,
        btn.bai_tap_id AS baiTapId,
        btn.hoc_vien_id AS hocVienId,
        btn.duong_dan_file AS duongDanFile,
        btn.ngay_nop AS ngayNop,
        btn.diem AS diem,
        btn.nhan_xet AS nhanXet,
        btn.nguoi_cham_id AS nguoiChamId,
        btn.ngay_cham AS ngayCham,
        btn.ngay_cap_nhat AS ngayCapNhat
      FROM dbo.bai_tap_nop btn
      WHERE btn.id = @SubmissionId;
    `);

    const updated = updateRes.recordset[0];
    return {
      ...updated,
      diem: Number(updated.diem),
    };
  });
}

/**
 * Thống kê tổng hợp tình hình chấm bài của giảng viên.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @returns {Promise<object>}
 */
export async function getGradingStats(teacherId) {
  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    const statsRes = await request.query(`
      SELECT 
        COUNT(*) AS totalSubmissions,
        COUNT(CASE WHEN btn.diem IS NOT NULL THEN 1 END) AS gradedCount,
        COUNT(CASE WHEN btn.diem IS NULL THEN 1 END) AS pendingCount,
        AVG(CASE WHEN btn.diem IS NOT NULL THEN CAST(btn.diem AS FLOAT) END) AS averageScore
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE lh.giao_vien_id = @TeacherId;
    `);

    const s = statsRes.recordset[0] || {};
    return {
      totalSubmissions: Number(s.totalSubmissions || 0),
      gradedCount: Number(s.gradedCount || 0),
      pendingCount: Number(s.pendingCount || 0),
      averageScore: s.averageScore != null ? Math.round(Number(s.averageScore) * 10) / 10 : null,
    };
  });
}
