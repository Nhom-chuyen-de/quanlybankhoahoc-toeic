/**
 * @file teacherContext.test.js
 * @description Test Suite chính thức cho module teacher.context.js.
 * Phân tách rõ ràng 3 nhóm kiểm thử:
 * - PHẦN 1: UNIT TESTS THUẦN TÚY (Không dùng mock DB, kiểm tra Semaphore & Error Normalizer).
 * - PHẦN 2: UNIT TESTS DÙNG MOCK (Mô phỏng lỗi vòng đời Dedicated Pool, Transaction, Commit, Rollback, Close).
 * - PHẦN 3: INTEGRATION TESTS (Kết nối trực tiếp Microsoft SQL Server thật, không mock).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import sql from 'mssql';
import { ENV } from '../src/config/env.js';
import {
  runInTeacherContext,
  normalizeDatabaseError,
  TeacherConcurrencyLimiter,
} from '../src/modules/teacher/teacher.context.js';

// ID tài khoản mẫu có sẵn trong Database QuanLyDaoTao_HopNhat
const TEACHER_ID = '4DF7D521-7222-4E8D-A1FA-C1ACA0216363'; // Giang Vien Demo (giang vien)
const STUDENT_ID = '9B7EE67A-21FA-441A-82C1-3B7DCFD6E3A8'; // Hoc Vien Demo (hoc vien)

// ============================================================================
// PHẦN 1: UNIT TESTS THUẦN TÚY (Không phụ thuộc Database, không dùng Mock)
// ============================================================================
describe('PHẦN 1 - UNIT TESTS: Semaphore & Error Security Normalizer', () => {
  describe('TeacherConcurrencyLimiter (Semaphore)', () => {
    it('không vượt quá maxConcurrent khi có nhiều request chạy đồng thời', async () => {
      const limiter = new TeacherConcurrencyLimiter(3, 2000);
      let currentRunning = 0;
      let peakRunning = 0;
      let completed = 0;

      const tasks = Array.from({ length: 10 }, async () => {
        await limiter.acquire();
        try {
          currentRunning++;
          if (currentRunning > peakRunning) peakRunning = currentRunning;
          assert.ok(limiter.getStats().active <= 3, 'activeCount không được vượt maxConcurrent');
          await new Promise((r) => setTimeout(r, 15));
          completed++;
        } finally {
          currentRunning--;
          limiter.release();
        }
      });

      await Promise.all(tasks);
      assert.equal(completed, 10, 'Không được mất request nào trong hàng đợi');
      assert.ok(peakRunning <= 3, 'Số tác vụ chạy song song tối đa không vượt quá 3');
      assert.equal(limiter.getStats().active, 0);
      assert.equal(limiter.getStats().waiting, 0);
    });

    it('không để activeCount bị âm dù release() bị gọi dư thừa', () => {
      const limiter = new TeacherConcurrencyLimiter(2, 1000);
      limiter.release();
      limiter.release();
      assert.equal(limiter.getStats().active, 0);
    });

    it('request bị timeout không được phép chiếm token và ném HTTP 503 cố định', async () => {
      const limiter = new TeacherConcurrencyLimiter(1, 50);
      await limiter.acquire(); // Chiếm token duy nhất

      await assert.rejects(
        async () => {
          await limiter.acquire(50);
        },
        (err) => {
          assert.equal(err.statusCode, 503);
          assert.match(err.message, /Hệ thống đang bận/i);
          return true;
        }
      );

      // Token vẫn chỉ là 1 (của request đầu tiên), request timeout không làm tăng activeCount
      assert.equal(limiter.getStats().active, 1);
      assert.equal(limiter.getStats().waiting, 0);

      limiter.release();
      assert.equal(limiter.getStats().active, 0);
    });

    it('chuyển token chính xác cho request đang chờ theo thứ tự FIFO khi release()', async () => {
      const limiter = new TeacherConcurrencyLimiter(1, 1000);
      const order = [];

      await limiter.acquire();
      order.push('first-acquired');

      const p2 = limiter.acquire().then(() => {
        order.push('second-acquired');
        limiter.release();
      });

      const p3 = limiter.acquire().then(() => {
        order.push('third-acquired');
        limiter.release();
      });

      assert.equal(limiter.getStats().waiting, 2);
      limiter.release();

      await Promise.all([p2, p3]);
      assert.deepEqual(order, ['first-acquired', 'second-acquired', 'third-acquired']);
      assert.equal(limiter.getStats().active, 0);
    });
  });

  describe('normalizeDatabaseError (Bảo mật thông báo & Mapping SQL Error)', () => {
    it('lỗi 503 luôn sử dụng thông báo cố định, không lộ server, port hay DB name', () => {
      const connErr = new Error(
        'Failed to connect to localhost:1433 - Login failed for user toeic_app on QuanLyDaoTao_HopNhat'
      );
      connErr.code = 'ESOCKET';

      const norm1 = normalizeDatabaseError(connErr);
      assert.equal(norm1.statusCode, 503);
      assert.equal(norm1.message, 'Dịch vụ Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.');
      assert.doesNotMatch(norm1.message, /localhost|1433|QuanLyDaoTao|toeic_app/i);

      const preTagged503 = new Error('Sensitive internal connection details: 127.0.0.1:1433');
      preTagged503.statusCode = 503;
      const norm2 = normalizeDatabaseError(preTagged503);
      assert.equal(norm2.statusCode, 503);
      assert.equal(norm2.message, 'Dịch vụ Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.');
    });

    it('không trả rawMsg trực tiếp khi error.statusCode đã tồn tại nếu chứa thông tin nhạy cảm', () => {
      const leakErr = new Error('SELECT * FROM dbo.lop_hoc WHERE id = 1 failed at Object.query');
      leakErr.statusCode = 400;

      const norm = normalizeDatabaseError(leakErr);
      assert.equal(norm.statusCode, 400);
      assert.equal(norm.message, 'Dữ liệu đầu vào không hợp lệ.');
      assert.doesNotMatch(norm.message, /SELECT|dbo\.|Object\.query/i);

      // Thử nghiệm trường hợp cờ isSafeMessage = true nhưng vô tình chứa thông tin SQL nhạy cảm
      const leakErrSafeFlag = new Error('Error: INSERT INTO dbo.lop_hoc (id) VALUES (1)');
      leakErrSafeFlag.statusCode = 400;
      leakErrSafeFlag.isSafeMessage = true;

      const normSafe = normalizeDatabaseError(leakErrSafeFlag);
      assert.equal(normSafe.statusCode, 400);
      assert.equal(normSafe.message, 'Dữ liệu đầu vào không hợp lệ.');
      assert.doesNotMatch(normSafe.message, /INSERT|dbo\./i);
    });

    it('ánh xạ chính xác từng mã lỗi Trigger SQL thực tế theo từng nhóm HTTP status', () => {
      // 409 Conflict
      const e50015 = Object.assign(new Error('Lop hoc da dat si so toi da.'), { number: 50015 });
      assert.equal(normalizeDatabaseError(e50015).statusCode, 409);

      const e50061 = Object.assign(new Error('Phong hoc bi trung khung gio.'), { number: 50061 });
      assert.equal(normalizeDatabaseError(e50061).statusCode, 409);

      // 403 Forbidden
      const e50012 = Object.assign(new Error('Giang vien chi duoc tao/quan ly lop do minh phu trach.'), {
        number: 50012,
      });
      assert.equal(normalizeDatabaseError(e50012).statusCode, 403);

      const e50101 = Object.assign(new Error('Chi admin hoac giang vien phu trach moi duoc xoa lop.'), {
        number: 50101,
      });
      assert.equal(normalizeDatabaseError(e50101).statusCode, 403);

      // 400 Bad Request
      const e50042 = Object.assign(new Error('Hoc vien chua ghi danh lop nen khong duoc nop bai.'), {
        number: 50042,
      });
      assert.equal(normalizeDatabaseError(e50042).statusCode, 400);

      const e50063 = Object.assign(new Error('Khong the diem danh cho buoi hoc trong tuong lai.'), {
        number: 50063,
      });
      assert.equal(normalizeDatabaseError(e50063).statusCode, 400);
    });
  });
});

// ============================================================================
// PHẦN 2: UNIT TESTS DÙNG MOCK (Kiểm tra toàn bộ 10 kịch bản vòng đời Pool/Tx)
// ============================================================================
describe('PHẦN 2 - UNIT TESTS (MOCK): Vòng đời Dedicated Pool, Transaction & Semaphore', () => {
  function createMockEnv(overrides = {}) {
    const events = {
      poolCreated: 0,
      poolConnected: 0,
      poolClosed: 0,
      txBegun: 0,
      txCommitted: 0,
      txRolledBack: 0,
    };

    const limiter = new TeacherConcurrencyLimiter(2, 1000);

    const createPool = () => {
      events.poolCreated++;
      return {
        async connect() {
          events.poolConnected++;
          if (overrides.failConnect) {
            throw new Error('ESOCKET localhost:1433 connection refused');
          }
        },
        async close() {
          events.poolClosed++;
          if (overrides.failClose) {
            throw new Error('Close socket failed');
          }
        },
      };
    };

    const createTransaction = () => {
      return {
        async begin() {
          events.txBegun++;
          if (overrides.failBegin) {
            throw new Error('Cannot begin transaction');
          }
        },
        request() {
          return {
            input() {
              return this;
            },
            async execute(spName) {
              if (overrides.failSetContext && spName === 'dbo.sp_SetCurrentUser') {
                throw Object.assign(new Error('Nguoi dung khong ton tai.'), { number: 50001 });
              }
              return { recordset: [] };
            },
            async query(sqlText) {
              if (sqlText.includes('fn_IsTeacher')) {
                return { recordset: [{ isTeacher: overrides.isTeacher !== undefined ? overrides.isTeacher : 1 }] };
              }
              if (sqlText.includes('sp_set_session_context') && overrides.failCleanup) {
                throw new Error('Transaction has been aborted');
              }
              return { recordset: [] };
            },
          };
        },
        async commit() {
          events.txCommitted++;
          if (overrides.failCommit) {
            throw new Error('Commit failed due to deadlock');
          }
        },
        async rollback() {
          events.txRolledBack++;
          if (overrides.failRollback) {
            throw new Error('Transaction has been aborted');
          }
        },
      };
    };

    return { limiter, createPool, createTransaction, events };
  }

  it('[Mock] 1. connect() thất bại -> đóng pool, release semaphore đúng 1 lần, trả 503 cố định', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ failConnect: true });

    await assert.rejects(
      () => runInTeacherContext(TEACHER_ID, async () => {}, { limiter, createPool, createTransaction }),
      (err) => err.statusCode === 503 && !err.message.includes('1433')
    );

    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 2. tx.begin() thất bại -> đóng pool, release semaphore đúng 1 lần', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ failBegin: true });

    await assert.rejects(
      () => runInTeacherContext(TEACHER_ID, async () => {}, { limiter, createPool, createTransaction }),
      (err) => err.statusCode === 500
    );

    assert.equal(events.poolClosed, 1);
    assert.equal(events.txRolledBack, 0);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 3. sp_SetCurrentUser thất bại -> rollback, đóng pool, release semaphore', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ failSetContext: true });

    await assert.rejects(
      () => runInTeacherContext(TEACHER_ID, async () => {}, { limiter, createPool, createTransaction }),
      (err) => err.statusCode === 403
    );

    assert.equal(events.txRolledBack, 1);
    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 4. fn_IsTeacher() trả về false -> rollback, đóng pool, release semaphore, trả 403', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ isTeacher: 0 });

    await assert.rejects(
      () => runInTeacherContext(STUDENT_ID, async () => {}, { limiter, createPool, createTransaction }),
      (err) => err.statusCode === 403
    );

    assert.equal(events.txRolledBack, 1);
    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 5. commit() thất bại -> cleanup/rollback an toàn, đóng pool, release semaphore', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ failCommit: true });

    await assert.rejects(
      () =>
        runInTeacherContext(TEACHER_ID, async () => 'ok', { limiter, createPool, createTransaction }),
      (err) => err.statusCode === 500
    );

    assert.equal(events.txCommitted, 1);
    assert.equal(events.txRolledBack, 1);
    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 6. rollback() và cleanup thất bại (Transaction aborted) -> không crash, đóng pool, release semaphore', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({
      failCleanup: true,
      failRollback: true,
    });

    await assert.rejects(
      () =>
        runInTeacherContext(
          TEACHER_ID,
          async () => {
            throw Object.assign(new Error('Trigger abort'), { number: 50061 });
          },
          { limiter, createPool, createTransaction }
        ),
      (err) => err.statusCode === 409
    );

    assert.equal(events.txRolledBack, 1);
    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 7. pool.close() thất bại -> không che khuất lỗi gốc, semaphore vẫn release đúng 1 lần', async () => {
    const { limiter, createPool, createTransaction, events } = createMockEnv({ failClose: true });

    await assert.rejects(
      () =>
        runInTeacherContext(
          TEACHER_ID,
          async () => {
            throw Object.assign(new Error('Loi nghiep vu'), { number: 50016 });
          },
          { limiter, createPool, createTransaction }
        ),
      (err) => err.statusCode === 400
    );

    assert.equal(events.poolClosed, 1);
    assert.equal(limiter.getStats().active, 0);
  });

  it('[Mock] 8. Cross-Talk isolation: nhiều UserId khác nhau chạy đồng thời qua mock, mỗi callback nhận đúng UserId của chính nó', async () => {
    const userA = '11111111-1111-1111-1111-111111111111';
    const userB = '22222222-2222-2222-2222-222222222222';
    const userC = '33333333-3333-3333-3333-333333333333';

    const limiter = new TeacherConcurrencyLimiter(10, 2000);
    const capturedContexts = [];

    function createMockForUser(targetUserId) {
      let setUserId = null;
      return {
        createPool: () => ({
          async connect() {},
          async close() {},
        }),
        createTransaction: () => ({
          async begin() {},
          request() {
            return {
              input(key, _type, value) {
                if (key === 'UserId') setUserId = value;
                return this;
              },
              async execute() {
                return { recordset: [] };
              },
              async query(sqlText) {
                if (sqlText.includes('fn_IsTeacher')) {
                  return { recordset: [{ isTeacher: 1 }] };
                }
                if (sqlText.includes('fn_CurrentUserId')) {
                  return { recordset: [{ uid: setUserId }] };
                }
                return { recordset: [] };
              },
            };
          },
          async commit() {},
          async rollback() {},
        }),
        expectedUserId: targetUserId,
      };
    }

    const testUsers = [userA, userB, userC, userA, userB, userC];

    await Promise.all(
      testUsers.map(async (uId, idx) => {
        const mockEnv = createMockForUser(uId);
        await runInTeacherContext(
          uId,
          async (req) => {
            const res = await req.query('SELECT dbo.fn_CurrentUserId() AS uid;');
            capturedContexts.push({
              index: idx,
              expected: uId,
              actual: res.recordset[0].uid,
            });
          },
          {
            limiter,
            createPool: mockEnv.createPool,
            createTransaction: mockEnv.createTransaction,
          }
        );
      })
    );

    assert.equal(capturedContexts.length, testUsers.length, 'Tất cả các mock request phải hoàn thành');
    for (const item of capturedContexts) {
      assert.equal(
        item.actual,
        item.expected,
        `Cross-talk phát hiện tại request index ${item.index}: mong đợi ${item.expected}, nhận được ${item.actual}`
      );
    }
    assert.equal(limiter.getStats().active, 0, 'Semaphore phải giải phóng hoàn toàn');
  });
});

// ============================================================================
// PHẦN 3: INTEGRATION TESTS (Chạy trực tiếp trên Microsoft SQL Server thật)
// ============================================================================
describe('PHẦN 3 - INTEGRATION TESTS (SQL Server thật): Dedicated Pool & Anti-Leak', () => {
  let probePool = null;

  before(async () => {
    probePool = new sql.ConnectionPool({
      ...ENV.DB,
      pool: { min: 1, max: 2 },
    });
    await probePool.connect();
  });

  after(async () => {
    if (probePool) {
      await probePool.close();
    }
  });

  it('[Real SQL] 1. Transaction thành công và thiết lập đúng SESSION_CONTEXT', async () => {
    let capturedUid = null;
    let capturedIsTeacher = false;

    const result = await runInTeacherContext(TEACHER_ID, async (req) => {
      const res = await req.query(
        'SELECT dbo.fn_CurrentUserId() AS uid, dbo.fn_IsTeacher() AS isTeacher;'
      );
      capturedUid = res.recordset[0].uid;
      capturedIsTeacher = Boolean(res.recordset[0].isTeacher);
      return { success: true, count: 42 };
    });

    assert.equal(result.success, true);
    assert.equal(result.count, 42);
    assert.equal(capturedUid?.toUpperCase(), TEACHER_ID.toUpperCase());
    assert.equal(capturedIsTeacher, true);

    const probeRes = await probePool.request().query("SELECT SESSION_CONTEXT(N'UserId') AS uid;");
    assert.equal(probeRes.recordset[0].uid, null);
  });

  it('[Real SQL] 2. Từ chối thực thi khi tài khoản không phải Giảng viên (HTTP 403)', async () => {
    await assert.rejects(
      () =>
        runInTeacherContext(STUDENT_ID, async () => {
          assert.fail('Không được phép chạy callback');
        }),
      (err) => err.statusCode === 403
    );
  });

  it('[Real SQL] 3. Xử lý an toàn khi xảy ra lỗi Trigger THROW (Soft Error & Rollback)', async () => {
    await assert.rejects(
      () =>
        runInTeacherContext(TEACHER_ID, async (req) => {
          await req.query("THROW 50012, N'Giang vien chi duoc tao/quan ly lop do minh phu trach.', 1;");
        }),
      (err) => err.statusCode === 403
    );
  });

  it('[Real SQL] 4. Xử lý an toàn khi xảy ra lỗi Fatal XACT_ABORT (Uncommittable Transaction)', async () => {
    await assert.rejects(
      () =>
        runInTeacherContext(TEACHER_ID, async (req) => {
          await req.query('SET XACT_ABORT ON; SELECT 1/0;');
        }),
      (err) => err.statusCode === 500
    );
  });

  it('[Real SQL] 5. Chạy đồng thời nhiều request với UserId trên SQL Server thật (Zero Cross-Talk)', async () => {
    const concurrentRequests = Array.from({ length: 8 }, (_, i) => ({
      index: i,
      userId: TEACHER_ID,
    }));

    let hasCrossTalk = false;

    await Promise.all(
      concurrentRequests.map(async (reqItem) => {
        await runInTeacherContext(reqItem.userId, async (req) => {
          const res = await req.query("SELECT SESSION_CONTEXT(N'UserId') AS sc;");
          if (res.recordset[0].sc?.toUpperCase() !== reqItem.userId.toUpperCase()) {
            hasCrossTalk = true;
          }
          await new Promise((resolve) => setTimeout(resolve, 25));
        });
      })
    );

    assert.equal(hasCrossTalk, false);
  });

  it('[Real SQL] 6. Đảm bảo kết nối mới sau khi đóng Dedicated Pool hoàn toàn sạch UserId', async () => {
    await runInTeacherContext(TEACHER_ID, async (req) => {
      await req.query('SELECT 1 AS ok;');
    });

    const freshPool = new sql.ConnectionPool({
      ...ENV.DB,
      pool: { min: 0, max: 1 },
    });
    await freshPool.connect();

    const freshRes = await freshPool.request().query("SELECT SESSION_CONTEXT(N'UserId') AS uid;");
    assert.equal(freshRes.recordset[0].uid, null);

    await freshPool.close();
  });

  it('[Real SQL] 7. Lỗi kết nối Database thật (sai cổng) trả HTTP 503 cố định, không lộ host/port', async () => {
    const originalPort = ENV.DB.port;
    try {
      ENV.DB.port = 19999;
      await assert.rejects(
        () => runInTeacherContext(TEACHER_ID, async () => {}),
        (err) => {
          assert.equal(err.statusCode, 503);
          assert.equal(
            err.message,
            'Dịch vụ Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.'
          );
          assert.doesNotMatch(err.message, /19999|localhost/i);
          return true;
        }
      );
    } finally {
      ENV.DB.port = originalPort;
    }
  });

  it('[Real SQL] 8. Kiểm tra SESSION_CONTEXT giữa các tài khoản giảng viên hoạt động chạy đồng thời (Zero Cross-Talk)', async () => {
    // 1. Truy vấn danh sách giảng viên đang hoạt động trong database
    const teacherRows = await probePool
      .request()
      .query(
        "SELECT id, email, ho_ten, vai_tro, trang_thai FROM dbo.nguoi_dung WHERE vai_tro = N'giang vien' AND trang_thai = N'dang hoat dong';"
      );
    const activeTeachers = teacherRows.recordset;

    assert.ok(activeTeachers.length >= 1, 'Cần ít nhất 1 tài khoản giảng viên đang hoạt động trong DB');

    // 2. Kiểm tra các tài khoản đều là giảng viên đang hoạt động
    for (const teacher of activeTeachers) {
      assert.equal(teacher.vai_tro, 'giang vien', `Tài khoản ${teacher.email} không phải giảng viên`);
      assert.equal(
        teacher.trang_thai,
        'dang hoat dong',
        `Tài khoản ${teacher.email} không ở trạng thái hoạt động`
      );
    }

    // 3. Phân bổ các request đồng thời qua danh sách tài khoản giảng viên hoạt động
    const concurrentRequests = Array.from({ length: 8 }, (_, i) => {
      const teacher = activeTeachers[i % activeTeachers.length];
      return {
        index: i,
        userId: teacher.id,
        email: teacher.email,
      };
    });

    const executionResults = [];

    await Promise.all(
      concurrentRequests.map(async (reqItem) => {
        await runInTeacherContext(reqItem.userId, async (req) => {
          const res = await req.query(
            "SELECT dbo.fn_CurrentUserId() AS uid, dbo.fn_IsTeacher() AS isTeacher, SESSION_CONTEXT(N'UserId') AS sc;"
          );
          const row = res.recordset[0];
          executionResults.push({
            index: reqItem.index,
            expectedUserId: reqItem.userId,
            capturedUid: row.uid,
            capturedSc: row.sc,
            isTeacher: Boolean(row.isTeacher),
          });
          await new Promise((resolve) => setTimeout(resolve, 30));
        });
      })
    );

    // 4. Xác minh mỗi request nhận đúng UserId của chính nó và không có cross-talk
    assert.equal(executionResults.length, concurrentRequests.length);

    for (const res of executionResults) {
      assert.equal(
        res.capturedUid?.toUpperCase(),
        res.expectedUserId.toUpperCase(),
        `Cross-talk phát hiện: uid ${res.capturedUid} không khớp ${res.expectedUserId} tại request ${res.index}`
      );
      assert.equal(
        res.capturedSc?.toUpperCase(),
        res.expectedUserId.toUpperCase(),
        `Cross-talk phát hiện: SESSION_CONTEXT ${res.capturedSc} không khớp ${res.expectedUserId} tại request ${res.index}`
      );
      assert.equal(res.isTeacher, true, 'fn_IsTeacher() phải trả về true');
    }

    // 5. Xác minh probePool bên ngoài vẫn hoàn toàn sạch
    const probeRes = await probePool.request().query("SELECT SESSION_CONTEXT(N'UserId') AS uid;");
    assert.equal(probeRes.recordset[0].uid, null);
  });
});
