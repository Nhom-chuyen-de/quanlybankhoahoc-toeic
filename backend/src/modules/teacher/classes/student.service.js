/**
 * @file student.service.js
 * @description Nghiệp vụ theo dõi học viên trong lớp cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách học viên trong lớp do giảng viên phụ trách.
 * Hỗ trợ tìm kiếm theo tên/email (q), lọc theo trạng thái ghi danh, phân trang.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @param {object} options - Bộ lọc và phân trang
 * @returns {Promise<{students: Array, pagination: object}>}
 */
export async function getClassStudents(teacherId, classId, options = {}) {
  if (!classId || typeof classId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { q, trangThai } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, classId);

    // 1. Kiểm tra quyền phụ trách lớp của giảng viên
    const checkRes = await request.query(`
      SELECT id, giao_vien_id, khoa_hoc_id
      FROM dbo.lop_hoc
      WHERE id = @ClassId;
    `);

    const classData = checkRes.recordset[0];
    if (!classData) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (classData.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền xem học viên của lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Xây dựng điều kiện lọc
    let whereClause = `WHERE gd.lop_hoc_id = @ClassId`;

    if (q && typeof q === 'string' && q.trim()) {
      const escapedQ = q.trim().replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
      request.input('SearchQuery', sql.NVarChar(100), `%${escapedQ}%`);
      whereClause += ` AND (nd.ho_ten LIKE @SearchQuery OR nd.email LIKE @SearchQuery)`;
    }

    if (trangThai && typeof trangThai === 'string' && trangThai.trim()) {
      request.input('TrangThai', sql.NVarChar(20), trangThai.trim());
      whereClause += ` AND gd.trang_thai = @TrangThai`;
    }

    // 3. Đếm tổng số học viên
    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.nguoi_dung nd ON gd.hoc_vien_id = nd.id
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    // 4. Lấy danh sách phân trang
    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        gd.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTen,
        nd.email AS email,
        nd.so_dien_thoai AS soDienThoai,
        nd.anh_dai_dien AS anhDaiDien,
        gd.ngay_ghi_danh AS ngayGhiDanh,
        gd.trang_thai AS trangThaiGhiDanh,
        gd.diem_muc_tieu AS diemMucTieu,
        gd.ngay_cap_nhat AS ngayCapNhatGhiDanh
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.nguoi_dung nd ON gd.hoc_vien_id = nd.id
      ${whereClause}
      ORDER BY gd.ngay_ghi_danh DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    return {
      students: listRes.recordset.map((s) => ({
        ...s,
        diemMucTieu: s.diemMucTieu != null ? Number(s.diemMucTieu) : null,
      })),
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
 * Xem chi tiết học viên trong phạm vi lớp học do giảng viên phụ trách.
 * Kèm tổng hợp: tiến độ học tập khóa học, tỷ lệ điểm danh trong lớp, kết quả làm bài tập trong lớp.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @param {string} studentId - UUID của học viên
 * @returns {Promise<object>}
 */
export async function getStudentDetailInClass(teacherId, classId, studentId) {
  if (!classId || typeof classId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }
  if (!studentId || typeof studentId !== 'string') {
    const err = new Error('Mã học viên không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, classId)
      .input('StudentId', sql.UniqueIdentifier, studentId);

    // 1. Kiểm tra lớp và quyền giảng viên
    const classRes = await request.query(`
      SELECT id, giao_vien_id, khoa_hoc_id
      FROM dbo.lop_hoc
      WHERE id = @ClassId;
    `);

    const classData = classRes.recordset[0];
    if (!classData) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (classData.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Kiểm tra học viên có thuộc lớp này không
    const studentRes = await request.query(`
      SELECT 
        nd.id AS hocVienId,
        nd.ho_ten AS hoTen,
        nd.email AS email,
        nd.so_dien_thoai AS soDienThoai,
        nd.anh_dai_dien AS anhDaiDien,
        gd.ngay_ghi_danh AS ngayGhiDanh,
        gd.trang_thai AS trangThaiGhiDanh,
        gd.diem_muc_tieu AS diemMucTieu
      FROM dbo.ghi_danh gd
      INNER JOIN dbo.nguoi_dung nd ON gd.hoc_vien_id = nd.id
      WHERE gd.lop_hoc_id = @ClassId AND gd.hoc_vien_id = @StudentId;
    `);

    const student = studentRes.recordset[0];
    if (!student) {
      const err = new Error('Học viên không thuộc lớp học này.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    // 3. Thống kê điểm danh trong lớp
    const attendanceRes = await request.query(`
      SELECT 
        COUNT(*) AS totalSessions,
        COUNT(CASE WHEN dd.trang_thai = N'co mat' THEN 1 END) AS presentCount,
        COUNT(CASE WHEN dd.trang_thai = N'vang mat' THEN 1 END) AS absentCount,
        COUNT(CASE WHEN dd.trang_thai = N'di tre' THEN 1 END) AS lateCount,
        COUNT(CASE WHEN dd.trang_thai = N'co phep' THEN 1 END) AS excusedCount
      FROM dbo.diem_danh dd
      INNER JOIN dbo.lich_hoc lh ON dd.lich_hoc_id = lh.id
      WHERE lh.lop_hoc_id = @ClassId AND dd.hoc_vien_id = @StudentId;
    `);
    const att = attendanceRes.recordset[0] || {};

    // 4. Điểm bài tập trong lớp
    const assignmentsRes = await request.query(`
      SELECT 
        bt.id AS baiTapId,
        bt.tieu_de AS tieuDe,
        bt.han_nop AS hanNop,
        btn.id AS baiTapNopId,
        btn.ngay_nop AS ngayNop,
        btn.diem AS diem,
        btn.nhan_xet AS nhanXet,
        btn.ngay_cham AS ngayCham,
        CASE 
          WHEN btn.diem IS NOT NULL THEN N'da cham'
          WHEN btn.id IS NOT NULL THEN N'da nop'
          ELSE N'chua nop'
        END AS trangThaiNop
      FROM dbo.bai_tap bt
      LEFT JOIN dbo.bai_tap_nop btn ON bt.id = btn.bai_tap_id AND btn.hoc_vien_id = @StudentId
      WHERE bt.lop_hoc_id = @ClassId
      ORDER BY bt.ngay_tao DESC;
    `);

    // 5. Tiến độ học tập khóa học
    const progressRes = await request.query(`
      SELECT 
        COUNT(DISTINCT nd.ma_noi_dung) AS totalLessons,
        COUNT(DISTINCT CASE WHEN tdh.da_hoan_thanh = 1 THEN tdh.ma_noi_dung END) AS completedLessons
      FROM dbo.chuong_khoa_hoc ckh
      INNER JOIN dbo.noi_dung_khoa_hoc nd ON ckh.ma_chuong = nd.ma_chuong
      LEFT JOIN dbo.tien_do_hoc tdh ON nd.ma_noi_dung = tdh.ma_noi_dung
      LEFT JOIN dbo.dang_ky_khoa_hoc dk ON tdh.ma_dang_ky = dk.ma_dang_ky AND dk.ma_hoc_vien = @StudentId
      WHERE ckh.ma_khoa_hoc = '${classData.khoa_hoc_id}';
    `);
    const totalLessons = Number(progressRes.recordset[0]?.totalLessons || 0);
    const completedLessons = Number(progressRes.recordset[0]?.completedLessons || 0);
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 1000) / 10 : 0;

    return {
      ...student,
      diemMucTieu: student.diemMucTieu != null ? Number(student.diemMucTieu) : null,
      attendance: {
        totalSessions: Number(att.totalSessions || 0),
        presentCount: Number(att.presentCount || 0),
        absentCount: Number(att.absentCount || 0),
        lateCount: Number(att.lateCount || 0),
        excusedCount: Number(att.excusedCount || 0),
      },
      courseProgress: {
        totalLessons,
        completedLessons,
        progressPercent,
      },
      assignments: assignmentsRes.recordset.map((a) => ({
        ...a,
        diem: a.diem != null ? Number(a.diem) : null,
      })),
    };
  });
}
