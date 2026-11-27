/**
 * @file profile.service.js
 * @description Nghiệp vụ quản lý hồ sơ và đổi mật khẩu cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 * Bảo mật tuyệt đối: Không để lộ hash mật khẩu, không ghi mật khẩu vào log.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';
import { comparePassword, hashPassword } from '../../../utils/password.js';

/**
 * Lấy thông tin hồ sơ của giảng viên.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @returns {Promise<object>}
 */
export async function getTeacherProfile(teacherId) {
  return runInTeacherContext(teacherId, async (request) => {
    const result = await request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .query(`
        SELECT 
          id,
          ho_ten AS hoTen,
          email,
          so_dien_thoai AS soDienThoai,
          anh_dai_dien AS anhDaiDien,
          vai_tro AS vaiTro,
          ngay_tao AS ngayTao
        FROM dbo.nguoi_dung
        WHERE id = @TeacherId;
      `);

    const user = result.recordset[0];
    if (!user) {
      const err = new Error('Không tìm thấy thông tin giảng viên.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    return user;
  });
}

/**
 * Cập nhật thông tin hồ sơ giảng viên.
 * Chỉ cho phép cập nhật: hoTen, soDienThoai, anhDaiDien.
 * Nghiêm cấm cập nhật: email, vaiTro, trangThai, id, mat_khau_hash.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} payload - Dữ liệu cập nhật
 * @returns {Promise<object>}
 */
export async function updateTeacherProfile(teacherId, payload = {}) {
  const { hoTen, soDienThoai, anhDaiDien } = payload;

  const updates = {};

  if (hoTen !== undefined) {
    if (typeof hoTen !== 'string' || hoTen.trim().length < 2 || hoTen.trim().length > 100) {
      const err = new Error('Họ tên phải có độ dài từ 2 đến 100 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    updates.hoTen = hoTen.trim();
  }

  if (soDienThoai !== undefined) {
    if (soDienThoai !== null && (typeof soDienThoai !== 'string' || soDienThoai.trim().length > 20)) {
      const err = new Error('Số điện thoại không được vượt quá 20 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    updates.soDienThoai = soDienThoai ? soDienThoai.trim() : null;
  }

  if (anhDaiDien !== undefined) {
    if (anhDaiDien !== null && (typeof anhDaiDien !== 'string' || anhDaiDien.trim().length > 255)) {
      const err = new Error('Đường dẫn ảnh đại diện không được vượt quá 255 ký tự.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }
    updates.anhDaiDien = anhDaiDien ? anhDaiDien.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('Không có trường thông tin hợp lệ nào để cập nhật (chỉ cho phép: hoTen, soDienThoai, anhDaiDien).');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    const setClauses = [];
    if (updates.hoTen !== undefined) {
      request.input('HoTen', sql.NVarChar(100), updates.hoTen);
      setClauses.push('ho_ten = @HoTen');
    }
    if (updates.soDienThoai !== undefined) {
      request.input('SoDienThoai', sql.NVarChar(20), updates.soDienThoai);
      setClauses.push('so_dien_thoai = @SoDienThoai');
    }
    if (updates.anhDaiDien !== undefined) {
      request.input('AnhDaiDien', sql.NVarChar(255), updates.anhDaiDien);
      setClauses.push('anh_dai_dien = @AnhDaiDien');
    }

    setClauses.push('ngay_cap_nhat = SYSDATETIME()');

    await request.query(`
      UPDATE dbo.nguoi_dung
      SET ${setClauses.join(', ')}
      WHERE id = @TeacherId;
    `);

    // Trả về thông tin hồ sơ sau khi cập nhật
    const fetchRes = await request.query(`
      SELECT 
        id,
        ho_ten AS hoTen,
        email,
        so_dien_thoai AS soDienThoai,
        anh_dai_dien AS anhDaiDien,
        vai_tro AS vaiTro,
        ngay_tao AS ngayTao
      FROM dbo.nguoi_dung
      WHERE id = @TeacherId;
    `);

    return fetchRes.recordset[0];
  });
}

/**
 * Đổi mật khẩu cho giảng viên.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} params
 * @param {string} params.matKhauCu - Mật khẩu hiện tại
 * @param {string} params.matKhauMoi - Mật khẩu mới (tối thiểu 8 ký tự)
 * @returns {Promise<boolean>}
 */
export async function changeTeacherPassword(teacherId, { matKhauCu, matKhauMoi } = {}) {
  if (!matKhauCu || typeof matKhauCu !== 'string' || !matKhauCu.trim()) {
    const err = new Error('Vui lòng cung cấp mật khẩu cũ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (!matKhauMoi || typeof matKhauMoi !== 'string' || matKhauMoi.length < 8) {
    const err = new Error('Mật khẩu mới phải có tối thiểu 8 ký tự.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (matKhauCu === matKhauMoi) {
    const err = new Error('Mật khẩu mới không được trùng với mật khẩu cũ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    // 1. Lấy hash hiện tại
    const userRes = await request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .query(`
        SELECT mat_khau_hash
        FROM dbo.nguoi_dung
        WHERE id = @TeacherId;
      `);

    const user = userRes.recordset[0];
    if (!user) {
      const err = new Error('Không tìm thấy tài khoản người dùng.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    // 2. Xác thực mật khẩu cũ bằng bcrypt
    const isMatch = await comparePassword(matKhauCu, user.mat_khau_hash);
    if (!isMatch) {
      const err = new Error('Mật khẩu hiện tại không chính xác.');
      err.statusCode = 400;
      err.isSafeMessage = true;
      throw err;
    }

    // 3. Tạo hash mới
    const newHash = await hashPassword(matKhauMoi);

    // 4. Cập nhật hash trong SQL Server
    await request
      .input('NewHash', sql.NVarChar(255), newHash)
      .query(`
        UPDATE dbo.nguoi_dung
        SET mat_khau_hash = @NewHash,
            ngay_cap_nhat = SYSDATETIME()
        WHERE id = @TeacherId;
      `);

    return true;
  });
}
