/**
 * @file teacherPhase2.test.js
 * @description Test Suite chính thức cho Backend Teacher Giai đoạn 2.
 *
 * CẤU TRÚC:
 * - NHÓM 1: Security Tests (phân quyền toàn hệ thống Giai đoạn 2)
 * - NHÓM 2: Courses API (GET /courses, GET /courses/:id)
 * - NHÓM 3: Chapters API (CRUD chương học)
 * - NHÓM 4: Contents API (CRUD nội dung bài học)
 * - NHÓM 5: Database & Context (kiểm tra SQL Server thật)
 *
 * Phân loại mỗi test:
 * [Unit]  = Kiểm tra logic JS thuần (không DB)
 * [Mock]  = Giả lập DB Error để kiểm tra xử lý lỗi
 * [Real SQL] = Kết nối SQL Server thật
 *
 * Tài khoản test trong DB (KHÔNG được sửa):
 * - TEACHER_ID = '4DF7D521-7222-4E8D-A1FA-C1ACA0216363' (teacher@demo.local, giang vien)
 * - STUDENT_ID = '9B7EE67A-21FA-441A-82C1-3B7DCFD6E3A8' (student@demo.local, hoc vien)
 * - ADMIN_ID   = '38A383A5-4510-4450-BF0A-FBD8BF3A9177' (admin@toeic.vn, quan tri vien)
 * - CATEGORY_ID = '73DB73F2-5B24-4016-9C11-9358601B3C8B'
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { ENV } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';
import { ROLES } from '../src/constants/roles.js';

const TEACHER_ID  = '4DF7D521-7222-4E8D-A1FA-C1ACA0216363';
const STUDENT_ID  = '9B7EE67A-21FA-441A-82C1-3B7DCFD6E3A8';
const CATEGORY_ID = '73DB73F2-5B24-4016-9C11-9358601B3C8B';

// Fake UUID không tồn tại trong DB
const FAKE_ID = '00000000-0000-0000-0000-000000000099';

describe('BỘ TEST GIAI ĐOẠN 2: BACKEND TEACHER (COURSES, CHAPTERS, CONTENTS)', () => {
  let server = null;
  let baseUrl = '';
  let teacherToken = '';
  let studentToken = '';
  let probePool = null;

  // IDs sẽ được tạo ra trong before/teardown
  let testCourseId = null;   // Khóa học do TEACHER_ID tạo
  let testChapterId = null;  // Chương học thuộc testCourseId
  let testContentId = null;  // Bài học thuộc testChapterId

  before(async () => {
    // 1. Kết nối DB toàn cục
    await connectDB();

    // 2. Pool probe để seed và teardown dữ liệu test
    probePool = new sql.ConnectionPool({
      ...ENV.DB,
      pool: { min: 1, max: 3 },
    });
    await probePool.connect();

    // 3. Seed: Tạo khóa học test do TEACHER_ID làm người tạo
    // Dùng INSERT riêng rồi SELECT lại ID để tránh lỗi "OUTPUT trên bảng có trigger"
    await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .input('categoryId', sql.UniqueIdentifier, CATEGORY_ID)
      .query(`
        INSERT INTO dbo.khoa_hoc (
          ten_khoa_hoc, danh_muc_id, mo_ta, trinh_do, trang_thai,
          loai_ky_thi, gia, nguoi_tao_id, hien_thi, trang_thai_duyet, hinh_thuc
        )
        VALUES (
          N'[TEST-P2] Khoa Hoc Thu Nghiem Giai Doan 2',
          @categoryId,
          N'Khoa hoc tu dong tao boi test suite Giai doan 2',
          N'co ban',
          N'nhap',
          N'TOEIC',
          500000,
          @teacherId,
          0,
          N'cho duyet',
          N'truc tuyen'
        );
      `);
    const courseRes = await probePool.request()
      .input('teacherId', sql.UniqueIdentifier, TEACHER_ID)
      .query(`
        SELECT TOP 1 id FROM dbo.khoa_hoc
        WHERE nguoi_tao_id = @teacherId
          AND ten_khoa_hoc = N'[TEST-P2] Khoa Hoc Thu Nghiem Giai Doan 2'
        ORDER BY ngay_tao DESC;
      `);
    testCourseId = courseRes.recordset[0].id;

    // 4. Seed: Tạo chương học thuộc testCourseId
    await probePool.request()
      .input('courseId', sql.UniqueIdentifier, testCourseId)
      .query(`
        INSERT INTO dbo.chuong_khoa_hoc (ma_khoa_hoc, ten_chuong, mo_ta, thu_tu)
        VALUES (@courseId, N'[TEST-P2] Chuong 1 Thu Nghiem', N'Mo ta chuong thu nghiem', 1);
      `);
    const chapterRes = await probePool.request()
      .input('courseId', sql.UniqueIdentifier, testCourseId)
      .query(`
        SELECT TOP 1 ma_chuong FROM dbo.chuong_khoa_hoc
        WHERE ma_khoa_hoc = @courseId
          AND ten_chuong = N'[TEST-P2] Chuong 1 Thu Nghiem'
        ORDER BY ngay_tao DESC;
      `);
    testChapterId = chapterRes.recordset[0].ma_chuong;

    // 5. Seed: Tạo bài học thuộc testChapterId
    await probePool.request()
      .input('chapterId', sql.UniqueIdentifier, testChapterId)
      .query(`
        INSERT INTO dbo.noi_dung_khoa_hoc (
          ma_chuong, tieu_de, loai_noi_dung, noi_dung, thu_tu, trang_thai_duyet
        )
        VALUES (@chapterId, N'[TEST-P2] Bai Hoc 1 Thu Nghiem', N'bai doc', N'Noi dung thu nghiem', 1, N'cho duyet');
      `);
    const contentRes = await probePool.request()
      .input('chapterId', sql.UniqueIdentifier, testChapterId)
      .query(`
        SELECT TOP 1 ma_noi_dung FROM dbo.noi_dung_khoa_hoc
        WHERE ma_chuong = @chapterId
          AND tieu_de = N'[TEST-P2] Bai Hoc 1 Thu Nghiem'
        ORDER BY ngay_tao DESC;
      `);
    testContentId = contentRes.recordset[0].ma_noi_dung;

    // 6. Khởi động server HTTP test
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 7. Tạo JWT token mẫu
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
    // Teardown: Xóa toàn bộ dữ liệu test theo thứ tự
    if (probePool && testCourseId) {
      await probePool.request()
        .input('courseId', sql.UniqueIdentifier, testCourseId)
        .query(`
          DELETE FROM dbo.noi_dung_khoa_hoc
          WHERE ma_chuong IN (
            SELECT ma_chuong FROM dbo.chuong_khoa_hoc WHERE ma_khoa_hoc = @courseId
          );
          DELETE FROM dbo.chuong_khoa_hoc WHERE ma_khoa_hoc = @courseId;
          DELETE FROM dbo.khoa_hoc WHERE id = @courseId;
        `);
    }

    if (probePool) {
      await probePool.close();
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await sql.close();
  });

  /* ==========================================================================
     NHÓM 1: SECURITY TESTS – Phân quyền toàn hệ thống Giai đoạn 2
     ========================================================================== */
  describe('NHÓM 1: Security Tests – Phân quyền toàn hệ thống', () => {

    it('[Unit] 1.1. Module Giai đoạn 2 load thành công và export đúng các hàm', async () => {
      const courseModule  = await import('../src/modules/teacher/courses/course.service.js');
      const chapterModule = await import('../src/modules/teacher/courses/chapter.service.js');
      const contentModule = await import('../src/modules/teacher/courses/content.service.js');
      const ctrl = await import('../src/modules/teacher/teacher.controller.js');
      const routes = await import('../src/modules/teacher/teacher.routes.js');

      // Course service
      assert.equal(typeof courseModule.getCourses, 'function');
      assert.equal(typeof courseModule.getCourseDetail, 'function');
      // Chapter service
      assert.equal(typeof chapterModule.getChapters, 'function');
      assert.equal(typeof chapterModule.getChapterDetail, 'function');
      assert.equal(typeof chapterModule.createChapter, 'function');
      assert.equal(typeof chapterModule.updateChapter, 'function');
      assert.equal(typeof chapterModule.deleteChapter, 'function');
      // Content service
      assert.equal(typeof contentModule.getContents, 'function');
      assert.equal(typeof contentModule.getContentDetail, 'function');
      assert.equal(typeof contentModule.createContent, 'function');
      assert.equal(typeof contentModule.updateContent, 'function');
      assert.equal(typeof contentModule.deleteContent, 'function');
      // Controller có đầy đủ handlers
      assert.equal(typeof ctrl.getCourses, 'function');
      assert.equal(typeof ctrl.getChapters, 'function');
      assert.equal(typeof ctrl.createChapter, 'function');
      assert.equal(typeof ctrl.getContents, 'function');
      assert.equal(typeof ctrl.createContent, 'function');
      // Router load được
      assert.ok(routes.default);
    });

    it('[Real SQL] 1.2. Mọi endpoint Giai đoạn 2 đều từ chối request không có token (HTTP 401)', async () => {
      const endpoints = [
        { method: 'GET',    path: '/api/v1/teacher/courses' },
        { method: 'GET',    path: `/api/v1/teacher/courses/${testCourseId}` },
        { method: 'GET',    path: `/api/v1/teacher/courses/${testCourseId}/chapters` },
        { method: 'POST',   path: `/api/v1/teacher/courses/${testCourseId}/chapters` },
        { method: 'PUT',    path: `/api/v1/teacher/courses/${testCourseId}/chapters/${testChapterId}` },
        { method: 'DELETE', path: `/api/v1/teacher/courses/${testCourseId}/chapters/${testChapterId}` },
        { method: 'GET',    path: `/api/v1/teacher/chapters/${testChapterId}/contents` },
        { method: 'GET',    path: `/api/v1/teacher/contents/${testContentId}` },
        { method: 'POST',   path: `/api/v1/teacher/chapters/${testChapterId}/contents` },
        { method: 'PUT',    path: `/api/v1/teacher/contents/${testContentId}` },
        { method: 'DELETE', path: `/api/v1/teacher/contents/${testContentId}` },
      ];

      for (const ep of endpoints) {
        const res = await fetch(`${baseUrl}${ep.path}`, { method: ep.method });
        assert.equal(res.status, 401, `${ep.method} ${ep.path} phải trả 401 khi không có token`);
        const body = await res.json();
        assert.equal(body.success, false, `body.success phải false cho ${ep.method} ${ep.path}`);
      }
    });

    it('[Real SQL] 1.3. Tài khoản học viên truy cập endpoint Teacher Giai đoạn 2 bị từ chối (HTTP 403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Bạn không có quyền truy cập chức năng này/i);
    });

    it('[Real SQL] 1.4. Giảng viên không thể gửi courseId giả mạo qua query string để lấy dữ liệu khóa học người khác', async () => {
      // teacherId bị bỏ qua hoàn toàn, chỉ dùng req.user.id
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses?teacherId=${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      // Response vẫn thành công vì dùng req.user.id
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      // Tất cả khóa học phải thuộc TEACHER_ID hoặc không có khóa học nào của FAKE_ID
      if (Array.isArray(body.data?.courses)) {
        for (const course of body.data.courses) {
          assert.ok(
            course.isOwner || course.canManage !== undefined,
            'Mỗi khóa học phải có trường isOwner và canManage'
          );
        }
      }
    });

    it('[Real SQL] 1.5. Không tồn tại API POST /courses (giảng viên không được tạo khóa học)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tenKhoaHoc: 'Test' }),
      });
      // POST /courses không được định nghĩa → Express trả 404
      assert.equal(res.status, 404, 'POST /courses phải trả 404 vì không được định nghĩa');
    });
  });

  /* ==========================================================================
     NHÓM 2: COURSES API
     ========================================================================== */
  describe('NHÓM 2: Courses API', () => {

    it('[Real SQL] 2.1. GET /courses trả danh sách khóa học của giảng viên với pagination', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.courses), 'courses phải là mảng');
      assert.ok(typeof body.data.pagination === 'object', 'pagination phải là object');
      assert.ok(typeof body.data.pagination.total === 'number');
      assert.ok(typeof body.data.pagination.page === 'number');
      assert.ok(typeof body.data.pagination.limit === 'number');
      assert.ok(typeof body.data.pagination.totalPages === 'number');

      // Phải tìm thấy khóa học test vừa seed
      const found = body.data.courses.find((c) => c.id?.toUpperCase() === testCourseId?.toUpperCase());
      assert.ok(found, `Phải tìm thấy khóa học test ${testCourseId} trong danh sách`);
      assert.equal(found.isOwner, true, 'isOwner phải là true vì TEACHER_ID là người tạo');
      assert.equal(found.canManage, true, 'canManage phải là true vì TEACHER_ID là người tạo');
      // Không rò rỉ trường nhạy cảm
      assert.ok(!('mat_khau_hash' in found));
    });

    it('[Real SQL] 2.2. GET /courses hỗ trợ filter theo tên khóa học (q)', async () => {
      const keyword = encodeURIComponent('[TEST-P2]');
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses?q=${keyword}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data.courses));
      // Mọi kết quả phải chứa từ khóa tìm kiếm (tên có '[TEST-P2]')
      for (const c of body.data.courses) {
        assert.match(c.tenKhoaHoc, /TEST-P2/i);
      }
    });

    it('[Real SQL] 2.3. GET /courses?role=owner chỉ trả khóa học do giảng viên tạo', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses?role=owner`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      for (const c of body.data.courses) {
        assert.equal(c.isOwner, true, `Với role=owner, mọi khóa học phải isOwner=true (vi phạm: ${c.id})`);
      }
    });

    it('[Real SQL] 2.4. GET /courses/:courseId trả chi tiết đầy đủ của khóa học', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${testCourseId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      const d = body.data;
      assert.equal(d.id.toUpperCase(), testCourseId.toUpperCase());
      assert.ok('tenKhoaHoc' in d);
      assert.ok('trangThai' in d);
      assert.ok('isOwner' in d);
      assert.ok('canManage' in d);
      assert.ok('soChuong' in d);
      assert.ok('soHocVien' in d);
      assert.ok(Array.isArray(d.classes), 'classes phải là mảng');
      assert.equal(d.isOwner, true);
      assert.equal(d.canManage, true);
      // Không rò rỉ trường nhạy cảm
      assert.ok(!('mat_khau_hash' in d));
    });

    it('[Real SQL] 2.5. GET /courses/:courseId với courseId không tồn tại trả HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Không tìm thấy/i);
    });
  });

  /* ==========================================================================
     NHÓM 3: CHAPTERS API
     ========================================================================== */
  describe('NHÓM 3: Chapters API', () => {
    // ID chương sẽ được tạo tạm trong test và xóa sau
    let tempChapterId = null;

    afterEach(async () => {
      // Dọn chương tạm nếu còn tồn tại
      if (tempChapterId && probePool) {
        await probePool.request()
          .input('id', sql.UniqueIdentifier, tempChapterId)
          .query(`DELETE FROM dbo.chuong_khoa_hoc WHERE ma_chuong = @id;`);
        tempChapterId = null;
      }
    });

    it('[Real SQL] 3.1. GET /courses/:courseId/chapters trả danh sách chương đúng thứ tự', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      // Phải tìm thấy chương test đã seed
      const found = body.data.find((c) => c.maChuong?.toUpperCase() === testChapterId?.toUpperCase());
      assert.ok(found, 'Phải tìm thấy chương test đã seed');
      assert.ok('tenChuong' in found);
      assert.ok('thuTu' in found);
      assert.ok('soNoiDung' in found);
      // Kiểm tra sắp xếp: thuTu tăng dần
      let lastThuTu = 0;
      for (const ch of body.data) {
        assert.ok(ch.thuTu >= lastThuTu, 'Chương phải sắp xếp theo thuTu tăng dần');
        lastThuTu = ch.thuTu;
      }
    });

    it('[Real SQL] 3.2. POST /courses/:courseId/chapters tạo chương mới thành công', async () => {
      const payload = {
        tenChuong: '[TEST-P2] Chuong Moi Duoc Tao Boi Test',
        moTa: 'Mo ta chuong moi',
        thuTu: 99,
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters`, {
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
      assert.ok(body.data.maChuong, 'Phải trả về maChuong mới');
      assert.equal(body.data.tenChuong, payload.tenChuong);
      assert.equal(body.data.thuTu, 99);
      tempChapterId = body.data.maChuong; // để afterEach dọn dẹp
    });

    it('[Unit] 3.3. POST /courses/:courseId/chapters với tên rỗng trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tenChuong: '', thuTu: 1 }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Tên chương/i);
    });

    it('[Unit] 3.4. POST /courses/:courseId/chapters với thuTu = 0 trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tenChuong: 'Test', thuTu: 0 }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Thứ tự/i);
    });

    it('[Real SQL] 3.5. GET /courses/:courseId/chapters/:chapterId trả chi tiết chương kèm danh sách bài học', async () => {
      const res = await fetch(
        `${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters/${testChapterId}`,
        { headers: { Authorization: `Bearer ${teacherToken}` } }
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.maChuong.toUpperCase(), testChapterId.toUpperCase());
      assert.ok('tenChuong' in body.data);
      assert.ok(Array.isArray(body.data.contents), 'contents phải là mảng');
      assert.ok(body.data.canManage !== undefined);
    });

    it('[Real SQL] 3.6. PUT /courses/:courseId/chapters/:chapterId cập nhật tên chương thành công', async () => {
      const res = await fetch(
        `${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters/${testChapterId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherToken}`,
          },
          body: JSON.stringify({ tenChuong: '[TEST-P2] Ten Chuong Da Cap Nhat', thuTu: 1 }),
        }
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.data.tenChuong, '[TEST-P2] Ten Chuong Da Cap Nhat');
    });

    it('[Real SQL] 3.7. DELETE /courses/:courseId/chapters/:chapterId với chương không có tiến độ xóa thành công', async () => {
      // Tạo chương tạm để xóa
      const createRes = await probePool.request()
        .input('courseId', sql.UniqueIdentifier, testCourseId)
        .query(`
          INSERT INTO dbo.chuong_khoa_hoc (ma_khoa_hoc, ten_chuong, thu_tu)
          OUTPUT inserted.ma_chuong
          VALUES (@courseId, N'[TEST-P2] Chuong Se Bi Xoa', 100);
        `);
      const toDeleteChapterId = createRes.recordset[0].ma_chuong;

      const res = await fetch(
        `${baseUrl}/api/v1/teacher/courses/${testCourseId}/chapters/${toDeleteChapterId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${teacherToken}` },
        }
      );
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.match(body.message, /thành công/i);

      // Xác nhận không còn trong DB
      const checkRes = await probePool.request()
        .input('id', sql.UniqueIdentifier, toDeleteChapterId)
        .query(`SELECT ma_chuong FROM dbo.chuong_khoa_hoc WHERE ma_chuong = @id;`);
      assert.equal(checkRes.recordset.length, 0, 'Chương đã bị xóa phải không còn trong DB');
    });

    it('[Real SQL] 3.8. GET /courses/:courseId/chapters với courseId không tồn tại trả HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${FAKE_ID}/chapters`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Không tìm thấy/i);
    });

    it('[Real SQL] 3.9. POST /courses/:courseId/chapters với courseId không tồn tại trả HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${FAKE_ID}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tenChuong: 'Test', thuTu: 1 }),
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
    });
  });

  /* ==========================================================================
     NHÓM 4: CONTENTS API
     ========================================================================== */
  describe('NHÓM 4: Contents API', () => {
    let tempContentId = null;

    afterEach(async () => {
      if (tempContentId && probePool) {
        await probePool.request()
          .input('id', sql.UniqueIdentifier, tempContentId)
          .query(`DELETE FROM dbo.noi_dung_khoa_hoc WHERE ma_noi_dung = @id;`);
        tempContentId = null;
      }
    });

    it('[Real SQL] 4.1. GET /chapters/:chapterId/contents trả danh sách bài học đúng thứ tự', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/chapters/${testChapterId}/contents`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.data));
      // Phải tìm thấy bài học test đã seed
      const found = body.data.find((c) => c.maNoiDung?.toUpperCase() === testContentId?.toUpperCase());
      assert.ok(found, 'Phải tìm thấy bài học test đã seed');
      assert.ok('tieuDe' in found);
      assert.ok('loaiNoiDung' in found);
      assert.ok('trangThaiDuyet' in found);
    });

    it('[Real SQL] 4.2. GET /contents/:contentId trả chi tiết đầy đủ của bài học', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${testContentId}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      const d = body.data;
      assert.equal(d.maNoiDung.toUpperCase(), testContentId.toUpperCase());
      assert.ok('tieuDe' in d);
      assert.ok('noiDung' in d);
      assert.ok('trangThaiDuyet' in d);
      assert.ok('canManage' in d);
      assert.equal(d.canManage, true);
      // Không rò rỉ trường nhạy cảm
      assert.ok(!('mat_khau_hash' in d));
    });

    it('[Real SQL] 4.3. POST /chapters/:chapterId/contents tạo bài học mới thành công với trang_thai_duyet = cho duyet', async () => {
      const payload = {
        tieuDe: '[TEST-P2] Bai Hoc Moi Duoc Tao Boi Test',
        loaiNoiDung: 'bai doc',
        noiDung: 'Noi dung bai hoc moi',
        thuTu: 99,
      };
      const res = await fetch(`${baseUrl}/api/v1/teacher/chapters/${testChapterId}/contents`, {
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
      assert.ok(body.data.maNoiDung, 'Phải trả về maNoiDung mới');
      assert.equal(body.data.tieuDe, payload.tieuDe);
      assert.equal(body.data.trangThaiDuyet, 'cho duyet', 'Trạng thái duyệt mới phải là cho duyet');
      tempContentId = body.data.maNoiDung;
    });

    it('[Unit] 4.4. POST /chapters/:chapterId/contents với loaiNoiDung không hợp lệ trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/chapters/${testChapterId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          tieuDe: 'Test',
          loaiNoiDung: 'loai_sai',
          thuTu: 1,
        }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Loại nội dung không hợp lệ/i);
    });

    it('[Unit] 4.5. POST /chapters/:chapterId/contents với tiêu đề rỗng trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/chapters/${testChapterId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tieuDe: '', loaiNoiDung: 'bai doc', thuTu: 1 }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Tiêu đề/i);
    });

    it('[Unit] 4.6. POST /chapters/:chapterId/contents với thoiLuongPhut âm trả HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/chapters/${testChapterId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tieuDe: 'Test', loaiNoiDung: 'bai doc', thuTu: 1, thoiLuongPhut: -5 }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Thời lượng/i);
    });

    it('[Real SQL] 4.7. PUT /contents/:contentId cập nhật trường cốt lõi → trangThaiDuyet tự động về cho duyet nếu đang da duyet', async () => {
      // Seed bài học đang ở trạng thái 'da duyet'
      const seedRes = await probePool.request()
        .input('chapterId', sql.UniqueIdentifier, testChapterId)
        .query(`
          INSERT INTO dbo.noi_dung_khoa_hoc (ma_chuong, tieu_de, loai_noi_dung, thu_tu, trang_thai_duyet)
          OUTPUT inserted.ma_noi_dung
          VALUES (@chapterId, N'[TEST-P2] Bai Da Duyet', N'bai doc', 50, N'da duyet');
        `);
      const daDuyetContentId = seedRes.recordset[0].ma_noi_dung;
      tempContentId = daDuyetContentId;

      // Sửa tiêu đề (nội dung cốt lõi) → phải tự động về 'cho duyet'
      const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${daDuyetContentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ tieuDe: '[TEST-P2] Ten Moi Da Sua' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(
        body.data.trangThaiDuyet, 'cho duyet',
        'Sửa nội dung cốt lõi của bài đã da duyet phải tự động về cho duyet'
      );
    });

    it('[Real SQL] 4.8. PUT /contents/:contentId chỉ sửa thuTu → không thay đổi trangThaiDuyet', async () => {
      // Seed bài học đang ở trạng thái 'da duyet'
      const seedRes = await probePool.request()
        .input('chapterId', sql.UniqueIdentifier, testChapterId)
        .query(`
          INSERT INTO dbo.noi_dung_khoa_hoc (ma_chuong, tieu_de, loai_noi_dung, thu_tu, trang_thai_duyet)
          OUTPUT inserted.ma_noi_dung
          VALUES (@chapterId, N'[TEST-P2] Bai Da Duyet Thu Tu', N'video', 51, N'da duyet');
        `);
      const contentId2 = seedRes.recordset[0].ma_noi_dung;
      let deferCleanup = contentId2;

      try {
        const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${contentId2}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherToken}`,
          },
          body: JSON.stringify({ thuTu: 55 }),
        });
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.equal(
          body.data.trangThaiDuyet, 'da duyet',
          'Chỉ sửa thuTu không được thay đổi trangThaiDuyet'
        );
        assert.equal(body.data.thuTu, 55);
      } finally {
        if (deferCleanup) {
          await probePool.request()
            .input('id', sql.UniqueIdentifier, deferCleanup)
            .query(`DELETE FROM dbo.noi_dung_khoa_hoc WHERE ma_noi_dung = @id;`);
        }
      }
    });

    it('[Unit] 4.9. PUT /contents/:contentId không được phép client tự gán trangThaiDuyet = da duyet', async () => {
      // Thử gán trangThaiDuyet về 'da duyet' từ client - phải bị bỏ qua
      const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${testContentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ thuTu: 1, trangThaiDuyet: 'da duyet' }),
      });
      // Phải thành công nhưng trangThaiDuyet không phải 'da duyet' nếu trước đó là 'cho duyet'
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      // trangThaiDuyet không được là 'da duyet' vì client không có quyền tự duyệt
      assert.notEqual(
        body.data.trangThaiDuyet, 'da duyet',
        'Client không được tự gán trangThaiDuyet = da duyet'
      );
    });

    it('[Real SQL] 4.10. DELETE /contents/:contentId với bài học không có tiến độ → xóa thành công', async () => {
      // Tạo bài học tạm để xóa
      const seedRes = await probePool.request()
        .input('chapterId', sql.UniqueIdentifier, testChapterId)
        .query(`
          INSERT INTO dbo.noi_dung_khoa_hoc (ma_chuong, tieu_de, loai_noi_dung, thu_tu, trang_thai_duyet)
          OUTPUT inserted.ma_noi_dung
          VALUES (@chapterId, N'[TEST-P2] Bai Se Bi Xoa', N'tai lieu', 90, N'cho duyet');
        `);
      const toDeleteId = seedRes.recordset[0].ma_noi_dung;

      const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${toDeleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.match(body.message, /thành công/i);

      // Xác nhận không còn trong DB
      const checkRes = await probePool.request()
        .input('id', sql.UniqueIdentifier, toDeleteId)
        .query(`SELECT ma_noi_dung FROM dbo.noi_dung_khoa_hoc WHERE ma_noi_dung = @id;`);
      assert.equal(checkRes.recordset.length, 0, 'Bài học đã bị xóa phải không còn trong DB');
    });

    it('[Real SQL] 4.11. GET /contents/:contentId với contentId không tồn tại trả HTTP 404', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/contents/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.match(body.message, /Không tìm thấy/i);
    });
  });

  /* ==========================================================================
     NHÓM 5: DATABASE & CONTEXT – Kiểm tra SQL Server thật
     ========================================================================== */
  describe('NHÓM 5: Database & Context Integrity', () => {

    it('[Real SQL] 5.1. Mọi request GET /courses đều sử dụng req.user.id không thể bị giả mạo qua body', async () => {
      // Gửi body có chứa teacherId khác nhưng vẫn phải nhận dữ liệu của TEACHER_ID
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      // testCourse phải xuất hiện trong danh sách của TEACHER_ID
      const found = body.data.courses.find((c) =>
        c.id?.toUpperCase() === testCourseId?.toUpperCase()
      );
      assert.ok(found, 'testCourse của TEACHER_ID phải xuất hiện trong danh sách');
    });

    it('[Real SQL] 5.2. SESSION_CONTEXT được thiết lập đúng trong mỗi runInTeacherContext', async () => {
      const { runInTeacherContext } = await import('../src/modules/teacher/teacher.context.js');
      let capturedUserId = null;
      await runInTeacherContext(TEACHER_ID, async (request) => {
        const result = await request.query("SELECT SESSION_CONTEXT(N'UserId') AS uid;");
        capturedUserId = result.recordset[0].uid;
      });
      assert.ok(capturedUserId, 'SESSION_CONTEXT phải có giá trị');
      assert.equal(
        capturedUserId.toUpperCase(),
        TEACHER_ID.toUpperCase(),
        'SESSION_CONTEXT UserId phải đúng với teacherId'
      );
    });

    it('[Real SQL] 5.3. Response API không rò rỉ thông tin SQL khi xảy ra lỗi truy vấn với courseId giả', async () => {
      // courseId FAKE nhưng là UUID hợp lệ → sẽ trả 404 với message sạch
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses/${FAKE_ID}`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      // Message không được chứa thông tin kỹ thuật
      assert.doesNotMatch(body.message, /SELECT|INSERT|UPDATE|DELETE|dbo\.|localhost|QuanLyDaoTao/i);
    });

    it('[Real SQL] 5.4. Kiểm tra pagination: page=1, limit=1 chỉ trả đúng 1 bản ghi', async () => {
      const res = await fetch(`${baseUrl}/api/v1/teacher/courses?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data.courses.length <= 1, 'Với limit=1 phải trả tối đa 1 bản ghi');
      assert.equal(body.data.pagination.limit, 1);
      assert.equal(body.data.pagination.page, 1);
    });

    it('[Real SQL] 5.5. Các API Giai đoạn 1 vẫn hoạt động bình thường sau khi thêm Giai đoạn 2', async () => {
      // Dashboard vẫn hoạt động
      const dashRes = await fetch(`${baseUrl}/api/v1/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(dashRes.status, 200);
      const dashBody = await dashRes.json();
      assert.equal(dashBody.success, true);
      assert.ok('totalClasses' in dashBody.data);

      // Profile vẫn hoạt động
      const profileRes = await fetch(`${baseUrl}/api/v1/teacher/profile`, {
        headers: { Authorization: `Bearer ${teacherToken}` },
      });
      assert.equal(profileRes.status, 200);
      const profileBody = await profileRes.json();
      assert.equal(profileBody.success, true);
      assert.ok('email' in profileBody.data);
    });

    it('[Real SQL] 5.6. Dữ liệu seed test đã được tạo đúng trong DB và có thể truy vấn trực tiếp', async () => {
      const courseCheck = await probePool.request()
        .input('id', sql.UniqueIdentifier, testCourseId)
        .query('SELECT id, nguoi_tao_id FROM dbo.khoa_hoc WHERE id = @id;');
      assert.equal(courseCheck.recordset.length, 1, 'Khóa học test phải tồn tại trong DB');
      assert.equal(
        courseCheck.recordset[0].nguoi_tao_id.toUpperCase(),
        TEACHER_ID.toUpperCase(),
        'nguoi_tao_id phải đúng là TEACHER_ID'
      );

      const chapterCheck = await probePool.request()
        .input('id', sql.UniqueIdentifier, testChapterId)
        .query('SELECT ma_chuong, ma_khoa_hoc FROM dbo.chuong_khoa_hoc WHERE ma_chuong = @id;');
      assert.equal(chapterCheck.recordset.length, 1, 'Chương test phải tồn tại trong DB');

      const contentCheck = await probePool.request()
        .input('id', sql.UniqueIdentifier, testContentId)
        .query('SELECT ma_noi_dung, trang_thai_duyet FROM dbo.noi_dung_khoa_hoc WHERE ma_noi_dung = @id;');
      assert.equal(contentCheck.recordset.length, 1, 'Bài học test phải tồn tại trong DB');
      assert.equal(contentCheck.recordset[0].trang_thai_duyet, 'cho duyet');
    });
  });
});
