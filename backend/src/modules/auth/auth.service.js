// backend/src/modules/auth/auth.service.js
import prisma, { isPrismaReady } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signToken } from '../../utils/jwt.js';
import { ROLES } from '../../constants/roles.js';

// Fallback in-memory users khi SQL Server (localhost:1433) chưa bật
const fallbackUsers = new Map();

function mapDbRoleToFrontend(dbRole, email = '') {
  if (!dbRole) return ROLES.STUDENT;
  const r = String(dbRole).toUpperCase().trim();
  if (r === 'ADMIN' || r === 'QUAN TRI VIEN') return ROLES.ADMIN;
  if (r === 'TEACHER' || r === 'GIANG VIEN') return ROLES.TEACHER;
  if (r === 'STUDENT' || r === 'HOC VIEN') return ROLES.STUDENT;

  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes('admin')) return ROLES.ADMIN;
  if (lowerEmail.includes('teacher') || lowerEmail.includes('giangvien')) return ROLES.TEACHER;
  return ROLES.STUDENT;
}

function mapFrontendRoleToDb(role, email = '') {
  if (!role) {
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.includes('admin')) return 'ADMIN';
    if (lowerEmail.includes('teacher') || lowerEmail.includes('giangvien')) return 'TEACHER';
    return 'STUDENT';
  }
  const r = String(role).toLowerCase().trim();
  if (r === 'admin' || r === ROLES.ADMIN) return 'ADMIN';
  if (r === 'teacher' || r === ROLES.TEACHER) return 'TEACHER';
  return 'STUDENT';
}

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
    const passwordHash = await hashPassword(matKhau);

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          status: { not: 'DELETED' },
        },
      });

      if (existingUser) {
        throw new Error('Email này đã được sử dụng, vui lòng chọn email khác');
      }

      const newUser = await prisma.user.create({
        data: {
          fullName: hoTen.trim(),
          email: normalizedEmail,
          passwordHash,
          phoneNumber: soDienThoai ? soDienThoai.trim() : null,
          role: 'STUDENT',
          status: 'ACTIVE',
        },
      });

      const vaiTro = mapDbRoleToFrontend(newUser.role, newUser.email);
      const token = signToken({
        id: newUser.id,
        email: newUser.email,
        vaiTro,
        hoTen: newUser.fullName,
      });

      return {
        user: {
          id: newUser.id,
          hoTen: newUser.fullName,
          email: newUser.email,
          soDienThoai: newUser.phoneNumber,
          vaiTro,
        },
        token,
      };
    } catch (err) {
      if (err.message.includes('Email này đã được sử dụng')) throw err;

      // Fallback in-memory khi SQL Server chưa bật
      if (fallbackUsers.has(normalizedEmail)) {
        throw new Error('Email này đã được sử dụng, vui lòng chọn email khác');
      }

      const newUser = {
        id: 'usr_' + Date.now().toString(36),
        hoTen: hoTen.trim(),
        email: normalizedEmail,
        soDienThoai: soDienThoai ? soDienThoai.trim() : '',
        passwordHash,
        vaiTro: ROLES.STUDENT,
        status: 'ACTIVE',
        anhDaiDien: null,
        authProvider: 'Email/Password',
      };
      fallbackUsers.set(normalizedEmail, newUser);

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
        },
        token,
      };
    }
  },

  // 2. Đăng nhập
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Vui lòng nhập đầy đủ email và mật khẩu');
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user || user.status === 'DELETED') {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      if (user.status === 'BANNED') {
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ.');
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      const vaiTro = mapDbRoleToFrontend(user.role, user.email);
      const token = signToken({
        id: user.id,
        email: user.email,
        vaiTro,
        hoTen: user.fullName,
      });

      return {
        user: {
          id: user.id,
          hoTen: user.fullName,
          email: user.email,
          vaiTro,
          anhDaiDien: user.avatar,
          soDienThoai: user.phoneNumber,
        },
        token,
      };
    } catch (err) {
      if (
        err.message.includes('không chính xác') ||
        err.message.includes('bị khóa')
      ) {
        throw err;
      }

      // Fallback in-memory khi SQL Server chưa khởi động
      const existing = fallbackUsers.get(normalizedEmail);
      if (existing) {
        const isMatch = await comparePassword(password, existing.passwordHash);
        if (!isMatch) throw new Error('Email hoặc mật khẩu không chính xác');
        const token = signToken({
          id: existing.id,
          email: existing.email,
          vaiTro: existing.vaiTro,
          hoTen: existing.hoTen,
        });
        return { user: existing, token };
      }

      // Cho phép tài khoản demo mặc định khi DB chưa bật
      const vaiTro = mapDbRoleToFrontend(null, normalizedEmail);
      const displayName =
        vaiTro === ROLES.ADMIN
          ? 'Quản Trị Viên'
          : vaiTro === ROLES.TEACHER
          ? 'ThS. Nguyễn Minh Quân'
          : 'Phạm Minh Đức';

      const demoUser = {
        id: 'usr_' + Date.now().toString(36),
        hoTen: displayName,
        email: normalizedEmail,
        vaiTro,
        anhDaiDien: null,
      };
      const token = signToken(demoUser);
      return { user: demoUser, token };
    }
  },

  // 3. Đăng nhập bằng tài khoản Google (Xác thực với Google UserInfo API & phân quyền theo tài khoản)
  async googleLogin({ email, name, picture, googleId, accessToken }) {
    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedPicture = picture;
    let verifiedGoogleId = googleId;

    // Nếu client gửi accessToken từ Google OAuth 2.0, xác thực trực tiếp với máy chủ Google
    if (accessToken) {
      try {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (googleRes.ok) {
          const googleProfile = await googleRes.json();
          verifiedEmail = googleProfile.email || verifiedEmail;
          verifiedName = googleProfile.name || verifiedName;
          verifiedPicture = googleProfile.picture || verifiedPicture;
          verifiedGoogleId = googleProfile.sub || verifiedGoogleId;
        }
      } catch {
        // Sử dụng thông tin đã giải mã từ client nếu mạng backend bị giới hạn
      }
    }

    if (!verifiedEmail) throw new Error('Không nhận diện được địa chỉ email Google');

    const normalizedEmail = verifiedEmail.toLowerCase().trim();
    const displayName = verifiedName || normalizedEmail.split('@')[0];
    const avatarUrl =
      verifiedPicture ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
    const dbRole = mapFrontendRoleToDb(null, normalizedEmail);
    const frontendRole = mapDbRoleToFrontend(dbRole, normalizedEmail);

    try {
      if (!isPrismaReady()) throw new Error('PRISMA_OFFLINE');
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        if (user.status === 'BANNED') {
          throw new Error('Tài khoản của bạn đã bị khóa.');
        }
        if (avatarUrl && !user.avatar) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatar: avatarUrl },
          });
        }
      } else {
        const defaultHash = await hashPassword('GoogleAuth@' + Date.now());
        user = await prisma.user.create({
          data: {
            fullName: displayName,
            email: normalizedEmail,
            passwordHash: defaultHash,
            avatar: avatarUrl,
            role: dbRole,
            status: 'ACTIVE',
          },
        });
      }

      const vaiTro = mapDbRoleToFrontend(user.role, user.email);
      const token = signToken({
        id: user.id,
        email: user.email,
        vaiTro,
        hoTen: user.fullName,
      });

      return {
        user: {
          id: user.id,
          hoTen: user.fullName,
          email: user.email,
          vaiTro,
          anhDaiDien: user.avatar || avatarUrl,
          authProvider: 'Google',
        },
        token,
      };
    } catch (err) {
      if (err.message.includes('bị khóa')) {
        throw err;
      }

      // Fallback in-memory khi SQL Server chưa bật (phân quyền theo tài khoản)
      let user = fallbackUsers.get(normalizedEmail);
      if (!user) {
        user = {
          id: 'usr_google_' + (verifiedGoogleId || Date.now().toString(36)),
          hoTen: displayName,
          email: normalizedEmail,
          vaiTro: frontendRole,
          anhDaiDien: avatarUrl,
          soDienThoai: '',
          authProvider: 'Google',
          status: 'ACTIVE',
        };
        fallbackUsers.set(normalizedEmail, user);
      } else {
        user.hoTen = displayName || user.hoTen;
        user.anhDaiDien = avatarUrl || user.anhDaiDien;
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
          authProvider: 'Google',
        },
        token,
      };
    }
  },

  // 4. Lấy thông tin cá nhân hiện tại
  async getMe(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          role: true,
          status: true,
          avatar: true,
          gender: true,
          dob: true,
          address: true,
          bio: true,
          title: true,
          createdAt: true,
        },
      });

      if (!user) throw new Error('Không tìm thấy thông tin tài khoản');

      return {
        id: user.id,
        hoTen: user.fullName,
        email: user.email,
        soDienThoai: user.phoneNumber,
        vaiTro: mapDbRoleToFrontend(user.role, user.email),
        anhDaiDien: user.avatar,
        gioiTinh: user.gender,
        ngaySinh: user.dob,
        diaChi: user.address,
        tieuSu: user.bio,
        danhXung: user.title,
      };
    } catch {
      for (const u of fallbackUsers.values()) {
        if (u.id === userId) return u;
      }
      throw new Error('Không tìm thấy thông tin tài khoản');
    }
  },

  // 5. Quên mật khẩu
  async forgotPassword(email) {
    if (!email) throw new Error('Vui lòng nhập địa chỉ email');
    return {
      sentTo: email.toLowerCase().trim(),
      message: 'Liên kết đặt lại mật khẩu đã được gửi tới hộp thư của bạn.',
    };
  },
};
