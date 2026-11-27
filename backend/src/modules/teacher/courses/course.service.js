/**
 * @file course.service.js
 * @description Nghiệp vụ quản lý khóa học cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách khóa học mà giảng viên được phép xem (là người tạo hoặc phụ trách lớp).
 * Hỗ trợ lọc theo từ khóa (q), danh mục (danhMucId), trạng thái (trangThai), vai trò (role: 'owner' | 'teacher'), phân trang (page, limit).
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} options - Bộ lọc và phân trang
 * @returns {Promise<{courses: Array, pagination: object}>}
 */
export async function getCourses(teacherId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { q, danhMucId, trangThai, role } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    // Xây dựng điều kiện lọc an toàn
    let whereClause = `
      WHERE (
        kh.nguoi_tao_id = @TeacherId
        OR EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh 
          WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        )
      )
    `;

    if (role === 'owner') {
      whereClause += ` AND kh.nguoi_tao_id = @TeacherId`;
    } else if (role === 'teacher') {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM dbo.lop_hoc lh 
        WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
      )`;
    }

    if (q && typeof q === 'string' && q.trim()) {
      const escapedQ = q.trim().replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
      request.input('SearchQuery', sql.NVarChar(200), `%${escapedQ}%`);
      whereClause += ` AND kh.ten_khoa_hoc LIKE @SearchQuery`;
    }

    if (danhMucId && typeof danhMucId === 'string' && danhMucId.trim()) {
      request.input('DanhMucId', sql.UniqueIdentifier, danhMucId.trim());
      whereClause += ` AND kh.danh_muc_id = @DanhMucId`;
    }

    if (trangThai && typeof trangThai === 'string' && trangThai.trim()) {
      request.input('TrangThai', sql.NVarChar(20), trangThai.trim());
      whereClause += ` AND kh.trang_thai = @TrangThai`;
    }

    // 1. Đếm tổng số bản ghi phù hợp
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM dbo.khoa_hoc kh
      ${whereClause};
    `;
    const countRes = await request.query(countQuery);
    const total = Number(countRes.recordset[0]?.total || 0);

    // 2. Lấy dữ liệu phân trang
    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listQuery = `
      SELECT 
        kh.id,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        kh.danh_muc_id AS danhMucId,
        dm.ten_danh_muc AS tenDanhMuc,
        kh.mo_ta AS moTa,
        kh.trinh_do AS trinhDo,
        kh.trang_thai AS trangThai,
        kh.loai_ky_thi AS loaiKyThi,
        kh.gia AS gia,
        kh.anh_dai_dien AS anhDaiDien,
        kh.hien_thi AS hienThi,
        kh.trang_thai_duyet AS trangThaiDuyet,
        kh.nguoi_tao_id AS nguoiTaoId,
        kh.ngay_tao AS ngayTao,
        kh.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.chuong_khoa_hoc c WHERE c.ma_khoa_hoc = kh.id) AS soChuong,
        (SELECT COUNT(DISTINCT dk.ma_hoc_vien) FROM dbo.dang_ky_khoa_hoc dk WHERE dk.ma_khoa_hoc = kh.id) AS soHocVien,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS isOwner,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS canManage
      FROM dbo.khoa_hoc kh
      LEFT JOIN dbo.danh_muc_khoa_hoc dm ON kh.danh_muc_id = dm.id
      ${whereClause}
      ORDER BY kh.ngay_tao DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const listRes = await request.query(listQuery);

    const courses = listRes.recordset.map((c) => ({
      ...c,
      isOwner: Boolean(c.isOwner),
      canManage: Boolean(c.canManage),
      hienThi: Boolean(c.hienThi),
      soChuong: Number(c.soChuong || 0),
      soHocVien: Number(c.soHocVien || 0),
      gia: c.gia != null ? Number(c.gia) : null,
    }));

    return {
      courses,
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
 * Xem chi tiết khóa học.
 * Kiểm tra quyền: Chỉ cho phép nếu giảng viên là người tạo hoặc đang phụ trách lớp thuộc khóa này.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} courseId - UUID của khóa học
 * @returns {Promise<object>}
 */
export async function getCourseDetail(teacherId, courseId) {
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

    const detailRes = await request.query(`
      SELECT 
        kh.id,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        kh.danh_muc_id AS danhMucId,
        dm.ten_danh_muc AS tenDanhMuc,
        kh.mo_ta AS moTa,
        kh.trinh_do AS trinhDo,
        kh.trang_thai AS trangThai,
        kh.loai_ky_thi AS loaiKyThi,
        kh.gia AS gia,
        kh.anh_dai_dien AS anhDaiDien,
        kh.trinh_do_dau_vao AS trinhDoDauVao,
        kh.diem_muc_tieu AS diemMucTieu,
        kh.hinh_thuc AS hinhThuc,
        kh.thoi_luong_gio AS thoiLuongGio,
        kh.so_ngay_truy_cap AS soNgayTruyCap,
        kh.hien_thi AS hienThi,
        kh.trang_thai_duyet AS trangThaiDuyet,
        kh.nguoi_tao_id AS nguoiTaoId,
        kh.ngay_tao AS ngayTao,
        kh.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.chuong_khoa_hoc c WHERE c.ma_khoa_hoc = kh.id) AS soChuong,
        (SELECT COUNT(DISTINCT dk.ma_hoc_vien) FROM dbo.dang_ky_khoa_hoc dk WHERE dk.ma_khoa_hoc = kh.id) AS soHocVien,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS isOwner,
        CASE WHEN kh.nguoi_tao_id = @TeacherId THEN 1 ELSE 0 END AS canManage,
        CASE WHEN EXISTS (
          SELECT 1 FROM dbo.lop_hoc lh WHERE lh.khoa_hoc_id = kh.id AND lh.giao_vien_id = @TeacherId
        ) THEN 1 ELSE 0 END AS isAssignedClass
      FROM dbo.khoa_hoc kh
      LEFT JOIN dbo.danh_muc_khoa_hoc dm ON kh.danh_muc_id = dm.id
      WHERE kh.id = @CourseId;
    `);

    const course = detailRes.recordset[0];
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

    // Lấy danh sách các lớp học thuộc khóa này mà giảng viên có liên quan
    // Dùng CASE thay vì input mới để tránh lỗi "duplicate input name" trên cùng request
    const isOwnerBit = course.isOwner ? 1 : 0;
    const classesRes = await request.query(`
      SELECT 
        lh.id AS lopHocId,
        lh.ten_lop AS tenLop,
        lh.trang_thai AS trangThai,
        lh.si_so_toi_da AS siSoToiDa,
        lh.giao_vien_id AS giaoVienId,
        lh.ngay_bat_dau AS ngayBatDau,
        lh.ngay_ket_thuc AS ngayKetThuc,
        (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id = lh.id AND gd.trang_thai = N'dang hoc') AS siSoHienTai
      FROM dbo.lop_hoc lh
      WHERE lh.khoa_hoc_id = @CourseId
        AND (${isOwnerBit} = 1 OR lh.giao_vien_id = @TeacherId)
      ORDER BY lh.ngay_tao DESC;
    `);

    return {
      ...course,
      isOwner: Boolean(course.isOwner),
      canManage: Boolean(course.canManage),
      isAssignedClass: Boolean(course.isAssignedClass),
      hienThi: Boolean(course.hienThi),
      soChuong: Number(course.soChuong || 0),
      soHocVien: Number(course.soHocVien || 0),
      gia: course.gia != null ? Number(course.gia) : null,
      diemMucTieu: course.diemMucTieu != null ? Number(course.diemMucTieu) : null,
      thoiLuongGio: course.thoiLuongGio != null ? Number(course.thoiLuongGio) : null,
      classes: classesRes.recordset.map((cl) => ({
        ...cl,
        siSoToiDa: Number(cl.siSoToiDa || 0),
        siSoHienTai: Number(cl.siSoHienTai || 0),
      })),
    };
  });
}
