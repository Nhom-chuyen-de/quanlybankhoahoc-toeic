/**
 * @file teacherPhase345.test.js
 * @description Test Suite chính thức cho Backend Teacher Giai đoạn 3, 4, 5.
 *
 * PHÂN ĐOÀN KIỂM THỬ:
 * - GIAI ĐOẠN 3: Lớp học (Classes), Học viên (Students), Bài tập (Assignments)
 * - GIAI ĐOẠN 4: Chấm điểm (Grading), Lịch dạy (Schedules), Điểm danh (Attendance)
 * - GIAI ĐOẠN 5: Báo cáo (Reports), Hỗ trợ (Support)
 * - TỔNG HỢP: Kiểm tra bảo mật & Transaction Integrity trên SQL Server thật
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { ENV } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';
import { ROLES } from '../src/constants/roles.js';

const TEACHER_ID  = '4DF7D521-7222-4E8D-A1FA-C1ACA0216363'; // giang vien demo
const STUDENT_ID  = '9B7EE67A-21FA-441A-82C1-3B7DCFD6E3A8'; // hoc vien demo
const ADMIN_ID    = '38A383A5-4510-4450-BF0A-FBD8BF3A9177'; // admin demo
const CATEGORY_ID = '73DB73F2-5B24-4016-9C11-9358601B3C8B';
const FAKE_ID     = '00000000-0000-0000-0000-000000000099';

describe('BỘ TEST GIAI ĐOẠN 3, 4, 5: BACKEND TEACHER TOÀN DIỆN', () => {
  let server = null;
  let baseUrl = '';
  let teacherToken = '';
  let studentToken = '';
  let probePool = null;

  // Dữ liệu seed dùng chung cho bài test
  let testCourseId = null;
  let testClassId = null;
  let testAssignmentId = null;
  let testSubmissionId = null;
  let testScheduleId = null;
  let testTicketId = null;

  before(async () => {
    await connectDB();

    probePool = new sql.ConnectionPool({
      ...ENV.DB,
      pool: { min: 1, max: 3 },
    });
    await probePool.connect();

    // 1. Seed Khóa học
    await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .input('categoryId', sql.UniqueIdentifier, CATEGORY_ID)
      .query(`
        INSERT INTO dbo.khoa_hoc (
          ten_khoa_hoc, danh_muc_id, mo_ta, trinh_do, trang_thai,
          loai_ky_thi, gia, nguoi_tao_id, hien_thi, trang_thai_duyet, hinh_thuc
        )
        VALUES (
          N'[TEST-P345] Khoa Hoc Thu Nghiem P345',
          @categoryId,
          N'Mo ta khoa hoc test P345',
          N'co ban',
          N'da xuat ban',
          N'TOEIC',
          600000,
          @teacherId,
          1,
          N'da duyet',
          N'truc tuyen'
        );
      `);
    const cRes = await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        SELECT TOP 1 id FROM dbo.khoa_hoc
        WHERE nguoi_tao_id = @teacherId AND ten_khoa_hoc = N'[TEST-P345] Khoa Hoc Thu Nghiem P345'
        ORDER BY ngay_tao DESC;
      `);
    testCourseId = cRes.recordset[0].id;

    // 2. Seed Lớp học do TEACHER_ID phụ trách
    // Khoảng ngày: Bắt đầu từ 30 ngày trước đến 30 ngày sau để có thể điểm danh ngày trong quá khứ
    await probePool.request()
      .input('courseId', sql.UniqueIdentifier, testCourseId)
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        INSERT INTO dbo.lop_hoc (
          khoa_hoc_id, ten_lop, giao_vien_id, si_so_toi_da, ngay_bat_dau, ngay_ket_thuc, trang_thai
        )
        VALUES (
          @courseId,
          N'[TEST-P345] Lop TOEIC Cap Toc A1',
          @teacherId,
          30,
          DATEADD(DAY, -15, CAST(SYSDATETIME() AS DATE)),
          DATEADD(DAY, 45, CAST(SYSDATETIME() AS DATE)),
          N'dang dien ra'
        );
      `);
    const lRes = await probePool.request()
      .input('courseId', sql.UniqueIdentifier, testCourseId)
      .query(`
        SELECT TOP 1 id FROM dbo.lop_hoc
        WHERE khoa_hoc_id = @courseId AND ten_lop = N'[TEST-P345] Lop TOEIC Cap Toc A1'
        ORDER BY ngay_tao DESC;
      `);
    testClassId = lRes.recordset[0].id;

    // 3. Seed Ghi danh học viên STUDENT_ID vào lớp
    await probePool.request()
      .input('classId', sql.UniqueIdentifier, testClassId)
      .input('studentId', sql.UniqueIdentifier, STUDENT_ID)
      .query(`
        INSERT INTO dbo.ghi_danh (lop_hoc_id, hoc_vien_id, trang_thai, diem_muc_tieu)
        VALUES (@classId, @studentId, N'dang hoc', 650);
      `);

    // 4. Seed Bài tập trong lớp
    await probePool.request()
      .input('classId', sql.UniqueIdentifier, testClassId)
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        INSERT INTO dbo.bai_tap (lop_hoc_id, tieu_de, mo_ta, han_nop, nguoi_tao_id)
        VALUES (
          @classId,
          N'[TEST-P345] Bai Tap Viet Listening Part 1',
          N'Nghe va tra loi cac cau hoi Part 1',
          DATEADD(DAY, 7, SYSDATETIME()),
          @teacherId
        );
      `);
    const aRes = await probePool.request()
      .input('classId', sql.UniqueIdentifier, testClassId)
      .query(`
        SELECT TOP 1 id FROM dbo.bai_tap
        WHERE lop_hoc_id = @classId
        ORDER BY ngay_tao DESC;
      `);
    testAssignmentId = aRes.recordset[0].id;

    // 5. Seed Bài nộp của học viên (chưa chấm)
    await probePool.request()
      .input('assignmentId', sql.UniqueIdentifier, testAssignmentId)
      .input('studentId', sql.UniqueIdentifier, STUDENT_ID)
      .query(`
        INSERT INTO dbo.bai_tap_nop (bai_tap_id, hoc_vien_id, duong_dan_file, ngay_nop)
        VALUES (@assignmentId, @studentId, N'https://toeic.storage/sub1.pdf', SYSDATETIME());
      `);
    const subRes = await probePool.request()
      .input('assignmentId', sql.UniqueIdentifier, testAssignmentId)
      .query(`
        SELECT TOP 1 id FROM dbo.bai_tap_nop
        WHERE bai_tap_id = @assignmentId
        ORDER BY ngay_nop DESC;
      `);
    testSubmissionId = subRes.recordset[0].id;

    // 6. Seed Buổi học trong quá khứ (để điểm danh)
    await probePool.request()
      .input('classId', sql.UniqueIdentifier, testClassId)
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        INSERT INTO dbo.lich_hoc (
          lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, phong_hoc
        )
        VALUES (
          @classId,
          @teacherId,
          DATEADD(DAY, -2, CAST(SYSDATETIME() AS DATE)),
          CAST('08:00:00' AS TIME(0)),
          CAST('10:00:00' AS TIME(0)),
          N'[TEST-P345] Phong 202'
        );
      `);
    const sRes = await probePool.request()
      .input('classId', sql.UniqueIdentifier, testClassId)
      .query(`
        SELECT TOP 1 id FROM dbo.lich_hoc
        WHERE lop_hoc_id = @classId
        ORDER BY ngay_hoc DESC;
      `);
    testScheduleId = sRes.recordset[0].id;

    // 7. Seed Yêu cầu hỗ trợ của giảng viên
    await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        INSERT INTO dbo.yeu_cau_ho_tro (nguoi_dung_id, tieu_de, danh_muc, do_uu_tien, trang_thai)
        VALUES (@teacherId, N'[TEST-P345] Yeu Cau Ho Tro Ky Thuat Tai Khoan', N'ky thuat', N'trung binh', N'moi');
      `);
    const tRes = await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        SELECT TOP 1 id FROM dbo.yeu_cau_ho_tro
        WHERE nguoi_dung_id = @teacherId AND tieu_de = N'[TEST-P345] Yeu Cau Ho Tro Ky Thuat Tai Khoan'
        ORDER BY ngay_tao DESC;
      `);
    testTicketId = tRes.recordset[0].id;

    // Khởi động server HTTP
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

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
    // Dọn dẹp dữ liệu test sạch sẽ
    if (probePool) {
      if (testTicketId) {
        await probePool.request()
          .input('ticketId', sql.UniqueIdentifier, testTicketId)
          .query(`
            DELETE FROM dbo.phan_hoi_ho_tro WHERE yeu_cau_id = @ticketId;
            DELETE FROM dbo.yeu_cau_ho_tro WHERE id = @ticketId;
          `);
      }

      if (testCourseId) {
        await probePool.request()
          .input('courseId', sql.UniqueIdentifier, testCourseId)
          .query(`
            DELETE FROM dbo.diem_danh WHERE lich_hoc_id IN (
              SELECT id FROM dbo.lich_hoc WHERE lop_hoc_id IN (
                SELECT id FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId
              )
            );
            DELETE FROM dbo.lich_hoc WHERE lop_hoc_id IN (
              SELECT id FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId
            );
            DELETE FROM dbo.bai_tap_nop WHERE bai_tap_id IN (
              SELECT id FROM dbo.bai_tap WHERE lop_hoc_id IN (
                SELECT id FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId
              )
            );
            DELETE FROM dbo.bai_tap WHERE lop_hoc_id IN (
              SELECT id FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId
            );
            DELETE FROM dbo.ghi_danh WHERE lop_hoc_id IN (
              SELECT id FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId
            );
            DELETE FROM dbo.lop_hoc WHERE khoa_hoc_id = @courseId;
            DELETE FROM dbo.khoa_hoc WHERE id = @courseId;
          `);
      }

      await probePool.close();
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await sql.close();
  });

  /* ==========================================================================
     PHẦN 1: GIAI ĐOẠN 3 – LỚP HỌC, HỌC VIÊN, BÀI TẬP
     ========================================================================== */
  describe('GIAI ĐOẠN 3: Lớp học, Học viên & Bài tập', () => {

    it('[Real SQL] 3.1. GET /classes trả danh sách lớp do giảng viên phụ trách kèm phân trang', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.classes));
      assert.ok('total' in body.data.pagination);

      // Phải có lớp test vừa tạo
      const found = body.data.classes.find((c) => c.id.toUpperCase() === testClassId.toUpperCase());
      assert.ok(found, 'Phải tìm thấy lớp học test của giảng viên');
      assert.equal(found.tenLop, '[TEST-P345] Lop TOEIC Cap Toc A1');
      assert.ok(found.siSoHienTai >= 1, 'Sĩ số hiện tại phải tính đúng học viên đã ghi danh');
    });

    it('[Real SQL] 3.2. GET /classes/:classId trả chi tiết lớp học của giảng viên', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id.toUpperCase(), testClassId.toUpperCase());
      assert.ok('siSoToiDa' in body.data);
      assert.ok('siSoHienTai' in body.data);
      assert.ok('soBuoiHoc' in body.data);
      assert.ok('soBaiTap' in body.data);
    });

    it('[Real SQL] 3.3. GET /classes/:classId với classId giả mạo hoặc không tồn tại trả HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Không tìm thấy/i);
    });

    it('[Real SQL] 3.4. GET /classes/:classId/students trả danh sách học viên trong lớp', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/students`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.students));
      const student = body.data.students.find((s) => s.hocVienId.toUpperCase() === STUDENT_ID.toUpperCase());
      assert.ok(student, 'Phải có học viên STUDENT_ID trong danh sách');
      assert.equal(student.trangThaiGhiDanh, 'dang hoc');
    });

    it('[Real SQL] 3.5. GET /classes/:classId/students/:studentId trả chi tiết học viên trong lớp', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/students/${STUDENT_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.hocVienId.toUpperCase(), STUDENT_ID.toUpperCase());
      assert.ok('attendance' in body.data);
      assert.ok('courseProgress' in body.data);
      assert.ok('assignments' in body.data);
      assert.ok(!('mat_khau_hash' in body.data));
    });

    it('[Real SQL] 3.6. GET /classes/:classId/assignments trả danh sách bài tập của lớp', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/assignments`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.assignments));
      const found = body.data.assignments.find((a) => a.id.toUpperCase() === testAssignmentId.toUpperCase());
      assert.ok(found, 'Phải tìm thấy bài tập test');
      assert.equal(found.tieuDe, '[TEST-P345] Bai Tap Viet Listening Part 1');
    });

    it('[Real SQL] 3.7. POST /classes/:classId/assignments tạo bài tập mới thành công (status 201)', async () => {
      const payload = {
        tieuDe: '[TEST-P345] Bai Tap Reading Test New',
        moTa: 'Lam bai doc hieu 30 cau',
        hanNop: new Date(Date.now() + 86400000 * 5).toISOString(),
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.id);
      assert.equal(body.data.tieuDe, payload.tieuDe);

      // Dọn bài tập tạm
      await probePool.request()
        .input('id', sql.UniqueIdentifier, body.data.id)
        .query('DELETE FROM dbo.bai_tap WHERE id = @id;');
    });

    it('[Unit] 3.8. POST /classes/:classId/assignments với tiêu đề rỗng trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tieuDe: '   ' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Tiêu đề/i);
    });

    it('[Real SQL] 3.9. PUT /assignments/:assignmentId cập nhật tiêu đề bài tập thành công', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/assignments/${testAssignmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tieuDe: '[TEST-P345] Tieu De Bai Tap Da Cap Nhat' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.tieuDe, '[TEST-P345] Tieu De Bai Tap Da Cap Nhat');
    });

    it('[Real SQL] 3.10. GET /assignments/:assignmentId/submissions trả danh sách bài nộp của bài tập', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/assignments/${testAssignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.submissions));
      const sub = body.data.submissions.find((s) => s.id.toUpperCase() === testSubmissionId.toUpperCase());
      assert.ok(sub, 'Phải tìm thấy bài nộp test');
      assert.equal(sub.hocVienId.toUpperCase(), STUDENT_ID.toUpperCase());
    });

    it('[Real SQL] 3.11. GET /submissions/:submissionId trả chi tiết bài nộp của học viên', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/submissions/${testSubmissionId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id.toUpperCase(), testSubmissionId.toUpperCase());
      assert.ok('hoTenHocVien' in body.data);
      assert.ok('duongDanFile' in body.data);
    });
  });

  /* ==========================================================================
     PHẦN 2: GIAI ĐOẠN 4 – CHẤM ĐIỂM, LỊCH HỌC, ĐIỂM DANH
     ========================================================================== */
  describe('GIAI ĐOẠN 4: Chấm điểm, Lịch học & Điểm danh', () => {

    it('[Real SQL] 4.1. GET /grading/pending trả danh sách các bài nộp chưa chấm của giảng viên', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/grading/pending`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.submissions));
      const found = body.data.submissions.find((s) => s.submissionId.toUpperCase() === testSubmissionId.toUpperCase());
      assert.ok(found, 'Bài nộp test chưa chấm phải nằm trong danh sách pending');
    });

    it('[Real SQL] 4.2. POST /submissions/:submissionId/grade chấm điểm bài nộp thành công', async () => {
      const payload = {
        diem: 85.5,
        nhanXet: 'Bài làm rất tốt, phân tích ngữ pháp chuẩn xác!',
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/submissions/${testSubmissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.diem, 85.5);
      assert.equal(body.data.nhanXet, payload.nhanXet);
      assert.equal(body.data.nguoiChamId.toUpperCase(), TEACHER_ID.toUpperCase());
    });

    it('[Unit] 4.3. POST /submissions/:submissionId/grade với điểm số < 0 hoặc > 100 trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/submissions/${testSubmissionId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ diem: 105 }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Điểm số/i);
    });

    it('[Real SQL] 4.4. GET /grading/stats trả thống kê bài đã chấm và chưa chấm', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/grading/stats`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok('totalSubmissions' in body.data);
      assert.ok('gradedCount' in body.data);
      assert.ok('pendingCount' in body.data);
      assert.ok(body.data.gradedCount >= 1, 'gradedCount phải >= 1 sau khi vừa chấm bài test');
    });

    it('[Real SQL] 4.5. GET /schedules trả danh sách lịch dạy của giảng viên', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      const found = body.data.find((s) => s.id.toUpperCase() === testScheduleId.toUpperCase());
      assert.ok(found, 'Phải tìm thấy lịch dạy test');
    });

    it('[Real SQL] 4.6. POST /schedules tạo buổi học mới thành công (status 201)', async () => {
      // Ngày học nằm trong khoảng lớp học (hôm nay)
      const todayStr = new Date().toISOString().split('T')[0];
      const payload = {
        lopHocId: testClassId,
        ngayHoc: todayStr,
        gioBatDau: '14:00:00',
        gioKetThuc: '16:00:00',
        phongHoc: '[TEST-P345] Phong 301',
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.id);

      // Dọn dẹp buổi học tạm
      await probePool.request()
        .input('id', sql.UniqueIdentifier, body.data.id)
        .query('DELETE FROM dbo.lich_hoc WHERE id = @id;');
    });

    it('[Unit] 4.7. POST /schedules thiếu phòng học và đường link online trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          lopHocId: testClassId,
          ngayHoc: '2026-11-20',
          gioBatDau: '08:00:00',
          gioKetThuc: '10:00:00',
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /phòng học|đường dẫn/i);
    });

    it('[Real SQL] 4.8. GET /schedules/:scheduleId/attendance trả danh sách học viên cần điểm danh', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules/${testScheduleId}/attendance`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.students));
      const student = body.data.students.find((s) => s.hocVienId.toUpperCase() === STUDENT_ID.toUpperCase());
      assert.ok(student, 'Học viên STUDENT_ID phải có trong danh sách điểm danh của buổi học');
    });

    it('[Real SQL] 4.9. POST /schedules/:scheduleId/attendance lưu dữ liệu điểm danh thành công', async () => {
      const payload = {
        records: [
          { hocVienId: STUDENT_ID, trangThai: 'co mat' },
        ],
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules/${testScheduleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.updatedCount, 1);
    });

    it('[Unit] 4.10. POST /schedules/:scheduleId/attendance với trạng thái sai trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/schedules/${testScheduleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          records: [{ hocVienId: STUDENT_ID, trangThai: 'trang_thai_sai' }],
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Trạng thái điểm danh/i);
    });

    it('[Real SQL] 4.11. GET /classes/:classId/attendance-stats trả tỷ lệ chuyên cần của lớp học', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${testClassId}/attendance-stats`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok('totalRecords' in body.data);
      assert.ok('presentCount' in body.data);
      assert.ok('attendanceRate' in body.data);
      assert.equal(typeof body.data.attendanceRate, 'number');
    });
  });

  /* ==========================================================================
     PHẦN 3: GIAI ĐOẠN 5 – BÁO CÁO & HỖ TRỢ
     ========================================================================== */
  describe('GIAI ĐOẠN 5: Báo cáo & Hỗ trợ', () => {

    it('[Real SQL] 5.1. GET /reports/overview trả báo cáo tổng quan từ dữ liệu thật', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/reports/overview`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok('classes' in body.data);
      assert.ok('students' in body.data);
      assert.ok('assignments' in body.data);
      assert.ok('attendance' in body.data);
      assert.ok(body.data.classes.total >= 1, 'Tổng số lớp phải >= 1');
      assert.ok(body.data.students.totalActive >= 1, 'Tổng số học viên active phải >= 1');
    });

    it('[Real SQL] 5.2. GET /reports/classes/:classId trả báo cáo hiệu suất chi tiết của lớp', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/reports/classes/${testClassId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok('classInfo' in body.data);
      assert.ok('assignments' in body.data);
      assert.ok(Array.isArray(body.data.students));
      const st = body.data.students.find((s) => s.hocVienId.toUpperCase() === STUDENT_ID.toUpperCase());
      assert.ok(st, 'Học viên STUDENT_ID phải có trong danh sách báo cáo');
      assert.equal(st.diemTrungBinh, 85.5, 'Điểm trung bình phải tính đúng bài đã chấm');
    });

    it('[Real SQL] 5.3. POST /reports tạo bản ghi báo cáo thành công trong dbo.bao_cao', async () => {
      const payload = {
        loaiBaoCao: 'diem danh',
        boLoc: { classId: testClassId, term: '2026-Q4' },
        duongDanTep: '/exports/attendance_report_2026.pdf',
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.id);
      assert.equal(body.data.loaiBaoCao, 'diem danh');

      // Dọn dẹp bản ghi báo cáo tạm
      await probePool.request()
        .input('id', sql.UniqueIdentifier, body.data.id)
        .query('DELETE FROM dbo.bao_cao WHERE id = @id;');
    });

    it('[Unit] 5.4. POST /reports với loại báo cáo không hợp lệ trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ loaiBaoCao: 'khong_hop_le' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Loại báo cáo/i);
    });

    it('[Real SQL] 5.5. GET /support/tickets lấy danh sách yêu cầu hỗ trợ của giảng viên', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/support/tickets`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.tickets));
      const found = body.data.tickets.find((t) => t.id.toUpperCase() === testTicketId.toUpperCase());
      assert.ok(found, 'Phải tìm thấy yêu cầu hỗ trợ test');
    });

    it('[Real SQL] 5.6. GET /support/tickets/:ticketId trả chi tiết yêu cầu kèm tin nhắn phản hồi', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/support/tickets/${testTicketId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.id.toUpperCase(), testTicketId.toUpperCase());
      assert.ok(Array.isArray(body.data.messages));
    });

    it('[Real SQL] 5.7. POST /support/tickets/:ticketId/reply gửi phản hồi hỗ trợ thành công (status 201)', async () => {
      const payload = {
        noiDung: 'Tôi đã kiểm tra lại và cần trợ giúp thêm về tính năng xuất file điểm danh.',
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/support/tickets/${testTicketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify(payload),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.noiDung, payload.noiDung);
      assert.equal(body.data.nguoiGuiId.toUpperCase(), TEACHER_ID.toUpperCase());
    });

    it('[Unit] 5.8. POST /support/tickets/:ticketId/reply với nội dung rỗng trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/support/tickets/${testTicketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ noiDung: '' }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Nội dung/i);
    });
  });

  /* ==========================================================================
     PHẦN 4: BẢO MẬT & TRANSACTION TOÀN HỆ THỐNG
     ========================================================================== */
  describe('BẢO MẬT & TRANSACTION TOÀN HỆ THỐNG', () => {

    it('[Real SQL] 6.1. Học viên cố truy cập endpoint lớp của giảng viên trả HTTP 403', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Bạn không có quyền truy cập chức năng này/i);
    });

    it('[Real SQL] 6.2. Mọi truy vấn đều sử dụng req.user.id không thể bị can thiệp bằng query teacherId', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes?teacherId=${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      // Kết quả vẫn trả về lớp học của TEACHER_ID thật
      const found = body.data.classes.find((c) => c.id.toUpperCase() === testClassId.toUpperCase());
      assert.ok(found);
    });

    it('[Real SQL] 6.3. Không rò rỉ thông tin mật khẩu hoặc cấu trúc SQL trong các phản hồi lỗi', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/classes/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.doesNotMatch(body.message, /SELECT|INSERT|UPDATE|DELETE|dbo\.|localhost|1433/i);
    });
  });
});
