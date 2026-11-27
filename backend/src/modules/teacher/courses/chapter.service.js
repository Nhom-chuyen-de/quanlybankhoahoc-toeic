/**
 * @file chapter.service.js
 * @description Nghiệp vụ quản lý chương học cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách chương của khóa học.
 * Giảng viên có quyền xem nếu là người tạo khóa học hoặc phụ trách lớp của khóa học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @returns {Promise<Array>}
 */
export async function getChapters(teacherId, courseId) {
  if (!courseId || typeof courseId !== 'string') {
    const err = new Error('Mã khóa học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('CourseId', sql.UniqueIdentifier, courseId);

    // Kiểm tra khóa học và quyền xem
    const checkRes = await request.query(`
      SELECT 
        kh.id,
        kh.nguoi_tao_id,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS isOwner,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        ) THEN 1 ELSE 0 END AS isAssignedClass
      FROM dbo.khoa_hoc kh
      WHERE kh.id = @CourseId;
    `);

    const course = checkRes.recordset[0];
    if (!course) {
      const err = new Error('Không tìm thấy thông tin khóa học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (!course.isOwner && !course.isAssignedClass) {
      const err = new Error('Bạn không có quyền xem thông tin khóa học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const listRes = await request.query(`
      SELECT 
        ckh.ma_chuong AS maChuong,
        ckh.ma_khoa_hoc AS maKhoaHoc,
        ckh.ten_chuong AS tenChuong,
        ckh.mo_ta AS moTa,
        ckh.thu_tu AS thuTu,
        ckh.ngay_tao AS ngayTao,
        ckh.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.noi_dung_khoa_hoc nd WHERE nd.ma_chuong = ckh.ma_chuong) AS soNoiDung
      FROM dbo.chuong_khoa_hoc ckh
      WHERE ckh.ma_khoa_hoc = @CourseId
      ORDER BY ckh.thu_tu ASC, ckh.ngay_tao ASC;
    `);

    return listRes.recordset.map((ch) => ({
      ...ch,
      thuTu: Number(ch.thuTu),
      soNoiDung: Number(ch.soNoiDung || 0),
    }));
  });
}

/**
 * Xem chi tiết chương học và danh sách nội dung bài học tóm tắt bên trong.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @param {string} chapterId - UUID của chương học
 * @returns {Promise<object>}
 */
export async function getChapterDetail(teacherId, courseId, chapterId) {
  if (!courseId || typeof courseId !== 'string') {
    const err = new Error('Mã khóa học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }
  if (!chapterId || typeof chapterId !== 'string') {
    const err = new Error('Mã chương học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('CourseId', sql.UniqueIdentifier, courseId)
      .input('ChapterId', sql.UniqueIdentifier, chapterId);

    // Kiểm tra khóa học và quyền xem
    const checkRes = await request.query(`
      SELECT 
        kh.id,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS isOwner,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        ) THEN 1 ELSE 0 END AS isAssignedClass
      FROM dbo.khoa_hoc kh
      WHERE kh.id = @CourseId;
    `);

    const course = checkRes.recordset[0];
    if (!course) {
      const err = new Error('Không tìm thấy thông tin khóa học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (!course.isOwner && !course.isAssignedClass) {
      const err = new Error('Bạn không có quyền xem thông tin khóa học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Kiểm tra chương học
    const chapterRes = await request.query(`
      SELECT 
        ckh.ma_chuong AS maChuong,
        ckh.ma_khoa_hoc AS maKhoaHoc,
        ckh.ten_chuong AS tenChuong,
        ckh.mo_ta AS moTa,
        ckh.thu_tu AS thuTu,
        ckh.ngay_tao AS ngayTao,
        ckh.ngay_cap_nhat AS ngayCapNhat,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS canManage
      FROM dbo.chuong_khoa_hoc ckh
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE ckh.ma_chuong = @ChapterId AND ckh.ma_khoa_hoc = @CourseId;
    `);

    const chapter = chapterRes.recordset[0];
    if (!chapter) {
      const err = new Error('Không tìm thấy chương học trong khóa học này.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    // Lấy danh sách nội dung bài học thuộc chương
    const contentsRes = await request.query(`
      SELECT 
        nd.ma_noi_dung AS maNoiDung,
        nd.ma_chuong AS maChuong,
        nd.tieu_de AS tieuDe,
        nd.loai_noi_dung AS loaiNoiDung,
        nd.thoi_luong_phut AS thoiLuongPhut,
        nd.thu_tu AS thuTu,
        nd.trang_thai_duyet AS trangThaiDuyet,
        nd.ngay_tao AS ngayTao
      FROM dbo.noi_dung_khoa_hoc nd
      WHERE nd.ma_chuong = @ChapterId
      ORDER BY nd.thu_tu ASC, nd.ngay_tao ASC;
    `);

    return {
      ...chapter,
      canManage: Boolean(chapter.canManage),
      thuTu: Number(chapter.thuTu),
      contents: contentsRes.recordset.map((item) => ({
        ...item,
        thuTu: Number(item.thuTu),
        thoiLuongPhut: item.thoiLuongPhut != null ? Number(item.thoiLuongPhut) : null,
      })),
    };
  });
}

/**
 * Tạo mới một chương học.
 * Chỉ người tạo khóa học mới có quyền tạo chương.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @param {object} payload - { tenChuong, moTa, thuTu }
 * @returns {Promise<object>}
 */
export async function createChapter(teacherId, courseId, payload = {}) {
  if (!courseId || typeof courseId !== 'string') {
    const err = new Error('Mã khóa học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tenChuong, moTa, thuTu } = payload;

  if (!tenChuong || typeof tenChuong !== 'string' || !tenChuong.trim()) {
    const err = new Error('Tên chương học không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (tenChuong.trim().length > 200) {
    const err = new Error('Tên chương học không được vượt quá 200 ký tự.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('CourseId', sql.UniqueIdentifier, courseId);

    // Kiểm tra khóa học và quyền tạo
    const courseRes = await request.query(`
      SELECT id, nguoi_tao_id
      FROM dbo.khoa_hoc
      WHERE id = @CourseId;
    `);

    const course = courseRes.recordset[0];
    if (!course) {
      const err = new Error('Không tìm thấy thông tin khóa học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (course.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền tạo chương học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Xác định thứ tự hiển thị
    let finalThuTu = 1;
    if (thuTu !== undefined && thuTu !== null && !isNaN(parseInt(thuTu, 10))) {
      finalThuTu = parseInt(thuTu, 10);
      if (finalThuTu <= 0) {
        const err = new Error('Thứ tự chương học phải lớn hơn 0.');
        err.statusCode = 400;
        err.isSafeMessage = true;
        throw err;
      }
    } else {
      const maxRes = await request.query(`
        SELECT COALESCE(MAX(thu_tu), 0) + 1 AS nextThuTu
        FROM dbo.chuong_khoa_hoc
        WHERE ma_khoa_hoc = @CourseId;
      `);
      finalThuTu = Number(maxRes.recordset[0]?.nextThuTu || 1);
    }

    request
      .input('TenChuong', sql.NVarChar(200), tenChuong.trim())
      .input('MoTa', sql.NVarChar(sql.MAX), moTa ? String(moTa).trim() : null)
      .input('ThuTu', sql.Int, finalThuTu);

    const insertRes = await request.query(`
      INSERT INTO dbo.chuong_khoa_hoc (ma_khoa_hoc, ten_chuong, mo_ta, thu_tu)
      OUTPUT 
        inserted.ma_chuong AS maChuong,
        inserted.ma_khoa_hoc AS maKhoaHoc,
        inserted.ten_chuong AS tenChuong,
        inserted.mo_ta AS moTa,
        inserted.thu_tu AS thuTu,
        inserted.ngay_tao AS ngayTao,
        inserted.ngay_cap_nhat AS ngayCapNhat
      VALUES (@CourseId, @TenChuong, @MoTa, @ThuTu);
    `);

    const created = insertRes.recordset[0];
    return {
      ...created,
      thuTu: Number(created.thuTu),
      soNoiDung: 0,
    };
  });
}

/**
 * Cập nhật thông tin chương học.
 * Chỉ người tạo khóa học mới có quyền cập nhật.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @param {string} chapterId - UUID của chương học
 * @param {object} payload - { tenChuong, moTa, thuTu }
 * @returns {Promise<object>}
 */
export async function updateChapter(teacherId, courseId, chapterId, payload = {}) {
  if (!courseId || typeof courseId !== 'string') {
    const err = new Error('Mã khóa học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }
  if (!chapterId || typeof chapterId !== 'string') {
    const err = new Error('Mã chương học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tenChuong, moTa, thuTu } = payload;

  if (tenChuong !== undefined) {
    if (typeof tenChuong !== 'string' || !tenChuong.trim()) {
      const err = new Error('Tên chương học không được để trống.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    if (tenChuong.trim().length > 200) {
      const err = new Error('Tên chương học không được vượt quá 200 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  if (thuTu !== undefined) {
    const parsedThuTu = parseInt(thuTu, 10);
    if (isNaN(parsedThuTu) || parsedThuTu <= 0) {
      const err = new Error('Thứ tự chương học phải lớn hơn 0.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('CourseId', sql.UniqueIdentifier, courseId)
      .input('ChapterId', sql.UniqueIdentifier, chapterId);

    // Kiểm tra khóa học và quyền
    const courseRes = await request.query(`
      SELECT id, nguoi_tao_id
      FROM dbo.khoa_hoc
      WHERE id = @CourseId;
    `);

    const course = courseRes.recordset[0];
    if (!course) {
      const err = new Error('Không tìm thấy thông tin khóa học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (course.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền chỉnh sửa chương học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Kiểm tra chương học tồn tại trong khóa học
    const chapterRes = await request.query(`
      SELECT ma_chuong, ten_chuong, mo_ta, thu_tu
      FROM dbo.chuong_khoa_hoc
      WHERE ma_chuong = @ChapterId AND ma_khoa_hoc = @CourseId;
    `);

    const currentChapter = chapterRes.recordset[0];
    if (!currentChapter) {
      const err = new Error('Không tìm thấy chương học trong khóa học này.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    const updatedTenChuong = tenChuong !== undefined ? tenChuong.trim() : currentChapter.ten_chuong;
    const updatedMoTa = moTa !== undefined ? (moTa ? String(moTa).trim() : null) : currentChapter.mo_ta;
    const updatedThuTu = thuTu !== undefined ? parseInt(thuTu, 10) : currentChapter.thu_tu;

    request
      .input('TenChuong', sql.NVarChar(200), updatedTenChuong)
      .input('MoTa', sql.NVarChar(sql.MAX), updatedMoTa)
      .input('ThuTu', sql.Int, updatedThuTu);

    const updateRes = await request.query(`
      UPDATE dbo.chuong_khoa_hoc
      SET 
        ten_chuong = @TenChuong,
        mo_ta = @MoTa,
        thu_tu = @ThuTu,
        ngay_cap_nhat = SYSDATETIME()
      WHERE ma_chuong = @ChapterId AND ma_khoa_hoc = @CourseId;

      SELECT 
        ma_chuong AS maChuong,
        ma_khoa_hoc AS maKhoaHoc,
        ten_chuong AS tenChuong,
        mo_ta AS moTa,
        thu_tu AS thuTu,
        ngay_tao AS ngayTao,
        ngay_cap_nhat AS ngayCapNhat
      FROM dbo.chuong_khoa_hoc
      WHERE ma_chuong = @ChapterId;
    `);

    const updated = updateRes.recordset[0];
    return {
      ...updated,
      thuTu: Number(updated.thuTu),
    };
  });
}

/**
 * Xóa chương học.
 * Kiểm tra ràng buộc tiến độ học tập: Nếu có nội dung trong chương đã có học viên học -> Trả HTTP 409.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @param {string} chapterId - UUID của chương học
 * @returns {Promise<{message: string}>}
 */
export async function deleteChapter(teacherId, courseId, chapterId) {
  if (!courseId || typeof courseId !== 'string') {
    const err = new Error('Mã khóa học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }
  if (!chapterId || typeof chapterId !== 'string') {
    const err = new Error('Mã chương học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('CourseId', sql.UniqueIdentifier, courseId)
      .input('ChapterId', sql.UniqueIdentifier, chapterId);

    // Kiểm tra khóa học và quyền
    const courseRes = await request.query(`
      SELECT id, nguoi_tao_id
      FROM dbo.khoa_hoc
      WHERE id = @CourseId;
    `);

    const course = courseRes.recordset[0];
    if (!course) {
      const err = new Error('Không tìm thấy thông tin khóa học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (course.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền xóa chương học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Kiểm tra chương học tồn tại trong khóa học
    const chapterRes = await request.query(`
      SELECT ma_chuong
      FROM dbo.chuong_khoa_hoc
      WHERE ma_chuong = @ChapterId AND ma_khoa_hoc = @CourseId;
    `);

    if (!chapterRes.recordset[0]) {
      const err = new Error('Không tìm thấy chương học trong khóa học này.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    // Kiểm tra tiến độ học tập của các nội dung con trong chương
    const progressRes = await request.query(`
      SELECT COUNT(*) AS progressCount
      FROM dbo.tien_do_hoc tdh
      INNER JOIN dbo.noi_dung_khoa_hoc nd ON tdh.ma_noi_dung = nd.ma_noi_dung
      WHERE nd.ma_chuong = @ChapterId;
    `);

    const progressCount = Number(progressRes.recordset[0]?.progressCount || 0);
    if (progressCount > 0) {
      const err = new Error('Không thể xóa chương học có nội dung đã có học viên ghi nhận tiến độ học tập.');
      err.statusCode = 409;
      err.isSafeMessage = true;
      throw err;
    }

    // Thực hiện xóa (CASCADE xóa noi_dung_khoa_hoc tương ứng)
    await request.query(`
      DELETE FROM dbo.chuong_khoa_hoc
      WHERE ma_chuong = @ChapterId AND ma_khoa_hoc = @CourseId;
    `);

    return { message: 'Xóa chương học thành công.' };
  });
}
