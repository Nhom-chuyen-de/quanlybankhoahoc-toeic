/**
 * @file support.service.js
 * @description Nghiệp vụ yêu cầu hỗ trợ cho phân hệ Giảng viên (Teacher).
 * Truy vấn 100% từ Microsoft SQL Server thông qua runInTeacherContext.
 */

import sql from 'mssql';
import { runInTeacherContext } from '../teacher.context.js';

const ALLOWED_CATEGORIES = ['ky thuat', 'tai khoan', 'khoa hoc', 'khac'];
const ALLOWED_PRIORITIES = ['thap', 'trung binh', 'cao'];

/**
 * Lấy danh sách yêu cầu hỗ trợ do chính giảng viên gửi.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} options - Phân trang và lọc trạng thái
 * @returns {Promise<{tickets: Array, pagination: object}>}
 */
export async function getSupportTickets(teacherId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { trangThai } = options;

  return runInTeacherContext(teacherId, async (request) => {
    request.input('TeacherId', sql.UniqueIdentifier, teacherId);

    let whereClause = `WHERE yc.nguoi_dung_id = @TeacherId`;
    if (trangThai && typeof trangThai === 'string' && trangThai.trim()) {
      request.input('TrangThai', sql.NVarChar(20), trangThai.trim());
      whereClause += ` AND yc.trang_thai = @TrangThai`;
    }

    const countRes = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.yeu_cau_ho_tro yc
      ${whereClause};
    `);
    const total = Number(countRes.recordset[0]?.total || 0);

    request.input('Offset', sql.Int, offset);
    request.input('Limit', sql.Int, limit);

    const listRes = await request.query(`
      SELECT 
        yc.id,
        yc.tieu_de AS tieuDe,
        yc.danh_muc AS danhMuc,
        yc.trang_thai AS trangThai,
        yc.do_uu_tien AS doUuTien,
        yc.ngay_tao AS ngayTao,
        yc.ngay_cap_nhat AS ngayCapNhat,
        yc.ngay_xu_ly_xong AS ngayXuLyXong,
        (SELECT COUNT(*) FROM dbo.phan_hoi_ho_tro ph WHERE ph.yeu_cau_id = yc.id) AS soPhanHoi
      FROM dbo.yeu_cau_ho_tro yc
      ${whereClause}
      ORDER BY yc.ngay_tao DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `);

    return {
      tickets: listRes.recordset.map((t) => ({
        ...t,
        soPhanHoi: Number(t.soPhanHoi || 0),
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
 * Xem chi tiết yêu cầu hỗ trợ kèm chuỗi tin nhắn trao đổi.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} ticketId - UUID của yêu cầu hỗ trợ
 * @returns {Promise<object>}
 */
export async function getSupportTicketDetail(teacherId, ticketId) {
  if (!ticketId || typeof ticketId !== 'string') {
    const err = new Error('Mã yêu cầu hỗ trợ không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('TicketId', sql.UniqueIdentifier, ticketId);

    const ticketRes = await request.query(`
      SELECT 
        yc.id,
        yc.nguoi_dung_id AS nguoiDungId,
        yc.tieu_de AS tieuDe,
        yc.danh_muc AS danhMuc,
        yc.trang_thai AS trangThai,
        yc.do_uu_tien AS doUuTien,
        yc.ngay_tao AS ngayTao,
        yc.ngay_cap_nhat AS ngayCapNhat,
        yc.ngay_xu_ly_xong AS ngayXuLyXong
      FROM dbo.yeu_cau_ho_tro yc
      WHERE yc.id = @TicketId;
    `);

    const ticket = ticketRes.recordset[0];
    if (!ticket) {
      const err = new Error('Không tìm thấy yêu cầu hỗ trợ.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (ticket.nguoiDungId !== teacherId) {
      const err = new Error('Bạn không có quyền truy cập yêu cầu hỗ trợ này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    // Lấy chuỗi phản hồi
    const messagesRes = await request.query(`
      SELECT 
        ph.id,
        ph.yeu_cau_id AS yeuCauId,
        ph.nguoi_gui_id AS nguoiGuiId,
        nd.ho_ten AS hoTenNguoiGui,
        nd.vai_tro AS vaiTroNguoiGui,
        ph.noi_dung AS noiDung,
        ph.ngay_gui AS ngayGui
      FROM dbo.phan_hoi_ho_tro ph
      INNER JOIN dbo.nguoi_dung nd ON ph.nguoi_gui_id = nd.id
      WHERE ph.yeu_cau_id = @TicketId
      ORDER BY ph.ngay_gui ASC;
    `);

    return {
      ...ticket,
      messages: messagesRes.recordset,
    };
  });
}

/**
 * Tạo mới yêu cầu hỗ trợ.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {object} payload - { tieuDe, danhMuc, doUuTien }
 * @returns {Promise<object>}
 */
export async function createSupportTicket(teacherId, payload = {}) {
  const { tieuDe, danhMuc, doUuTien } = payload;

  if (!tieuDe || typeof tieuDe !== 'string' || !tieuDe.trim()) {
    const err = new Error('Tiêu đề yêu cầu hỗ trợ không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  if (tieuDe.trim().length > 200) {
    const err = new Error('Tiêu đề yêu cầu không được vượt quá 200 ký tự.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const cat = danhMuc || 'khac';
  if (!ALLOWED_CATEGORIES.includes(cat)) {
    const err = new Error(`Danh mục không hợp lệ. Cho phép: ${ALLOWED_CATEGORIES.join(', ')}.`);
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const priority = doUuTien || 'trung binh';
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    const err = new Error(`Mức độ ưu tiên không hợp lệ. Cho phép: ${ALLOWED_PRIORITIES.join(', ')}.`);
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('TieuDe', sql.NVarChar(200), tieuDe.trim())
      .input('DanhMuc', sql.NVarChar(20), cat)
      .input('DoUuTien', sql.NVarChar(20), priority);

    const insertRes = await request.query(`
      DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

      INSERT INTO dbo.yeu_cau_ho_tro (id, nguoi_dung_id, tieu_de, danh_muc, do_uu_tien, trang_thai)
      VALUES (@NewId, @TeacherId, @TieuDe, @DanhMuc, @DoUuTien, N'moi');

      SELECT 
        id,
        nguoi_dung_id AS nguoiDungId,
        tieu_de AS tieuDe,
        danh_muc AS danhMuc,
        trang_thai AS trangThai,
        do_uu_tien AS doUuTien,
        ngay_tao AS ngayTao,
        ngay_cap_nhat AS ngayCapNhat
      FROM dbo.yeu_cau_ho_tro
      WHERE id = @NewId;
    `);

    return insertRes.recordset[0];
  });
}

/**
 * Gửi phản hồi vào yêu cầu hỗ trợ.
 * 
 * @param {string} teacherId - UUID của giảng viên
 * @param {string} ticketId - UUID của yêu cầu hỗ trợ
 * @param {object} payload - { noiDung }
 * @returns {Promise<object>}
 */
export async function replySupportTicket(teacherId, ticketId, payload = {}) {
  if (!ticketId || typeof ticketId !== 'string') {
    const err = new Error('Mã yêu cầu hỗ trợ không hợp lệ.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  const { noiDung } = payload;
  if (!noiDung || typeof noiDung !== 'string' || !noiDung.trim()) {
    const err = new Error('Nội dung phản hồi không được để trống.');
    err.statusCode = 400;
    err.isSafeMessage = true;
    throw err;
  }

  return runInTeacherContext(teacherId, async (request) => {
    request
      .input('TeacherId', sql.UniqueIdentifier, teacherId)
      .input('TicketId', sql.UniqueIdentifier, ticketId);

    // Kiểm tra yêu cầu hỗ trợ tồn tại và thuộc về giảng viên
    const ticketRes = await request.query(`
      SELECT id, nguoi_dung_id, trang_thai
      FROM dbo.yeu_cau_ho_tro
      WHERE id = @TicketId;
    `);

    const ticket = ticketRes.recordset[0];
    if (!ticket) {
      const err = new Error('Không tìm thấy yêu cầu hỗ trợ.');
      err.statusCode = 404;
      err.isSafeMessage = true;
      throw err;
    }

    if (ticket.nguoi_dung_id !== teacherId) {
      const err = new Error('Bạn không có quyền phản hồi yêu cầu hỗ trợ này.');
      err.statusCode = 403;
      err.isSafeMessage = true;
      throw err;
    }

    if (ticket.trang_thai === 'da dong') {
      const err = new Error('Không thể phản hồi yêu cầu hỗ trợ đã đóng.');
      err.statusCode = 409;
      err.isSafeMessage = true;
      throw err;
    }

    request.input('NoiDung', sql.NVarChar(sql.MAX), noiDung.trim());

    const insertRes = await request.query(`
      DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

      INSERT INTO dbo.phan_hoi_ho_tro (id, yeu_cau_id, nguoi_gui_id, noi_dung)
      VALUES (@NewId, @TicketId, @TeacherId, @NoiDung);

      SELECT 
        id,
        yeu_cau_id AS yeuCauId,
        nguoi_gui_id AS nguoiGuiId,
        noi_dung AS noiDung,
        ngay_gui AS ngayGui
      FROM dbo.phan_hoi_ho_tro
      WHERE id = @NewId;
    `);

    return insertRes.recordset[0];
  });
}
