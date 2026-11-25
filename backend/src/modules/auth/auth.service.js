import { v4 as uuidv4 } from 'uuid';
import { getDB, isDBConnected, mockDatabase } from '../../config/db.js';
import { ROLES, USER_STATUS } from '../../constants/roles.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';

export const authService = {
  // 1. Đăng ký tài khoản học viên
  async register({ hoTen, email, soDienThoai, matKhau, dongYDieuKhoan }) {
    if (!hoTen || !email || !matKhau) {
      throw new Error('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
    }

    if (!dongYDieuKhoan) {
      throw new Error('Bạn cần đồng ý với điều khoản dịch vụ để đăng ký');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Kiểm tra kết nối SQL Server thật nếu có
    if (isDBConnected()) {
      const pool = getDB();
      const checkUser = await pool.request()
        .input('email', normalizedEmail)
        .query('SELECT id FROM dbo.nguoi_dung WHERE email = @email AND trang_thai <> N\'da xoa\'');

      if (checkUser.recordset.length > 0) {
        throw new Error('Email này đã được sử dụng, vui lòng chọn email khác');
      }

      const matKhauHash = await hashPassword(matKhau);
      const newId = uuidv4();

      await pool.request()
        .input('id', newId)
        .input('ho_ten', hoTen.trim())
        .input('email', normalizedEmail)
        .input('mat_khau_hash', matKhauHash)
        .input('so_dien_thoai', soDienThoai ? soDienThoai.trim() : null)
        .input('vai_tro', ROLES.STUDENT)
        .input('trang_thai', USER_STATUS.ACTIVE)
        .query(`
          INSERT INTO dbo.nguoi_dung (id, ho_ten, email, mat_khau_hash, so_dien_thoai, vai_tro, trang_thai)
          VALUES (@id, @ho_ten, @email, @mat_khau_hash, @so_dien_thoai, @vai_tro, @trang_thai)
        `);

      const token = signToken({ id: newId, email: normalizedEmail, vaiTro: ROLES.STUDENT, hoTen: hoTen.trim() });
      return {
        user: { id: newId, hoTen: hoTen.trim(), email: normalizedEmail, soDienThoai, vaiTro: ROLES.STUDENT },
        token,
      };
    }

    // Fallback store
    const existingUser = mockDatabase.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.trangThai !== USER_STATUS.DELETED
    );

    if (existingUser) {
      throw new Error('Email này đã được sử dụng, vui lòng chọn email khác');
    }

    const matKhauHash = await hashPassword(matKhau);
    const newUser = {
      id: 'USR_' + Date.now().toString(36),
      hoTen: hoTen.trim(),
      email: normalizedEmail,
      soDienThoai: soDienThoai ? soDienThoai.trim() : '',
      matKhauHash,
      vaiTro: ROLES.STUDENT,
      trangThai: USER_STATUS.ACTIVE,
      anhDaiDien: null,
      ngayTao: new Date(),
    };

    mockDatabase.users.push(newUser);

    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      vaiTro: newUser.vaiTro,
      hoTen: newUser.hoTen,
    });

    return {
      user: {
        id: newUser.id,
        hoTen: newUser.hoTen,
        email: newUser.email,
        soDienThoai: newUser.soDienThoai,
        vaiTro: newUser.vaiTro,
        anhDaiDien: newUser.anhDaiDien,
      },
      token,
    };
  },

  // 2. Đăng nhập
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Vui lòng nhập email và mật khẩu');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // SQL Server
    if (isDBConnected()) {
      const pool = getDB();
      const result = await pool.request()
        .input('email', normalizedEmail)
        .query('SELECT * FROM dbo.nguoi_dung WHERE email = @email AND trang_thai <> N\'da xoa\'');

      if (result.recordset.length === 0) {
        throw new Error('Tài khoản hoặc mật khẩu không chính xác');
      }

      const user = result.recordset[0];

      if (user.trang_thai === USER_STATUS.BANNED) {
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ');
      }

      const isMatch = await comparePassword(password, user.mat_khau_hash);
      if (!isMatch) {
        throw new Error('Tài khoản hoặc mật khẩu không chính xác');
      }

      // Cập nhật lần đăng nhập cuối
      await pool.request()
        .input('id', user.id)
        .query('UPDATE dbo.nguoi_dung SET lan_dang_nhap_cuoi = SYSDATETIME() WHERE id = @id');

      const token = signToken({
        id: user.id,
        email: user.email,
        vaiTro: user.vai_tro,
        hoTen: user.ho_ten,
      });

      return {
        user: {
          id: user.id,
          hoTen: user.ho_ten,
          email: user.email,
          soDienThoai: user.so_dien_thoai,
          vaiTro: user.vai_tro,
          anhDaiDien: user.anh_dai_dien,
        },
        token,
      };
    }

    // Fallback Mock Store
    const user = mockDatabase.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.trangThai !== USER_STATUS.DELETED
    );

    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.trangThai === USER_STATUS.BANNED) {
      throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ');
    }

    const isMatch = await comparePassword(password, user.matKhauHash);
    if (!isMatch) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác');
    }

    user.lanDangNhapCuoi = new Date();

    const token = signToken({
      id: user.id,
      email: user.email,
      vaiTro: user.vaiTro,
      hoTen: user.hoTen,
    });

    return {
      user: {
        id: user.id,
        hoTen: user.hoTen,
        email: user.email,
        soDienThoai: user.soDienThoai,
        vaiTro: user.vaiTro,
        anhDaiDien: user.anhDaiDien,
      },
      token,
    };
  },

  // 3. Quên mật khẩu
  async forgotPassword(email) {
    if (!email) throw new Error('Vui lòng nhập địa chỉ email');
    const normalizedEmail = email.toLowerCase().trim();

    // Giả lập gửi liên kết / mã OTP
    return {
      sentTo: normalizedEmail,
      message: 'Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn.',
    };
  },

  // 4. Đăng nhập / Đăng ký nhanh bằng Google
  async googleLogin({ email, name, picture, googleId }) {
    if (!email) throw new Error('Không nhận được email từ tài khoản Google');

    const normalizedEmail = email.toLowerCase().trim();
    const displayName = name || normalizedEmail.split('@')[0];
    const avatarUrl = picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

    // Tìm kiếm trong SQL Server nếu kết nối
    if (isDBConnected()) {
      const pool = getDB();
      const existing = await pool.request()
        .input('email', normalizedEmail)
        .query('SELECT * FROM dbo.nguoi_dung WHERE email = @email AND trang_thai <> N\'da xoa\'');

      let user = null;
      if (existing.recordset.length > 0) {
        user = existing.recordset[0];
        if (user.trang_thai === USER_STATUS.BANNED) {
          throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ');
        }
        await pool.request()
          .input('id', user.id)
          .input('anh_dai_dien', avatarUrl)
          .query('UPDATE dbo.nguoi_dung SET lan_dang_nhap_cuoi = SYSDATETIME(), anh_dai_dien = COALESCE(anh_dai_dien, @anh_dai_dien) WHERE id = @id');
      } else {
        const newId = uuidv4();
        const randomPasswordHash = await hashPassword(uuidv4());
        await pool.request()
          .input('id', newId)
          .input('ho_ten', displayName)
          .input('email', normalizedEmail)
          .input('mat_khau_hash', randomPasswordHash)
          .input('anh_dai_dien', avatarUrl)
          .input('vai_tro', ROLES.STUDENT)
          .input('trang_thai', USER_STATUS.ACTIVE)
          .query(`
            INSERT INTO dbo.nguoi_dung (id, ho_ten, email, mat_khau_hash, anh_dai_dien, vai_tro, trang_thai)
            VALUES (@id, @ho_ten, @email, @mat_khau_hash, @anh_dai_dien, @vai_tro, @trang_thai)
          `);
        user = { id: newId, ho_ten: displayName, email: normalizedEmail, vai_tro: ROLES.STUDENT, anh_dai_dien: avatarUrl };
      }

      const token = signToken({ id: user.id, email: user.email, vaiTro: user.vai_tro, hoTen: user.ho_ten });
      return {
        user: { id: user.id, hoTen: user.ho_ten, email: user.email, vaiTro: user.vai_tro, anhDaiDien: user.anh_dai_dien },
        token,
      };
    }

    // Fallback In-Memory
    let user = mockDatabase.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.trangThai !== USER_STATUS.DELETED
    );

    if (user) {
      if (user.trangThai === USER_STATUS.BANNED) {
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ');
      }
      user.lanDangNhapCuoi = new Date();
      if (!user.anhDaiDien) user.anhDaiDien = avatarUrl;
    } else {
      user = {
        id: 'USR_G_' + Date.now().toString(36),
        hoTen: displayName,
        email: normalizedEmail,
        matKhauHash: await hashPassword('GoogleAuth@' + Date.now()),
        soDienThoai: '',
        anhDaiDien: avatarUrl,
        vaiTro: ROLES.STUDENT,
        trangThai: USER_STATUS.ACTIVE,
        authProvider: 'Google',
        ngayTao: new Date(),
        lanDangNhapCuoi: new Date(),
      };
      mockDatabase.users.push(user);
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      vaiTro: user.vaiTro,
      hoTen: user.hoTen,
    });

    return {
      user: {
        id: user.id,
        hoTen: user.hoTen,
        email: user.email,
        vaiTro: user.vaiTro,
        anhDaiDien: user.anhDaiDien,
        soDienThoai: user.soDienThoai || '',
      },
      token,
    };
  },

  // 5. Lấy thông tin phiên hiện tại (Get Me)
  async getMe(userId) {
    if (isDBConnected()) {
      const pool = getDB();
      const res = await pool.request()
        .input('id', userId)
        .query('SELECT id, ho_ten, email, so_dien_thoai, anh_dai_dien, vai_tro, trang_thai FROM dbo.nguoi_dung WHERE id = @id');
      if (res.recordset.length === 0) throw new Error('Không tìm thấy người dùng');
      const u = res.recordset[0];
      return { id: u.id, hoTen: u.ho_ten, email: u.email, soDienThoai: u.so_dien_thoai, anhDaiDien: u.anh_dai_dien, vaiTro: u.vai_tro };
    }

    const u = mockDatabase.users.find((user) => user.id === userId);
    if (!u) throw new Error('Không tìm thấy người dùng');
    return { id: u.id, hoTen: u.hoTen, email: u.email, soDienThoai: u.soDienThoai, anhDaiDien: u.anhDaiDien, vaiTro: u.vaiTro };
  },
};
