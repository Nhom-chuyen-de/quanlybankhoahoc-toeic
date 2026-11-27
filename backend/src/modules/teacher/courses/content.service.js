/**
 * @file content.service.js
 * @description Nghiệp vụ quản lý nội dung bài học cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

const ALLOWED_CONTENT_TYPES = ['bai doc', 'video', 'tai lieu', 'am thanh', 'bai tap'];

/**
 * Lấy danh sách nội dung bài học của một chương.
 * Giảng viên có quyền xem nếu là người tạo khóa học hoặc phụ trách lớp của khóa học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} chapterId - UUID của chương học
 * @returns {Promise<Array>}
 */
export async function getContents(teacherId, chapterId) {
  if (!chapterId || typeof chapterId !== 'string') {
    const err = new Error('Mã chương học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ChapterId', sql.UniqueIdentifier, chapterId);

    // Kiểm tra chương học và quyền xem
    const checkRes = await request.query(`
      SELECT 
        ckh.ma_chuong,
        ckh.ma_khoa_hoc,
        kh.nguoi_tao_id,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS isOwner,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        ) THEN 1 ELSE 0 END AS isAssignedClass
      FROM dbo.chuong_khoa_hoc ckh
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE ckh.ma_chuong = @ChapterId;
    `);

    const chapter = checkRes.recordset[0];
    if (!chapter) {
      const err = new Error('Không tìm thấy thông tin chương học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (!chapter.isOwner && !chapter.isAssignedClass) {
      const err = new Error('Bạn không có quyền xem nội dung của chương học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const listRes = await request.query(`
      SELECT 
        nd.ma_noi_dung AS maNoiDung,
        nd.ma_chuong AS maChuong,
        nd.tieu_de AS tieuDe,
        nd.loai_noi_dung AS loaiNoiDung,
        nd.noi_dung AS noiDung,
        nd.duong_dan_video AS duongDanVideo,
        nd.tai_lieu_dinh_kem AS taiLieuDinhKem,
        nd.thoi_luong_phut AS thoiLuongPhut,
        nd.thu_tu AS thuTu,
        nd.trang_thai_duyet AS trangThaiDuyet,
        nd.ly_do_tu_choi AS lyDoTuChoi,
        nd.ma_admin_duyet AS maAdminDuyet,
        nd.ngay_duyet AS ngayDuyet,
        nd.ngay_tao AS ngayTao
      FROM dbo.noi_dung_khoa_hoc nd
      WHERE nd.ma_chuong = @ChapterId
      ORDER BY nd.thu_tu ASC, nd.ngay_tao ASC;
    `);

    return listRes.recordset.map((item) => ({
      ...item,
      thuTu: Number(item.thuTu),
      thoiLuongPhut: item.thoiLuongPhut != null ? Number(item.thoiLuongPhut) : null,
    }));
  });
}

/**
 * Xem chi tiết một nội dung bài học.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} contentId - UUID của nội dung bài học
 * @returns {Promise<object>}
 */
export async function getContentDetail(teacherId, contentId) {
  if (!contentId || typeof contentId !== 'string') {
    const err = new Error('Mã nội dung bài học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ContentId', sql.UniqueIdentifier, contentId);

    const detailRes = await request.query(`
      SELECT 
        nd.ma_noi_dung AS maNoiDung,
        nd.ma_chuong AS maChuong,
        ckh.ten_chuong AS tenChuong,
        ckh.ma_khoa_hoc AS maKhoaHoc,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        kh.nguoi_tao_id AS nguoiTaoId,
        nd.tieu_de AS tieuDe,
        nd.loai_noi_dung AS loaiNoiDung,
        nd.noi_dung AS noiDung,
        nd.duong_dan_video AS duongDanVideo,
        nd.tai_lieu_dinh_kem AS taiLieuDinhKem,
        nd.thoi_luong_phut AS thoiLuongPhut,
        nd.thu_tu AS thuTu,
        nd.trang_thai_duyet AS trangThaiDuyet,
        nd.ly_do_tu_choi AS lyDoTuChoi,
        nd.ma_admin_duyet AS maAdminDuyet,
        nd.ngay_duyet AS ngayDuyet,
        nd.ngay_tao AS ngayTao,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS canManage,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        ) THEN 1 ELSE 0 END AS isAssignedClass
      FROM dbo.noi_dung_khoa_hoc nd
      INNER JOIN dbo.chuong_khoa_hoc ckh ON nd.ma_chuong = ckh.ma_chuong
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE nd.ma_noi_dung = @ContentId;
    `);

    const content = detailRes.recordset[0];
    if (!content) {
      const err = new Error('Không tìm thấy nội dung bài học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (!content.canManage && !content.isAssignedClass) {
      const err = new Error('Bạn không có quyền xem nội dung bài học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    return {
      ...content,
      canManage: Boolean(content.canManage),
      isAssignedClass: Boolean(content.isAssignedClass),
      thuTu: Number(content.thuTu),
      thoiLuongPhut: content.thoiLuongPhut != null ? Number(content.thoiLuongPhut) : null,
    };
  });
}

/**
 * Tạo mới nội dung bài học trong chương.
 * Chỉ người tạo khóa học mới có quyền tạo.
 * Trạng thái duyệt khởi tạo LUÔN LUÔN là 'cho duyet'.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} chapterId - UUID của chương học
 * @param {object} payload - Dữ liệu bài học
 * @returns {Promise<object>}
 */
export async function createContent(teacherId, chapterId, payload = {}) {
  if (!chapterId || typeof chapterId !== 'string') {
    const err = new Error('Mã chương học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tieuDe, loaiNoiDung, noiDung, duongDanVideo, taiLieuDinhKem, thoiLuongPhut, thuTu } = payload;

  if (!tieuDe || typeof tieuDe !== 'string' || !tieuDe.trim()) {
    const err = new Error('Tiêu đề bài học không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }
  if (tieuDe.trim().length > 250) {
    const err = new Error('Tiêu đề bài học không được vượt quá 250 ký tự.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (!loaiNoiDung || !ALLOWED_CONTENT_TYPES.includes(loaiNoiDung)) {
    const err = new Error(`Loại nội dung không hợp lệ. Cho phép: ${ALLOWED_CONTENT_TYPES.join(', ')}.`);
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  let parsedThoiLuong = null;
  if (thoiLuongPhut !== undefined && thoiLuongPhut !== null) {
    parsedThoiLuong = parseInt(thoiLuongPhut, 10);
    if (isNaN(parsedThoiLuong) || parsedThoiLuong < 0) {
      const err = new Error('Thời lượng học (phút) phải là số không âm.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ChapterId', sql.UniqueIdentifier, chapterId);

    // Kiểm tra chương học và quyền tạo
    const chapterRes = await request.query(`
      SELECT ckh.ma_chuong, ckh.ma_khoa_hoc, kh.nguoi_tao_id
      FROM dbo.chuong_khoa_hoc ckh
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE ckh.ma_chuong = @ChapterId;
    `);

    const chapter = chapterRes.recordset[0];
    if (!chapter) {
      const err = new Error('Không tìm thấy thông tin chương học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (chapter.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền tạo nội dung bài học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Thứ tự hiển thị
    let finalThuTu = 1;
    if (thuTu !== undefined && thuTu !== null && !isNaN(parseInt(thuTu, 10))) {
      finalThuTu = parseInt(thuTu, 10);
      if (finalThuTu <= 0) {
        const err = new Error('Thứ tự bài học phải lớn hơn 0.');
        err.statusCode = 400;
        err.isSafeMessage = true;
        throw err;
      }
    } else {
      const maxRes = await request.query(`
        SELECT COALESCE(MAX(thu_tu), 0) + 1 AS nextThuTu
        FROM dbo.noi_dung_khoa_hoc
        WHERE ma_chuong = @ChapterId;
      `);
      finalThuTu = Number(maxRes.recordset[0]?.nextThuTu || 1);
    }

    request
      .input('TieuDe', sql.NVarChar(250), tieuDe.trim())
      .input('LoaiNoiDung', sql.NVarChar(30), loaiNoiDung)
      .input('NoiDung', sql.NVarChar(sql.MAX), noiDung ? String(noiDung) : null)
      .input('DuongDanVideo', sql.NVarChar(1000), duongDanVideo ? String(duongDanVideo).trim() : null)
      .input('TaiLieuDinhKem', sql.NVarChar(1000), taiLieuDinhKem ? String(taiLieuDinhKem).trim() : null)
      .input('ThoiLuongPhut', sql.Int, parsedThoiLuong)
      .input('ThuTu', sql.Int, finalThuTu);

    const insertRes = await request.query(`
      INSERT INTO dbo.noi_dung_khoa_hoc (
        ma_chuong,
        tieu_de,
        loai_noi_dung,
        noi_dung,
        duong_dan_video,
        tai_lieu_dinh_kem,
        thoi_luong_phut,
        thu_tu,
        trang_thai_duyet
      )
      OUTPUT 
        inserted.ma_noi_dung AS maNoiDung,
        inserted.ma_chuong AS maChuong,
        inserted.tieu_de AS tieuDe,
        inserted.loai_noi_dung AS loaiNoiDung,
        inserted.noi_dung AS noiDung,
        inserted.duong_dan_video AS duongDanVideo,
        inserted.tai_lieu_dinh_kem AS taiLieuDinhKem,
        inserted.thoi_luong_phut AS thoiLuongPhut,
        inserted.thu_tu AS thuTu,
        inserted.trang_thai_duyet AS trangThaiDuyet,
        inserted.ly_do_tu_choi AS lyDoTuChoi,
        inserted.ngay_tao AS ngayTao
      VALUES (
        @ChapterId,
        @TieuDe,
        @LoaiNoiDung,
        @NoiDung,
        @DuongDanVideo,
        @TaiLieuDinhKem,
        @ThoiLuongPhut,
        @ThuTu,
        N'cho duyet'
      );
    `);

    const created = insertRes.recordset[0];
    return {
      ...created,
      thuTu: Number(created.thuTu),
      thoiLuongPhut: created.thoiLuongPhut != null ? Number(created.thoiLuongPhut) : null,
    };
  });
}

/**
 * Cập nhật nội dung bài học.
 * Chỉ người tạo khóa học mới có quyền chỉnh sửa.
 * Quy tắc: Nếu bài học đã 'da duyet' và sửa nội dung cốt lõi, tự động chuyển về 'cho duyet'.
 * Nếu chỉ sửa thứ tự (thuTu), giữ nguyên trạng thái duyệt.
 * Không cho phép client tự gắn trạng thái 'da duyet'.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} contentId - UUID của nội dung bài học
 * @param {object} payload - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function updateContent(teacherId, contentId, payload = {}) {
  if (!contentId || typeof contentId !== 'string') {
    const err = new Error('Mã nội dung bài học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { tieuDe, loaiNoiDung, noiDung, duongDanVideo, taiLieuDinhKem, thoiLuongPhut, thuTu } = payload;

  if (tieuDe !== undefined) {
    if (typeof tieuDe !== 'string' || !tieuDe.trim()) {
      const err = new Error('Tiêu đề bài học không được để trống.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    if (tieuDe.trim().length > 250) {
      const err = new Error('Tiêu đề bài học không được vượt quá 250 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  if (loaiNoiDung !== undefined) {
    if (!ALLOWED_CONTENT_TYPES.includes(loaiNoiDung)) {
      const err = new Error(`Loại nội dung không hợp lệ. Cho phép: ${ALLOWED_CONTENT_TYPES.join(', ')}.`);
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  if (thoiLuongPhut !== undefined && thoiLuongPhut !== null) {
    const parsed = parseInt(thoiLuongPhut, 10);
    if (isNaN(parsed) || parsed < 0) {
      const err = new Error('Thời lượng học (phút) phải là số không âm.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  if (thuTu !== undefined) {
    const parsedThuTu = parseInt(thuTu, 10);
    if (isNaN(parsedThuTu) || parsedThuTu <= 0) {
      const err = new Error('Thứ tự bài học phải lớn hơn 0.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ContentId', sql.UniqueIdentifier, contentId);

    // Lấy nội dung hiện tại và kiểm tra quyền
    const contentRes = await request.query(`
      SELECT 
        nd.ma_noi_dung,
        nd.ma_chuong,
        nd.tieu_de,
        nd.loai_noi_dung,
        nd.noi_dung,
        nd.duong_dan_video,
        nd.tai_lieu_dinh_kem,
        nd.thoi_luong_phut,
        nd.thu_tu,
        nd.trang_thai_duyet,
        ckh.ma_khoa_hoc,
        kh.nguoi_tao_id
      FROM dbo.noi_dung_khoa_hoc nd
      INNER JOIN dbo.chuong_khoa_hoc ckh ON nd.ma_chuong = ckh.ma_chuong
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE nd.ma_noi_dung = @ContentId;
    `);

    const current = contentRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy nội dung bài học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền chỉnh sửa nội dung bài học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    const updatedTieuDe = tieuDe !== undefined ? tieuDe.trim() : current.tieu_de;
    const updatedLoaiNoiDung = loaiNoiDung !== undefined ? loaiNoiDung : current.loai_noi_dung;
    const updatedNoiDung = noiDung !== undefined ? (noiDung ? String(noiDung) : null) : current.noi_dung;
    const updatedDuongDanVideo = duongDanVideo !== undefined ? (duongDanVideo ? String(duongDanVideo).trim() : null) : current.duong_dan_video;
    const updatedTaiLieuDinhKem = taiLieuDinhKem !== undefined ? (taiLieuDinhKem ? String(taiLieuDinhKem).trim() : null) : current.tai_lieu_dinh_kem;
    const updatedThoiLuongPhut = thoiLuongPhut !== undefined ? (thoiLuongPhut !== null ? parseInt(thoiLuongPhut, 10) : null) : current.thoi_luong_phut;
    const updatedThuTu = thuTu !== undefined ? parseInt(thuTu, 10) : current.thu_tu;

    // Kiểm tra xem có thay đổi nội dung cốt lõi không
    const hasCoreContentChanged =
      tieuDe !== undefined && updatedTieuDe !== current.tieu_de ||
      loaiNoiDung !== undefined && updatedLoaiNoiDung !== current.loai_noi_dung ||
      noiDung !== undefined && updatedNoiDung !== current.noi_dung ||
      duongDanVideo !== undefined && updatedDuongDanVideo !== current.duong_dan_video ||
      taiLieuDinhKem !== undefined && updatedTaiLieuDinhKem !== current.tai_lieu_dinh_kem ||
      thoiLuongPhut !== undefined && updatedThoiLuongPhut !== current.thoi_luong_phut;

    let finalTrangThaiDuyet = current.trang_thai_duyet;
    let resetApproval = false;

    if (current.trang_thai_duyet === 'da duyet' && hasCoreContentChanged) {
      finalTrangThaiDuyet = 'cho duyet';
      resetApproval = true;
    }

    request
      .input('TieuDe', sql.NVarChar(250), updatedTieuDe)
      .input('LoaiNoiDung', sql.NVarChar(30), updatedLoaiNoiDung)
      .input('NoiDung', sql.NVarChar(sql.MAX), updatedNoiDung)
      .input('DuongDanVideo', sql.NVarChar(1000), updatedDuongDanVideo)
      .input('TaiLieuDinhKem', sql.NVarChar(1000), updatedTaiLieuDinhKem)
      .input('ThoiLuongPhut', sql.Int, updatedThoiLuongPhut)
      .input('ThuTu', sql.Int, updatedThuTu)
      .input('TrangThaiDuyet', sql.NVarChar(20), finalTrangThaiDuyet)
      .input('ResetApproval', sql.Bit, resetApproval ? 1 : 0);

    const updateRes = await request.query(`
      UPDATE dbo.noi_dung_khoa_hoc
      SET 
        tieu_de = @TieuDe,
        loai_noi_dung = @LoaiNoiDung,
        noi_dung = @NoiDung,
        duong_dan_video = @DuongDanVideo,
        tai_lieu_dinh_kem = @TaiLieuDinhKem,
        thoi_luong_phut = @ThoiLuongPhut,
        thu_tu = @ThuTu,
        trang_thai_duyet = @TrangThaiDuyet,
        ma_admin_duyet = CASE WHEN @ResetApproval = 1 THEN NULL ELSE ma_admin_duyet END,
        ngay_duyet = CASE WHEN @ResetApproval = 1 THEN NULL ELSE ngay_duyet END
      OUTPUT 
        inserted.ma_noi_dung AS maNoiDung,
        inserted.ma_chuong AS maChuong,
        inserted.tieu_de AS tieuDe,
        inserted.loai_noi_dung AS loaiNoiDung,
        inserted.noi_dung AS noiDung,
        inserted.duong_dan_video AS duongDanVideo,
        inserted.tai_lieu_dinh_kem AS taiLieuDinhKem,
        inserted.thoi_luong_phut AS thoiLuongPhut,
        inserted.thu_tu AS thuTu,
        inserted.trang_thai_duyet AS trangThaiDuyet,
        inserted.ly_do_tu_choi AS lyDoTuChoi,
        inserted.ma_admin_duyet AS maAdminDuyet,
        inserted.ngay_duyet AS ngayDuyet,
        inserted.ngay_tao AS ngayTao
      WHERE ma_noi_dung = @ContentId;
    `);

    const updated = updateRes.recordset[0];
    return {
      ...updated,
      thuTu: Number(updated.thuTu),
      thoiLuongPhut: updated.thoiLuongPhut != null ? Number(updated.thoiLuongPhut) : null,
    };
  });
}

/**
 * Xóa nội dung bài học.
 * Kiểm tra ràng buộc tiến độ học tập: Nếu có bản ghi trong dbo.tien_do_hoc -> Trả HTTP 409.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} contentId - UUID của nội dung bài học
 * @returns {Promise<{message: string}>}
 */
export async function deleteContent(teacherId, contentId) {
  if (!contentId || typeof contentId !== 'string') {
    const err = new Error('Mã nội dung bài học không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('ContentId', sql.UniqueIdentifier, contentId);

    // Lấy thông tin bài học và quyền
    const contentRes = await request.query(`
      SELECT 
        nd.ma_noi_dung,
        ckh.ma_khoa_hoc,
        kh.nguoi_tao_id
      FROM dbo.noi_dung_khoa_hoc nd
      INNER JOIN dbo.chuong_khoa_hoc ckh ON nd.ma_chuong = ckh.ma_chuong
      INNER JOIN dbo.khoa_hoc kh ON ckh.ma_khoa_hoc = kh.id
      WHERE nd.ma_noi_dung = @ContentId;
    `);

    const current = contentRes.recordset[0];
    if (!current) {
      const err = new Error('Không tìm thấy nội dung bài học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (current.nguoi_tao_id !== teacherId) {
      const err = new Error('Chỉ người tạo khóa học mới có quyền xóa nội dung bài học.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Kiểm tra tiến độ học tập
    const progressRes = await request.query(`
      SELECT COUNT(*) AS progressCount
      FROM dbo.tien_do_hoc
      WHERE ma_noi_dung = @ContentId;
    `);

    const progressCount = Number(progressRes.recordset[0]?.progressCount || 0);
    if (progressCount > 0) {
      const err = new Error('Không thể xóa nội dung đã có học viên ghi nhận tiến độ học tập.');
      err.statusCode = 409;
      err.isSafeMessage = true;
      throw err;
    }

    // Xóa nội dung
    await request.query(`
      DELETE FROM dbo.noi_dung_khoa_hoc
      WHERE ma_noi_dung = @ContentId;
    `);

    return { message: 'Xóa nội dung bài học thành công.' };
  });
}
