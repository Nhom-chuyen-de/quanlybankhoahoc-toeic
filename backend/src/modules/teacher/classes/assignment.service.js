/**
 * @file assignment.service.js
 * @description Nghiệp vụ quản lý bài tập và bài nộp cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách bài tập của một lớp học do giảng viên phụ trách.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @param {object} options - Phân trang và tìm kiếm
 * @returns {Promise<{assignments: Array, pagination: object}>}
 */
export async function getAssignments(teacherId, classId, options = {}) {
  if (!classId || typeof classId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { q } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, classId);

    // Kiểm tra lớp và quyền giảng viên
    const classCheck = await request.query(`
      SELECT id, giao_vien_id FROM dbo.lop_hoc WHERE id = @ClassId;
    `);

    const cls = classCheck.recordset[0];
    if (!cls) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (cls.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền xem bài tập của lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    let whereClause = `WHERE bt.lop_hoc_id = @ClassId`;
    if (q && typeof q === 'string' && q.trim()) {
      const escapedQ = q.trim().replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
      request.input('SearchQuery', sql.NVarChar(200), `%${escapedQ}%`);
      whereClause += ` AND bt.tieu_de LIKE @SearchQuery`;
    }

    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.bai_tap bt
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        bt.id,
        bt.lop_hoc_id AS lopHocId,
        bt.tieu_de AS tieuDe,
        bt.mo_ta AS moTa,
        bt.han_nop AS hanNop,
        bt.nguoi_tao_id AS nguoiTaoId,
        bt.ngay_tao AS ngayTao,
        bt.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.bai_tap_nop btn WHERE btn.bai_tap_id = bt.id) AS soBaiDaNop,
        (SELECT COUNT(*) FROM dbo.bai_tap_nop btn WHERE btn.bai_tap_id = bt.id AND btn.diem IS NOT NULL) AS soBaiDaCham
      FROM dbo.bai_tap bt
      ${whereClause}
      ORDER BY bt.ngay_tao DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    return {
      assignments: listRes.recordset.map((item) => ({
        ...item,
        soBaiDaNop: Number(item.soBaiDaNop || 0),
        soBaiDaCham: Number(item.soBaiDaCham || 0),
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
 * Xem chi tiết bài tập.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} assignmentId - UUID của bài tập
 * @returns {Promise<object>}
 */
export async function getAssignmentDetail(teacherId, assignmentId) {
  if (!assignmentId || typeof assignmentId !== 'string') {
    const err = new Error('Mã bài tập không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('AssignmentId', sql.UniqueIdentifier, assignmentId);

    const res = await request.query(`
      SELECT 
        bt.id,
        bt.lop_hoc_id AS lopHocId,
        lh.ten_lop AS tenLop,
        lh.giao_vien_id AS giaoVienId,
        bt.tieu_de AS tieuDe,
        bt.mo_ta AS moTa,
        bt.han_nop AS hanNop,
        bt.nguoi_tao_id AS nguoiTaoId,
        bt.ngay_tao AS ngayTao,
        bt.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id = bt.lop_hoc_id AND gd.trang_thai = N'dang hoc') AS tongSoHocVien,
        (SELECT COUNT(*) FROM dbo.bai_tap_nop btn WHERE btn.bai_tap_id = bt.id) AS soBaiDaNop,
        (SELECT COUNT(*) FROM dbo.bai_tap_nop btn WHERE btn.bai_tap_id = bt.id AND btn.diem IS NOT NULL) AS soBaiDaCham
      FROM dbo.bai_tap bt
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE bt.id = @AssignmentId;
    `);

    const assignment = res.recordset[0];
    if (!assignment) {
      const err = new Error('Không tìm thấy thông tin bài tập.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (assignment.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền xem bài tập này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    return {
      ...assignment,
      tongSoHocVien: Number(assignment.tongSoHocVien || 0),
      soBaiDaNop: Number(assignment.soBaiDaNop || 0),
      soBaiDaCham: Number(assignment.soBaiDaCham || 0),
    };
  });
}

/**
 * Tạo mới bài tập trong lớp học.
 * Giảng viên chỉ được tạo bài tập cho lớp do mình phụ trách.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @param {object} payload - { tieuDe, moTa, hanNop }
 * @returns {Promise<object>}
 */
export async function createAssignment(teacherId, classId, payload = {}) {
  if (!classId || typeof classId !== 'string') {
    const err = new Error('Mã lớp học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tieuDe, moTa, hanNop } = payload;

  if (!tieuDe || typeof tieuDe !== 'string' || !tieuDe.trim()) {
    const err = new Error('Tiêu đề bài tập không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (tieuDe.trim().length > 200) {
    const err = new Error('Tiêu đề bài tập không được vượt quá 200 ký tự.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  let parsedHanNop = null;
  if (hanNop) {
    const d = new Date(hanNop);
    if (isNaN(d.getTime())) {
      const err = new Error('Hạn nộp bài không hợp lệ.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    parsedHanNop = d;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ClassId', sql.UniqueIdentifier, classId);

    const classCheck = await request.query(`
      SELECT id, giao_vien_id FROM dbo.lop_hoc WHERE id = @ClassId;
    `);

    const cls = classCheck.recordset[0];
    if (!cls) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (cls.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền tạo bài tập cho lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    request
      .input('TieuDe', sql.NVarChar(200), tieuDe.trim())
      .input('MoTa', sql.NVarChar(sql.MAX), moTa ? String(moTa).trim() : null)
      .input('HanNop', sql.DateTime2, parsedHanNop);

    // Insert rồi SELECT để an toàn tuyệt đối với trigger
    const insertRes = await request.query(`
      DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

      INSERT INTO dbo.bai_tap (id, lop_hoc_id, tieu_de, mo_ta, han_nop, nguoi_tao_id)
      VALUES (@NewId, @ClassId, @TieuDe, @MoTa, @HanNop, @TeacherId);

      SELECT 
        id,
        lop_hoc_id AS lopHocId,
        tieu_de AS tieuDe,
        mo_ta AS moTa,
        han_nop AS hanNop,
        nguoi_tao_id AS nguoiTaoId,
        ngay_tao AS ngayTao,
        ngay_cap_nhat AS ngayCapNhat
      FROM dbo.bai_tap
      WHERE id = @NewId;
    `);

    const created = insertRes.recordset[0];
    return {
      ...created,
      soBaiDaNop: 0,
      soBaiDaCham: 0,
    };
  });
}

/**
 * Cập nhật bài tập.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} assignmentId - UUID của bài tập
 * @param {object} payload - { tieuDe, moTa, hanNop }
 * @returns {Promise<object>}
 */
export async function updateAssignment(teacherId, assignmentId, payload = {}) {
  if (!assignmentId || typeof assignmentId !== 'string') {
    const err = new Error('Mã bài tập không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tieuDe, moTa, hanNop } = payload;

  if (tieuDe !== undefined) {
    if (typeof tieuDe !== 'string' || !tieuDe.trim()) {
      const err = new Error('Tiêu đề bài tập không được để trống.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    if (tieuDe.trim().length > 200) {
      const err = new Error('Tiêu đề bài tập không được vượt quá 200 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  let parsedHanNop = undefined;
  if (hanNop !== undefined) {
    if (hanNop === null) {
      parsedHanNop = null;
    } else {
      const d = new Date(hanNop);
      if (isNaN(d.getTime())) {
        const err = new Error('Hạn nộp bài không hợp lệ.');
        err.statusCode = 400;
        err.isSafeMessage = true;
        throw err;
      }
      parsedHanNop = d;
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('AssignmentId', sql.UniqueIdentifier, assignmentId);

    const checkRes = await request.query(`
      SELECT bt.id, bt.lop_hoc_id, bt.tieu_de, bt.mo_ta, bt.han_nop, lh.giao_vien_id
      FROM dbo.bai_tap bt
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE bt.id = @AssignmentId;
    `);

    const current = checkRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy thông tin bài tập.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền chỉnh sửa bài tập này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const updatedTieuDe = tieuDe !== undefined ? tieuDe.trim() : current.tieu_de;
    const updatedMoTa = moTa !== undefined ? (moTa ? String(moTa).trim() : null) : current.mo_ta;
    const updatedHanNop = parsedHanNop !== undefined ? parsedHanNop : current.han_nop;

    request
      .input('TieuDe', sql.NVarChar(200), updatedTieuDe)
      .input('MoTa', sql.NVarChar(sql.MAX), updatedMoTa)
      .input('HanNop', sql.DateTime2, updatedHanNop);

    // Update rồi SELECT tránh lỗi OUTPUT trigger
    const updateRes = await request.query(`
      UPDATE dbo.bai_tap
      SET 
        tieu_de = @TieuDe,
        mo_ta = @MoTa,
        han_nop = @HanNop,
        ngay_cap_nhat = SYSDATETIME()
      WHERE id = @AssignmentId;

      SELECT 
        id,
        lop_hoc_id AS lopHocId,
        tieu_de AS tieuDe,
        mo_ta AS moTa,
        han_nop AS hanNop,
        nguoi_tao_id AS nguoiTaoId,
        ngay_tao AS ngayTao,
        ngay_cap_nhat AS ngayCapNhat
      FROM dbo.bai_tap
      WHERE id = @AssignmentId;
    `);

    return updateRes.recordset[0];
  });
}

/**
 * Xóa bài tập.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} assignmentId - UUID của bài tập
 * @returns {Promise<{message: string}>}
 */
export async function deleteAssignment(teacherId, assignmentId) {
  if (!assignmentId || typeof assignmentId !== 'string') {
    const err = new Error('Mã bài tập không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('AssignmentId', sql.UniqueIdentifier, assignmentId);

    const checkRes = await request.query(`
      SELECT bt.id, lh.giao_vien_id
      FROM dbo.bai_tap bt
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE bt.id = @AssignmentId;
    `);

    const current = checkRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy thông tin bài tập.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền xóa bài tập này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    await request.query(`
      DELETE FROM dbo.bai_tap WHERE id = @AssignmentId;
    `);

    return { message: 'Xóa bài tập thành công.' };
  });
}

/**
 * Lấy danh sách bài nộp của một bài tập.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} assignmentId - UUID của bài tập
 * @param {object} options - Phân trang và lọc trạng thái chấm
 * @returns {Promise<{submissions: Array, pagination: object}>}
 */
export async function getAssignmentSubmissions(teacherId, assignmentId, options = {}) {
  if (!assignmentId || typeof assignmentId !== 'string') {
    const err = new Error('Mã bài tập không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { status } = options; // 'graded', 'ungraded'

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('AssignmentId', sql.UniqueIdentifier, assignmentId);

    // Kiểm tra quyền
    const checkRes = await request.query(`
      SELECT bt.id, lh.giao_vien_id
      FROM dbo.bai_tap bt
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      WHERE bt.id = @AssignmentId;
    `);

    const current = checkRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy thông tin bài tập.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.giao_vien_id !== teacherId) {
      const err = new Error('Bạn không có quyền xem bài nộp của bài tập này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    let whereClause = `WHERE btn.bai_tap_id = @AssignmentId`;
    if (status === 'graded') {
      whereClause += ` AND btn.diem IS NOT NULL`;
    } else if (status === 'ungraded') {
      whereClause += ` AND btn.diem IS NULL`;
    }

    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.bai_tap_nop btn
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        btn.id,
        btn.bai_tap_id AS baiTapId,
        btn.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTenHocVien,
        nd.email AS emailHocVien,
        btn.duong_dan_file AS duongDanFile,
        btn.ngay_nop AS ngayNop,
        btn.diem AS diem,
        btn.nhan_xet AS nhanXet,
        btn.nguoi_cham_id AS nguoiChamId,
        btn.ngay_cham AS ngayCham,
        btn.ngay_cap_nhat AS ngayCapNhat,
        CASE WHEN btn.diem IS NOT NULL THEN N'da cham' ELSE N'chua cham' END AS trangThaiCham
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.nguoi_dung nd ON btn.hoc_vien_id = nd.id
      ${whereClause}
      ORDER BY btn.ngay_nop DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    return {
      submissions: listRes.recordset.map((item) => ({
        ...item,
        diem: item.diem != null ? Number(item.diem) : null,
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
 * Xem chi tiết bài nộp.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} submissionId - UUID của bài nộp
 * @returns {Promise<object>}
 */
export async function getSubmissionDetail(teacherId, submissionId) {
  if (!submissionId || typeof submissionId !== 'string') {
    const err = new Error('Mã bài nộp không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('SubmissionId', sql.UniqueIdentifier, submissionId);

    const res = await request.query(`
      SELECT 
        btn.id,
        btn.bai_tap_id AS baiTapId,
        bt.tieu_de AS tieuDeBaiTap,
        bt.han_nop AS hanNopBaiTap,
        lh.id AS lopHocId,
        lh.ten_lop AS tenLop,
        lh.giao_vien_id AS giaoVienId,
        btn.hoc_vien_id AS hocVienId,
        nd.ho_ten AS hoTenHocVien,
        nd.email AS emailHocVien,
        btn.duong_dan_file AS duongDanFile,
        btn.ngay_nop AS ngayNop,
        btn.diem AS diem,
        btn.nhan_xet AS nhanXet,
        btn.nguoi_cham_id AS nguoiChamId,
        btn.ngay_cham AS ngayCham,
        btn.ngay_cap_nhat AS ngayCapNhat
      FROM dbo.bai_tap_nop btn
      INNER JOIN dbo.bai_tap bt ON btn.bai_tap_id = bt.id
      INNER JOIN dbo.lop_hoc lh ON bt.lop_hoc_id = lh.id
      INNER JOIN dbo.nguoi_dung nd ON btn.hoc_vien_id = nd.id
      WHERE btn.id = @SubmissionId;
    `);

    const sub = res.recordset[0];
    if (!sub) {
      const err = new Error('Không tìm thấy thông tin bài nộp.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (sub.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập bài nộp này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    return {
      ...sub,
      diem: sub.diem != null ? Number(sub.diem) : null,
      trangThaiCham: sub.diem != null ? 'da cham' : 'chua cham',
    };
  });
}
