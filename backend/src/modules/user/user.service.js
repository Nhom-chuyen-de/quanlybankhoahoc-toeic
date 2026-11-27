// backend/src/modules/user/user.service.js
import prisma from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';

export const userService = {
  async getProfile(userId) {
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

    if (!user) throw new Error('Không tìm thấy người dùng');
    return user;
  },

  async updateProfile(userId, updateData) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateData.fullName || updateData.hoTen,
        phoneNumber: updateData.phoneNumber || updateData.soDienThoai,
        avatar: updateData.avatar || updateData.anhDaiDien,
        gender: updateData.gender || updateData.gioiTinh,
        address: updateData.address || updateData.diaChi,
        bio: updateData.bio || updateData.tieuSu,
      },
    });
  },

  async changePassword(userId, { matKhauCu, matKhauMoi, currentPassword, newPassword }) {
    const oldPwd = matKhauCu || currentPassword;
    const newPwd = matKhauMoi || newPassword;

    if (!oldPwd || !newPwd) {
      throw new Error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
    }
    if (newPwd.length < 6) {
      throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new Error('Không tìm thấy người dùng');

    const isMatch = await comparePassword(oldPwd, user.passwordHash);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không chính xác');

    const passwordHash = await hashPassword(newPwd);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return true;
  },
};
