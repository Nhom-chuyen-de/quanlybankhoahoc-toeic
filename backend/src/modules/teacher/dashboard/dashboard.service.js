/**
 * @file dashboard.service.js
 * @description Nghiệp vụ Dashboard cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy các chỉ số tổng quan cho Dashboard của giảng viên.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @returns {Promise<{totalClasses: number, totalStudents: number, avgAttendance: number, pendingGrading: number}>}
 */
export async function getDashboardStats(teacherId) {
  return runInTeacherContext(teacherId, async (request) => {
    // 1. Tổng số lớp do giảng viên phụ trách (không tính lớp đã hủy)
    const classResult = await request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .query(`
        SELECT COUNT(*) AS totalClasses
        FROM dbo.lop_hoc
        WHERE giao_vien_id = @TeacherId AND trang_thai <> N'da huy';
      `);
    const totalClasses = Number(classResult.recordset[0]?.totalClasses || 0);

    // 2. Tổng số học viên đang học trong các lớp của giảng viên (DISTINCT)
    const studentResult = await request
      .query(`
        SELECT COUNT(DISTINCT gd.hoc_vien_id) AS totalStudents
        FROM dbo.ghi_danh gd
        INNER JOIN dbo.lop_hoc lh ON gd.lop_hoc_id = lh.id
        WHERE lh.giao_vien_id = @TeacherId
          AND gd.trang_thai = N'dang hoc'
          AND lh.trang_thai <> N'da huy';
      `);
    const totalStudents = Number(studentResult.recordset[0]?.totalStudents || 0);

    // 3. Tỷ lệ điểm danh trung bình (co mat + di tre trên tổng số lượt điểm danh)
    const attendanceResult = await request
      .query(`
        SELECT 
          COUNT(*) AS totalRecords,
          COUNT(CASE WHEN dd.trang_thai IN (N'co mat', N'di tre') THEN 1 END) AS attendedRecords
        FROM dbo.diem_danh dd
        INNER JOIN dbo.lich_hoc l ON dd.lich_hoc_id = l.id
        INNER JOIN dbo.lop_hoc lh ON l.lop_hoc_id = lh.id
        WHERE lh.giao_vien_id = @TeacherId;
      `);
    const totalRecords = Number(attendanceResult.recordset[0]?.totalRecords || 0);
    const attendedRecords = Number(attendanceResult.recordset[0]?.attendedRecords || 0);
    const avgAttendance = totalRecords > 0
      ? Math.round((attendedRecords / totalRecords) * 1000) / 10
      : 0;

    // 4. Tổng số bài tập cần chấm (diem IS NULL)
    const pendingAssignmentsResult = await request
      .query(`
        SELECT COUNT(*) AS pendingAssignments
        FROM dbo.bai_tap_nop btn
        INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
        INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
        WHERE lh.giao_vien_id = @TeacherId
          AND btn.diem IS NULL;
      `);
    const pendingAssignments = Number(pendingAssignmentsResult.recordset[0]?.pendingAssignments || 0);

    // 5. Tổng số bài thi kỹ năng cần chấm (ngay_cham IS NULL)
    const pendingSkillsResult = await request
      .query(`
        SELECT COUNT(DISTINCT kqkn.id) AS pendingSkills
        FROM dbo.ket_qua_ky_nang kqkn
        INNER JOIN dbo.bai_lam bl ON kqkn.bai_lam_id = bl.id
        INNER JOIN dbo.bai_kiem_tra bkt ON bl.bai_kiem_tra_id = bkt.id
        LEFT JOIN dbo.bai_hoc bh ON bkt.bai_hoc_id = bh.id
        INNER JOIN dbo.lop_hoc lh ON (
          (bkt.lop_hoc_id IS NOT NULL AND lh.id = bkt.lop_hoc_id)
          OR (bkt.lop_hoc_id IS NULL AND bh.lop_hoc_id IS NOT NULL AND lh.id = bh.lop_hoc_id)
          OR (bkt.lop_hoc_id IS NULL AND bh.lop_hoc_id IS NULL AND bh.khoa_hoc_id IS NOT NULL AND lh.khoa_hoc_id = bh.khoa_hoc_id)
        )
        INNER JOIN dbo.ghi_danh gd ON gd.lop_hoc_id = lh.id AND gd.hoc_vien_id = bl.hoc_vien_id AND gd.trang_thai = N'dang hoc'
        WHERE lh.giao_vien_id = @TeacherId
          AND kqkn.ngay_cham IS NULL;
      `);
    const pendingSkills = Number(pendingSkillsResult.recordset[0]?.pendingSkills || 0);

    const pendingGrading = pendingAssignments + pendingSkills;

    return {
      totalClasses,
      totalStudents,
      avgAttendance,
      pendingGrading,
    };
  });
}

/**
 * Lấy danh sách lịch dạy sắp tới của giảng viên.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {number} [limit=5] - Giới hạn số lượng bản ghi
 * @returns {Promise<Array>}
 */
export async function getUpcomingClasses(teacherId, limit = 5) {
  // Validate limit an toàn
  const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 5));

  return runInTeacherContext(teacherId, async (request) => {
    const result = await request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('Limit', sql.Int, parsedLimit)
      .query(`
        SELECT 
          l.id AS scheduleId,
          lh.id AS classId,
          lh.ten_lop AS className,
          kh.ten_khoa_hoc AS courseName,
          CONVERT(VARCHAR(10), l.ngay_hoc, 23) AS studyDate,
          CONVERT(VARCHAR(8), l.gio_bat_dau, 108) AS startTime,
          CONVERT(VARCHAR(8), l.gio_ket_thuc, 108) AS endTime,
          l.phong_hoc AS room,
          l.duong_link_online AS onlineLink,
          (
            SELECT COUNT(DISTINCT gd.hoc_vien_id)
            FROM dbo.ghi_danh gd
            WHERE gd.lop_hoc_id = lh.id AND gd.trang_thai = N'dang hoc'
          ) AS studentsCount
        FROM dbo.lich_hoc l
        INNER JOIN dbo.lop_hoc lh ON l.lop_hoc_id = lh.id
        INNER JOIN dbo.khoa_hoc kh ON lh.khoa_hoc_id = kh.id
        WHERE (l.giao_vien_id = @TeacherId OR lh.giao_vien_id = @TeacherId)
          AND lh.trang_thai <> N'da huy'
          AND l.ngay_hoc >= CAST(SYSDATETIME() AS DATE)
        ORDER BY l.ngay_hoc ASC, l.gio_bat_dau ASC
        OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY;
      `);

    return result.recordset.map((row) => ({
      scheduleId: row.scheduleId,
      classId: row.classId,
      className: row.className,
      courseName: row.courseName,
      studyDate: row.studyDate,
      startTime: row.startTime,
      endTime: row.endTime,
      room: row.room || null,
      onlineLink: row.onlineLink || null,
      studentsCount: Number(row.studentsCount || 0),
    }));
  });
}

/**
 * Lấy danh sách bài thực sự cần giảng viên chấm điểm (cả bài tập và bài thi kỹ năng).
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {number} [limit=20] - Giới hạn số lượng bản ghi
 * @returns {Promise<Array>}
 */
export async function getPendingGradingSubmissions(teacherId, limit = 20) {
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  return runInTeacherContext(teacherId, async (request) => {
    const result = await request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('Limit', sql.Int, parsedLimit)
      .query(`
        WITH PendingSubmissions AS (
          -- Bài tập thường từ bai_tap_nop
          SELECT 
            btn.id AS submissionId,
            bt.tieu_de AS title,
            nd.ho_ten AS studentName,
            nd.id AS studentId,
            lh.ten_lop AS className,
            btn.ngay_nop AS submittedAt,
            'assignment' AS gradingType
          FROM dbo.bai_tap_nop btn
          INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
          INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
          INNER JOIN dbo.nguoi_dung nd ON btn.hoc_vien_id = nd.id
          WHERE lh.giao_vien_id = @TeacherId
            AND btn.diem IS NULL

          UNION ALL

          -- Bài thi kỹ năng từ ket_qua_ky_nang (Nói, Viết...)
          SELECT 
            kqkn.id AS submissionId,
            bkt.tieu_de + N' (' + kqkn.ky_nang + N')' AS title,
            nd.ho_ten AS studentName,
            nd.id AS studentId,
            lh.ten_lop AS className,
            bl.ngay_nop AS submittedAt,
            'skill' AS gradingType
          FROM dbo.ket_qua_ky_nang kqkn
          INNER JOIN dbo.bai_lam bl ON kqkn.bai_lam_id = bl.id
          INNER JOIN dbo.bai_kiem_tra bkt ON bl.bai_kiem_tra_id = bkt.id
          LEFT JOIN dbo.bai_hoc bh ON bkt.bai_hoc_id = bh.id
          INNER JOIN dbo.lop_hoc lh ON (
            (bkt.lop_hoc_id IS NOT NULL AND lh.id = bkt.lop_hoc_id)
            OR (bkt.lop_hoc_id IS NULL AND bh.lop_hoc_id IS NOT NULL AND lh.id = bh.lop_hoc_id)
            OR (bkt.lop_hoc_id IS NULL AND bh.lop_hoc_id IS NULL AND bh.khoa_hoc_id IS NOT NULL AND lh.khoa_hoc_id = bh.khoa_hoc_id)
          )
          INNER JOIN dbo.ghi_danh gd ON gd.lop_hoc_id = lh.id AND gd.hoc_vien_id = bl.hoc_vien_id AND gd.trang_thai = N'dang hoc'
          INNER JOIN dbo.nguoi_dung nd ON bl.hoc_vien_id = nd.id
          WHERE lh.giao_vien_id = @TeacherId
            AND kqkn.ngay_cham IS NULL
        )
        SELECT 
          submissionId,
          title,
          studentName,
          studentId,
          className,
          submittedAt,
          gradingType
        FROM PendingSubmissions
        ORDER BY submittedAt ASC
        OFFSET 0 ROWS FETCH NEXT @Limit ROWS ONLY;
      `);

    return result.recordset.map((row) => ({
      submissionId: row.submissionId,
      title: row.title,
      studentName: row.studentName,
      studentId: row.studentId,
      className: row.className,
      submittedAt: row.submittedAt,
      gradingType: row.gradingType,
    }));
  });
}
