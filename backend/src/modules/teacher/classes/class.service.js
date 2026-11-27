/**
 * @file class.service.js
 * @description Nghiệp vụ quản lý lớp học cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

/**
 * Lấy danh sách lớp học do giảng viên phụ trách.
 * Hỗ trợ lọc theo từ khóa tên lớp (q), khóa học (khoaHocId), trạng thái (trangThai), phân trang.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} options - Bộ lọc và phân trang
 * @returns {Promise<{classes: Array, pagination: object}>}
 */
export async function getTeacherClasses(teacherId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { q, khoaHocId, trangThai } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    let whereClause = `WHERE lh.giao_vien_id = @TeacherId`;

    if (q && typeof q === 'string' && q.trim()) {
      const escapedQ = q.trim().replace(/\[/g, '[[]').replace(/%/g, '[%]').replace(/_/g, '[_]');
      request.input('SearchQuery', sql.NVarChar(100), `%${escapedQ}%`);
      whereClause += ` AND lh.ten_lop LIKE @SearchQuery`;
    }

    if (khoaHocId && typeof khoaHocId === 'string' && khoaHocId.trim()) {
      request.input('KhoaHocId', sql.UniqueIdentifier, khoaHocId.trim());
      whereClause += ` AND lh.khoa_hoc_id = @KhoaHocId`;
    }

    if (trangThai && typeof trangThai === 'string' && trangThai.trim()) {
      request.input('TrangThai', sql.NVarChar(20), trangThai.trim());
      whereClause += ` AND lh.trang_thai = @TrangThai`;
    }

    // 1. Đếm tổng số lớp
    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.lop_hoc lh
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    // 2. Lấy dữ liệu phân trang
    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        lh.id,
        lh.ten_lop AS tenLop,
        lh.khoa_hoc_id AS khoaHocId,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        kh.trinh_do AS trinhDoKhoaHoc,
        lh.si_so_toi_da AS siSoToiDa,
        lh.ngay_bat_dau AS ngayBatDau,
        lh.ngay_ket_thuc AS ngayKetThuc,
        lh.trang_thai AS trangThai,
        lh.ngay_tao AS ngayTao,
        lh.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id = lh.id AND gd.trang_thai = N'dang hoc') AS siSoHienTai,
        (SELECT COUNT(*) FROM dbo.lich_hoc lich WHERE lich.lop_hoc_id = lh.id) AS soBuoiHoc,
        (SELECT COUNT(*) FROM dbo.bai_tap bt WHERE bt.lop_hoc_id = lh.id) AS soBaiTap
      FROM dbo.lop_hoc lh
      INNER JOIN dbo.khoa_hoc kh ON lh.khoa_hoc_id = kh.id
      ${whereClause}
      ORDER BY lh.ngay_tao DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    const classes = listRes.recordset.map((item) => ({
      ...item,
      siSoToiDa: Number(item.siSoToiDa || 0),
      siSoHienTai: Number(item.siSoHienTai || 0),
      soBuoiHoc: Number(item.soBuoiHoc || 0),
      soBaiTap: Number(item.soBaiTap || 0),
    }));

    return {
      classes,
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
 * Lấy chi tiết lớp học do giảng viên phụ trách.
 * Bảo vệ: Chỉ cho phép giảng viên được phân công lớp truy cập.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} classId - UUID của lớp học
 * @returns {Promise<object>}
 */
export async function getTeacherClassDetail(teacherId, classId) {
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

    const detailRes = await request.query(`
      SELECT 
        lh.id,
        lh.ten_lop AS tenLop,
        lh.khoa_hoc_id AS khoaHocId,
        kh.ten_khoa_hoc AS tenKhoaHoc,
        kh.trinh_do AS trinhDoKhoaHoc,
        kh.mo_ta AS moTaKhoaHoc,
        lh.giao_vien_id AS giaoVienId,
        lh.si_so_toi_da AS siSoToiDa,
        lh.ngay_bat_dau AS ngayBatDau,
        lh.ngay_ket_thuc AS ngayKetThuc,
        lh.trang_thai AS trangThai,
        lh.ngay_tao AS ngayTao,
        lh.ngay_cap_nhat AS ngayCapNhat,
        (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id = lh.id AND gd.trang_thai = N'dang hoc') AS siSoHienTai,
        (SELECT COUNT(*) FROM dbo.lich_hoc lich WHERE lich.lop_hoc_id = lh.id) AS soBuoiHoc,
        (SELECT COUNT(*) FROM dbo.bai_tap bt WHERE bt.lop_hoc_id = lh.id) AS soBaiTap
      FROM dbo.lop_hoc lh
      INNER JOIN dbo.khoa_hoc kh ON lh.khoa_hoc_id = kh.id
      WHERE lh.id = @ClassId;
    `);

    const classData = detailRes.recordset[0];
    if (!classData) {
      const err = new Error('Không tìm thấy thông tin lớp học.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (classData.giaoVienId !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập lớp học này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    return {
      ...classData,
      siSoToiDa: Number(classData.siSoToiDa || 0),
      siSoHienTai: Number(classData.siSoHienTai || 0),
      soBuoiHoc: Number(classData.soBuoiHoc || 0),
      soBaiTap: Number(classData.soBaiTap || 0),
    };
  });
}
