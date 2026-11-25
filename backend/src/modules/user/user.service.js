import { getDB, isDBConnected, mockDatabase } from '../../config/db.js';
import { hashPassword, comparePassword } from '../../utils/password.js';

export const userService = {
  // Lấy hồ sơ cá nhân
  async getProfile(userId) {
    if (isDBConnected()) {
      const pool = getDB();
      const res = await pool.request()
        .input('id', userId)
        .query('SELECT id, ho_ten, email, so_dien_thoai, anh_dai_dien, vai_tro, ngay_tao FROM dbo.nguoi_dung WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Không tìm thấy thông tin cá nhân');
      return res.recordset[0];
    }

    const user = mockDatabase.users.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy thông tin cá nhân');
    return {
      id: user.id,
      hoTen: user.hoTen,
      email: user.email,
      soDienThoai: user.soDienThoai,
      anhDaiDien: user.anhDaiDien,
      vaiTro: user.vaiTro,
      gender: user.gender || 'Chưa cập nhật',
      dob: user.dob || '',
      address: user.address || '',
      ngayTao: user.ngayTao,
    };
  },

  // Cập nhật hồ sơ cá nhân
  async updateProfile(userId, { hoTen, soDienThoai, anhDaiDien, gender, dob, address }) {
    if (isDBConnected()) {
      const pool = getDB();
      await pool.request()
        .input('id', userId)
        .input('ho_ten', hoTen)
        .input('so_dien_thoai', soDienThoai)
        .input('anh_dai_dien', anhDaiDien)
        .query(`
          UPDATE dbo.nguoi_dung 
          SET ho_ten = @ho_ten, so_dien_thoai = @so_dien_thoai, anh_dai_dien = @anh_dai_dien, ngay_cap_nhat = SYSDATETIME()
          WHERE id = @id
        `);
      return this.getProfile(userId);
    }

    const user = mockDatabase.users.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    if (hoTen) user.hoTen = hoTen.trim();
    if (soDienThoai) user.soDienThoai = soDienThoai.trim();
    if (anhDaiDien) user.anhDaiDien = anhDaiDien;
    if (gender) user.gender = gender;
    if (dob) user.dob = dob;
    if (address) user.address = address;

    return {
      id: user.id,
      hoTen: user.hoTen,
      email: user.email,
      soDienThoai: user.soDienThoai,
      anhDaiDien: user.anhDaiDien,
      gender: user.gender,
      dob: user.dob,
      address: user.address,
    };
  },

  // Đổi mật khẩu
  async changePassword(userId, { matKhauCu, matKhauMoi }) {
    if (!matKhauCu || !matKhauMoi) {
      throw new Error('Vui lòng nhập mật khẩu cũ và mật khẩu mới');
    }

    if (matKhauMoi.length < 8) {
      throw new Error('Mật khẩu mới phải có ít nhất 8 ký tự');
    }

    if (isDBConnected()) {
      const pool = getDB();
      const res = await pool.request()
        .input('id', userId)
        .query('SELECT mat_khau_hash FROM dbo.nguoi_dung WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Không tìm thấy người dùng');

      const isMatch = await comparePassword(matKhauCu, res.recordset[0].mat_khau_hash);
      if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

      const newHash = await hashPassword(matKhauMoi);
      await pool.request()
        .input('id', userId)
        .input('new_hash', newHash)
        .query('UPDATE dbo.nguoi_dung SET mat_khau_hash = @new_hash, ngay_cap_nhat = SYSDATETIME() WHERE id = @id');
      return true;
    }

    const user = mockDatabase.users.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');

    const isMatch = await comparePassword(matKhauCu, user.matKhauHash);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

    user.matKhauHash = await hashPassword(matKhauMoi);
    return true;
  },
};
