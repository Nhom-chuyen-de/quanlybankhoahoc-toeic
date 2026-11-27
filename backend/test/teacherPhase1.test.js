/**
 * @file teacherPhase1.test.js
 * @description Test Suite chính thức cho Giai đoạn 1 Backend Teacher.
 * Kiểm tra đầy đủ 12 yêu cầu kỹ thuật theo quy định.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { ENV } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';
import { hashPassword, comparePassword } from '../src/utils/password.js';
import { ROLES } from '../src/constants/roles.js';

const TEACHER_ID = '4DF7D521-7222-4E8D-A1FA-C1ACA0216363';
const STUDENT_ID = '9B7EE67A-21FA-441A-82C1-3B7DCFD6E3A8';

describe('BỘ TEST GIAI ĐOẠN 1: BACKEND TEACHER (DASHBOARD & PROFILE)', () => {
  let server = null;
  let baseUrl = '';
  let teacherToken = '';
  let studentToken = '';
  let probePool = null;
  let originalTeacherHash = null;

  before(async () => {
    // 0. Khởi động DB connection chung nếu chưa kết nối
    await connectDB();

    // 1. Tạo connection pool kiểm tra DB
    probePool = new sql.ConnectionPool({
      ...ENV.DB,
      pool: { min: 1, max: 2 },
    });
    await probePool.connect();

    // 2. Lưu lại hash ban đầu của Teacher để khôi phục sau test
    const hashRes = await probePool
      .request()
      .input('id', sql.UniqueIdentifier, TEACHER_ID)
      .query('SELECT mat_khau_hash FROM dbo.nguoi_dung WHERE id = @id;');
    originalTeacherHash = hashRes.recordset[0]?.mat_khau_hash;

    // 3. Khởi động server HTTP test
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 4. Tạo JWT token mẫu
    teacherToken = signToken({
      id: TEACHER_ID,
      email: 'teacher@demo.local',
      vaiTro: ROLES.TEACHER,
      hoTen: 'Giang Vien Demo',
    });

    studentToken = signToken({
      id: STUDENT_ID,
      email: 'student@demo.local',
      vaiTro: ROLES.STUDENT,
      hoTen: 'Hoc Vien Demo',
    });
  });

  after(async () => {
    // Khôi phục hash gốc nếu đã bị thay đổi
    if (probePool && originalTeacherHash) {
      await probePool
        .request()
        .input('id', sql.UniqueIdentifier, TEACHER_ID)
        .input('hash', sql.NVarChar(255), originalTeacherHash)
        .query('UPDATE dbo.nguoi_dung SET mat_khau_hash = @hash, ho_ten = N\'Giang Vien Demo\' WHERE id = @id;');
      await probePool.close();
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Đóng toàn bộ pool mssql còn mở để process kết thúc ngay lập tức
    await sql.close();
  });

  // 1. Cú pháp tất cả file mới
  it('1. Cú pháp tất cả file mới hợp lệ và module load thành công', async () => {
    const dashboardModule = await import('../src/modules/teacher/dashboard/dashboard.service.js');
    const profileModule = await import('../src/modules/teacher/profile/profile.service.js');
    const controllerModule = await import('../src/modules/teacher/teacher.controller.js');
    const routesModule = await import('../src/modules/teacher/teacher.routes.js');

    assert.ok(dashboardModule.getDashboardStats);
    assert.ok(profileModule.getTeacherProfile);
    assert.ok(controllerModule.getDashboard);
    assert.ok(routesModule.default);
  });

  // 2. API không có token trả 401
  it('2. API Teacher từ chối request không có token với HTTP 401', async () => {
    const endpoints = [
      '/api/v1/teacher/dashboard',
      '/api/v1/teacher/dashboard/upcoming-classes',
      '/api/v1/teacher/dashboard/pending-grading',
      '/api/v1/teacher/profile',
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      assert.equal(res.status, 401, `Endpoint ${ep} phải trả về 401 khi thiếu Token`);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Vui lòng đăng nhập/i);
    }
  });

  // 3. Tài khoản học viên truy cập Teacher trả 403
  it('3. Tài khoản học viên truy cập Teacher bị từ chối với HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/teacher/dashboard`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Bạn không có quyền truy cập chức năng này/i);
  });

  // 4. Teacher lấy được Dashboard
  it('4. Teacher lấy được Dashboard và danh sách lịch dạy, bài cần chấm', async () => {
    // 4.1 Stats
    const statsRes = await fetch(`${baseUrl}/api/v1/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(statsRes.status, 200);
    const statsBody = await statsRes.json();
    assert.equal(statsBody.success, true);
    assert.ok('totalClasses' in statsBody.data);
    assert.ok('totalStudents' in statsBody.data);
    assert.ok('avgAttendance' in statsBody.data);
    assert.ok('pendingGrading' in statsBody.data);
    assert.equal(typeof statsBody.data.totalClasses, 'number');
    assert.equal(typeof statsBody.data.totalStudents, 'number');

    // 4.2 Upcoming classes
    const classesRes = await fetch(`${baseUrl}/api/v1/teacher/dashboard/upcoming-classes?limit=3`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(classesRes.status, 200);
    const classesBody = await classesRes.json();
    assert.equal(classesBody.success, true);
    assert.ok(Array.isArray(classesBody.data));

    // 4.3 Pending grading
    const gradingRes = await fetch(`${baseUrl}/api/v1/teacher/dashboard/pending-grading?limit=5`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(gradingRes.status, 200);
    const gradingBody = await gradingRes.json();
    assert.equal(gradingBody.success, true);
    assert.ok(Array.isArray(gradingBody.data));
  });

  // 5. Teacher không thể xem dữ liệu của Teacher khác (giả mạo query hoặc body param bị triệt tiêu)
  it('5. Giảng viên chỉ xem dữ liệu của chính mình, bỏ qua hoàn toàn tham số teacherId giả mạo', async () => {
    const fakeTeacherId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/v1/teacher/dashboard?teacherId=${fakeTeacherId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    // Dữ liệu vẫn được truy vấn an toàn bằng req.user.id
    assert.ok('totalClasses' in body.data);
  });

  // 6. Profile chỉ cập nhật đúng ba trường được cho phép
  it('6. Profile chỉ cho phép cập nhật hoTen, soDienThoai, anhDaiDien', async () => {
    const updatePayload = {
      hoTen: 'Giang Vien Demo Chuan',
      soDienThoai: '0988776655',
      anhDaiDien: 'https://avatar.local/teacher.jpg',
    };

    const patchRes = await fetch(`${baseUrl}/api/v1/teacher/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(patchRes.status, 200);
    const patchBody = await patchRes.json();
    assert.equal(patchBody.success, true);
    assert.equal(patchBody.data.hoTen, 'Giang Vien Demo Chuan');
    assert.equal(patchBody.data.soDienThoai, '0988776655');
    assert.equal(patchBody.data.anhDaiDien, 'https://avatar.local/teacher.jpg');
    assert.equal(patchBody.data.email, 'teacher@demo.local');
    assert.equal(patchBody.data.vaiTro, ROLES.TEACHER);
    assert.ok(!('mat_khau_hash' in patchBody.data));
  });

  // 7. Không thể cập nhật email và vai trò
  it('7. Không thể cập nhật email, vai trò hoặc trạng thái (bị từ chối hoặc bỏ qua)', async () => {
    // 7.1 Gửi payload chỉ gồm các trường bị cấm
    const forbiddenRes = await fetch(`${baseUrl}/api/v1/teacher/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        email: 'hacker@toeic.vn',
        vaiTro: 'quan tri vien',
        trangThai: 'bi khoa',
      }),
    });

    assert.equal(forbiddenRes.status, 400);
    const forbiddenBody = await forbiddenRes.json();
    assert.equal(forbiddenBody.success, false);
    assert.match(forbiddenBody.message, /Không có trường thông tin hợp lệ/i);

    // 7.2 Kiểm tra trong DB email và vai trò vẫn nguyên vẹn
    const checkDb = await probePool
      .request()
      .input('id', sql.UniqueIdentifier, TEACHER_ID)
      .query('SELECT email, vai_tro FROM dbo.nguoi_dung WHERE id = @id;');
    assert.equal(checkDb.recordset[0].email, 'teacher@demo.local');
    assert.equal(checkDb.recordset[0].vai_tro, ROLES.TEACHER);
  });

  // 8. Đổi mật khẩu sai mật khẩu cũ phải thất bại
  it('8. Đổi mật khẩu khi sai mật khẩu cũ bị từ chối với HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/v1/teacher/profile/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        matKhauCu: 'MatKhauSai@123',
        matKhauMoi: 'MatKhauMoi@999',
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Mật khẩu hiện tại không chính xác/i);
  });

  // 9. Đổi mật khẩu đúng phải cập nhật hash trong SQL Server
  it('9. Đổi mật khẩu đúng cập nhật thành công hash mới trong SQL Server', async () => {
    // Thiết lập mật khẩu test đã biết trước
    const testOldPass = 'TeacherTemp@123';
    const testNewPass = 'TeacherNewSecret@456';
    const tempOldHash = await hashPassword(testOldPass);

    await probePool
      .request()
      .input('id', sql.UniqueIdentifier, TEACHER_ID)
      .input('hash', sql.NVarChar(255), tempOldHash)
      .query('UPDATE dbo.nguoi_dung SET mat_khau_hash = @hash WHERE id = @id;');

    const res = await fetch(`${baseUrl}/api/v1/teacher/profile/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        matKhauCu: testOldPass,
        matKhauMoi: testNewPass,
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.message, 'Đổi mật khẩu thành công');

    // Kiểm tra trong DB hash mới đã được lưu và khớp với testNewPass
    const dbHashRes = await probePool
      .request()
      .input('id', sql.UniqueIdentifier, TEACHER_ID)
      .query('SELECT mat_khau_hash FROM dbo.nguoi_dung WHERE id = @id;');
    const updatedHash = dbHashRes.recordset[0].mat_khau_hash;
    const isNewPassValid = await comparePassword(testNewPass, updatedHash);
    assert.equal(isNewPassValid, true);

    // Không lộ hash trong response
    assert.ok(!('mat_khau_hash' in (body.data || {})));
  });

  // 10. SQL Server mất kết nối trả 503 cố định, không lộ host/port/database
  it('10. SQL Server mất kết nối trả HTTP 503 với thông báo an toàn', async () => {
    const originalPort = ENV.DB.port;
    try {
      ENV.DB.port = 19999;
      const res = await fetch(`${baseUrl}/api/v1/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });

      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(
        body.message,
        'Dịch vụ Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.'
      );
      assert.doesNotMatch(body.message, /19999|localhost|tcp|sql/i);
    } finally {
      ENV.DB.port = originalPort;
    }
  });

  // 11. Không rò rỉ SESSION_CONTEXT giữa các request đồng thời
  it('11. Không rò rỉ SESSION_CONTEXT giữa các request đồng thời trên Connection Pool', async () => {
    const requests = Array.from({ length: 6 }, () =>
      fetch(`${baseUrl}/api/v1/teacher/profile`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      })
    );

    const responses = await Promise.all(requests);
    for (const r of responses) {
      assert.equal(r.status, 200);
      const b = await r.json();
      assert.equal(b.data.id.toUpperCase(), TEACHER_ID.toUpperCase());
    }

    // Verify bên ngoài không bị nhiễm
    const probeRes = await probePool.request().query("SELECT SESSION_CONTEXT(N'UserId') AS uid;");
    assert.equal(probeRes.recordset[0].uid, null);
  });

  // 12. Các API Auth/User hiện tại vẫn hoạt động
  it('12. Các API nền tảng và User/Auth vẫn hoạt động bình thường', async () => {
    // 12.1 Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.status, 'ok');

    // 12.2 User routes (yêu cầu auth)
    const userRes = await fetch(`${baseUrl}/api/v1/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    // Trả về kết quả bình thường của User module
    assert.ok(userRes.status === 200 || userRes.status === 404);
  });
});
