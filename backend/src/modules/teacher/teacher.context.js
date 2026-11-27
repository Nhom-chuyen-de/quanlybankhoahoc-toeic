/**
 * @file teacher.context.js
 * @description Quản lý ngữ cảnh SQL Server an toàn cho phân hệ Teacher (Giảng viên).
 * Áp dụng kiến trúc Per-Operation Isolated Dedicated Pool (100% Public API mssql ^12.8.1).
 * Đảm bảo triệt tiêu hoàn toàn nguy cơ rò rỉ SESSION_CONTEXT('UserId') và kiểm soát tải hệ thống.
 */

import sql from 'mssql';
import { ENV } from '../../config/env.js';

const FIXED_503_DB_MESSAGE = 'Dịch vụ Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.';
const FIXED_503_BUSY_MESSAGE =
  'Hệ thống đang bận xử lý nhiều tác vụ đào tạo cùng lúc. Vui lòng thử lại sau giây lát.';

/**
 * Lớp Semaphore giới hạn số lượng nghiệp vụ Teacher chạy đồng thời.
 * Ngăn chặn tình trạng quá tải connection pool và cạn kiệt cổng mạng (TIME_WAIT).
 */
export class TeacherConcurrencyLimiter {
  constructor(maxConcurrent = 10, queueTimeoutMs = 5000) {
    this.maxConcurrent = Math.max(1, parseInt(maxConcurrent, 10) || 10);
    this.queueTimeoutMs = Math.max(500, parseInt(queueTimeoutMs, 10) || 5000);
    this.activeCount = 0;
    this.waitingQueue = [];
  }

  /**
   * Xin cấp quyền thực thi (acquire token).
   * Nếu đã đạt ngưỡng maxConcurrent, request sẽ chờ trong hàng đợi.
   * Nếu chờ quá queueTimeoutMs, ném lỗi HTTP 503 Service Unavailable.
   */
  async acquire(customTimeoutMs = null) {
    const timeout = customTimeoutMs !== null ? customTimeoutMs : this.queueTimeoutMs;

    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }

    return new Promise((resolve, reject) => {
      let timer = null;
      let settled = false;

      const queueItem = {
        resolve: () => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          this.activeCount++;
          resolve();
        },
        reject: (err) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          reject(err);
        },
      };

      timer = setTimeout(() => {
        const index = this.waitingQueue.indexOf(queueItem);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
          const timeoutErr = new Error(FIXED_503_BUSY_MESSAGE);
          timeoutErr.statusCode = 503;
          timeoutErr.isLimiterTimeout = true;
          timeoutErr.isSafeMessage = true;
          queueItem.reject(timeoutErr);
        }
      }, timeout);

      this.waitingQueue.push(queueItem);
    });
  }

  /**
   * Trả quyền thực thi (release token) và đánh thức request tiếp theo trong hàng đợi nếu có.
   */
  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
    if (this.waitingQueue.length > 0 && this.activeCount < this.maxConcurrent) {
      const nextRequest = this.waitingQueue.shift();
      nextRequest.resolve();
    }
  }

  /**
   * Thống kê trạng thái tải hiện tại.
   */
  getStats() {
    return {
      active: this.activeCount,
      waiting: this.waitingQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Khởi tạo limiter mặc định từ biến môi trường
export const teacherLimiter = new TeacherConcurrencyLimiter(
  process.env.MAX_CONCURRENT_TEACHER_OPS || 10,
  process.env.TEACHER_QUEUE_TIMEOUT_MS || 5000
);

/**
 * Bản đồ ánh xạ chính xác mã lỗi SQL Server (đối chiếu từ QuanLyDaoTao_HopNhat_FIXED(1).sql)
 * sang HTTP status code và thông báo an toàn mặc định.
 */
const SQL_ERROR_MAP = {
  // --- HTTP 409 Conflict: Xung đột dữ liệu / giới hạn / trùng lịch / duy nhất ---
  2627: { status: 409, fallback: 'Dữ liệu bị trùng khóa duy nhất.' },
  2601: { status: 409, fallback: 'Dữ liệu bị trùng lặp.' },
  50015: { status: 409, fallback: 'Lớp học đã đạt sĩ số tối đa.' },
  50020: { status: 409, fallback: 'Không thể xuất bản bài học khi khóa học chưa xuất bản.' },
  50031: { status: 409, fallback: 'Vượt quá số lần làm bài kiểm tra tối đa.' },
  50052: { status: 409, fallback: 'Vượt quá số lần làm quiz tối đa.' },
  50061: { status: 409, fallback: 'Phòng học bị trùng khung giờ.' },
  50062: { status: 409, fallback: 'Giảng viên bị trùng khung giờ.' },
  50081: { status: 409, fallback: 'Không thể phản hồi yêu cầu hỗ trợ đã đóng.' },
  50120: { status: 409, fallback: 'Mã giảm giá đã hết lượt sử dụng.' },

  // --- HTTP 403 Forbidden: Phân quyền / tài khoản không hợp lệ / ngoài phạm vi phụ trách ---
  50001: { status: 403, fallback: 'Người dùng không tồn tại hoặc đang bị khóa/ngừng hoạt động.' },
  50002: { status: 403, fallback: 'Không thể xóa hoặc hạ quyền quản trị viên cuối cùng.' },
  50003: { status: 403, fallback: 'Chỉ quản trị viên mới được quản lý người dùng khác.' },
  50004: { status: 403, fallback: 'Không được tự ý thay đổi vai trò người dùng.' },
  50010: { status: 403, fallback: 'Chỉ quản trị viên hoặc người tạo khóa học mới được quản lý khóa học.' },
  50012: { status: 403, fallback: 'Giảng viên chỉ được tạo/quản lý lớp do mình phụ trách.' },
  50014: { status: 403, fallback: 'Không có quyền thay đổi bản ghi ghi danh này.' },
  50021: { status: 403, fallback: 'Không có quyền quản lý bài học này.' },
  50022: { status: 403, fallback: 'Không có quyền quản lý tài liệu này.' },
  50032: { status: 403, fallback: 'Giảng viên chỉ được chấm điểm bài làm thuộc lớp mình phụ trách.' },
  50033: { status: 403, fallback: 'Không được giả mạo thông tin người chấm.' },
  50040: { status: 403, fallback: 'Chỉ giảng viên phụ trách hoặc quản trị viên mới được quản lý bài tập.' },
  50041: { status: 403, fallback: 'Không có quyền nộp hoặc chấm bài tập này.' },
  50043: { status: 403, fallback: 'Người chấm bài phải là giảng viên hoặc quản trị viên.' },
  50050: { status: 403, fallback: 'Chỉ giảng viên phụ trách hoặc quản trị viên mới được quản lý quiz.' },
  50051: { status: 403, fallback: 'Không có quyền thay đổi kết quả quiz này.' },
  50060: { status: 403, fallback: 'Chỉ giảng viên phụ trách mới được tạo/quản lý lịch học.' },
  50065: { status: 403, fallback: 'Chỉ giảng viên phụ trách mới được thực hiện điểm danh.' },
  50070: { status: 403, fallback: 'Chỉ quản trị viên mới được gửi thông báo cho người khác.' },
  50080: { status: 403, fallback: 'Chỉ quản trị viên mới được quản lý yêu cầu hỗ trợ của người khác.' },
  50090: { status: 403, fallback: 'Chỉ giảng viên hoặc quản trị viên mới được tạo và quản lý báo cáo.' },
  50100: { status: 403, fallback: 'Chỉ quản trị viên hoặc người tạo khóa học mới được xóa khóa học.' },
  50101: { status: 403, fallback: 'Chỉ quản trị viên hoặc giảng viên phụ trách mới được xóa lớp.' },
  50102: { status: 403, fallback: 'Không có quyền xóa bài học.' },
  50103: { status: 403, fallback: 'Không có quyền xóa tài liệu.' },
  50104: { status: 403, fallback: 'Không có quyền xóa bài tập.' },
  50105: { status: 403, fallback: 'Không có quyền xóa bài nộp.' },
  50106: { status: 403, fallback: 'Không có quyền xóa quiz.' },
  50107: { status: 403, fallback: 'Không có quyền xóa kết quả quiz.' },
  50108: { status: 403, fallback: 'Không có quyền xóa lịch học.' },
  50109: { status: 403, fallback: 'Không có quyền xóa bản ghi điểm danh.' },
  50110: { status: 403, fallback: 'Chỉ được xóa thông báo của chính mình.' },
  50111: { status: 403, fallback: 'Chỉ được xóa yêu cầu hỗ trợ của chính mình.' },
  50112: { status: 403, fallback: 'Không có quyền xóa báo cáo.' },
  50130: { status: 403, fallback: 'Học viên chỉ được đánh giá khóa học của chính mình.' },

  // --- HTTP 400 Bad Request: Dữ liệu đầu vào / điều kiện nghiệp vụ không hợp lệ ---
  547: { status: 400, fallback: 'Dữ liệu vi phạm ràng buộc kiểm tra hoặc khóa ngoại.' },
  50011: { status: 400, fallback: 'Giảng viên được phân công phải đang ở trạng thái hoạt động.' },
  50013: { status: 400, fallback: 'Học viên phải đang ở trạng thái hoạt động.' },
  50016: { status: 400, fallback: 'Điểm mục tiêu IELTS phải từ 0 đến 9, bước 0.5.' },
  50017: { status: 400, fallback: 'Điểm mục tiêu TOEIC phải từ 10 đến 990.' },
  50030: { status: 400, fallback: 'Câu hỏi một đáp án đúng chỉ được có duy nhất 1 đáp án đúng.' },
  50034: { status: 400, fallback: 'Điểm IELTS phải từ 0 đến 9, bước 0.5.' },
  50035: { status: 400, fallback: 'Điểm TOEIC Nghe/Đọc phải từ 5 đến 495.' },
  50036: { status: 400, fallback: 'Điểm TOEIC Nói/Viết phải từ 0 đến 200.' },
  50042: { status: 400, fallback: 'Học viên chưa ghi danh lớp học nên không thể nộp bài.' },
  50053: { status: 400, fallback: 'Học viên chưa ghi danh lớp học.' },
  50054: { status: 400, fallback: 'Đáp án được chọn không thuộc câu hỏi.' },
  50055: { status: 400, fallback: 'Câu hỏi không thuộc quiz của kết quả.' },
  50063: { status: 400, fallback: 'Không thể điểm danh cho buổi học trong tương lai.' },
  50064: { status: 400, fallback: 'Học viên chưa ghi danh lớp học.' },
  50066: { status: 400, fallback: 'Ngày học phải nằm trong khoảng thời gian của lớp học.' },
  50082: { status: 400, fallback: 'Người gửi phản hồi không hợp lệ.' },
  50131: { status: 400, fallback: 'Chỉ được đánh giá sau khi hoàn thành khóa học.' },
  50132: { status: 400, fallback: 'Thông tin học viên hoặc khóa học không khớp với đăng ký.' },
};

const DEFAULT_STATUS_MESSAGES = {
  400: 'Dữ liệu đầu vào không hợp lệ.',
  401: 'Chưa xác thực người dùng.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu bị trùng lặp hoặc xung đột ràng buộc.',
  500: 'Có lỗi hệ thống xảy ra. Vui lòng thử lại sau.',
  503: FIXED_503_DB_MESSAGE,
};

/**
 * Loại bỏ mọi thông tin kỹ thuật nhạy cảm (SQL query, server, port, database name, stack trace).
 */
function sanitizeErrorMessage(rawMsg, fallbackMsg) {
  if (!rawMsg || typeof rawMsg !== 'string') return fallbackMsg;

  const cleaned = rawMsg
    .replace(/^Error:\s*/i, '')
    .replace(/The statement has been terminated\./gi, '')
    .trim();

  // Chặn mọi chuỗi có dấu hiệu rò rỉ cú pháp SQL, thông tin kết nối, server, DB hoặc stack trace
  const sensitivePattern =
    /(SELECT\s+|INSERT\s+|UPDATE\s+|DELETE\s+|EXEC\s+|dbo\.|sys\.|localhost|1433|QuanLyDaoTao|connection|socket|ECONNREFUSED|ESOCKET|ETIMEOUT|Login failed|password|server|stack|\bat\s+\w+)/i;

  if (!cleaned || sensitivePattern.test(cleaned)) {
    return fallbackMsg;
  }

  return cleaned;
}

/**
 * Chuẩn hóa lỗi cơ sở dữ liệu và ánh xạ chính xác HTTP status code.
 * Đảm bảo không bao giờ rò rỉ thông tin nhạy cảm ra API response.
 *
 * @param {Error} error
 * @returns {Error}
 */
export function normalizeDatabaseError(error) {
  if (!error) {
    const unknownErr = new Error(DEFAULT_STATUS_MESSAGES[500]);
    unknownErr.statusCode = 500;
    return unknownErr;
  }

  const rawMsg = error.message || '';
  const errNumber = error.number;

  // 1. Lỗi 503 phải luôn sử dụng thông báo cố định
  if (
    error.statusCode === 503 ||
    error.code === 'ESOCKET' ||
    error.code === 'ETIMEOUT' ||
    error.code === 'ECONNREFUSED' ||
    error.name === 'ConnectionError' ||
    /Failed to connect|Could not connect|Login failed/i.test(rawMsg)
  ) {
    const unavailableErr = new Error(
      error.isLimiterTimeout ? FIXED_503_BUSY_MESSAGE : FIXED_503_DB_MESSAGE
    );
    unavailableErr.statusCode = 503;
    return unavailableErr;
  }

  // 2. Nếu lỗi đã được gắn HTTP statusCode rõ ràng (400, 401, 403, 404, 409, 500)
  if (error.statusCode) {
    const status = DEFAULT_STATUS_MESSAGES[error.statusCode] ? error.statusCode : 500;
    const safeMsg =
      error.isSafeMessage && typeof error.message === 'string'
        ? sanitizeErrorMessage(error.message, DEFAULT_STATUS_MESSAGES[status])
        : DEFAULT_STATUS_MESSAGES[status];
    const normalized = new Error(safeMsg);
    normalized.statusCode = status;
    return normalized;
  }

  // 3. Ánh xạ theo mã lỗi SQL Server (Triggers / Constraints) - Luôn dùng fallback cố định
  if (errNumber && SQL_ERROR_MAP[errNumber]) {
    const mapped = SQL_ERROR_MAP[errNumber];
    const normalized = new Error(mapped.fallback);
    normalized.statusCode = mapped.status;
    return normalized;
  }

  // 4. Fallback cho các lỗi hệ thống không xác định
  const fallbackErr = new Error(DEFAULT_STATUS_MESSAGES[500]);
  fallbackErr.statusCode = 500;
  return fallbackErr;
}

/**
 * Thực thi một tác vụ nghiệp vụ Giảng viên trong một Isolated Dedicated ConnectionPool an toàn.
 *
 * @template T
 * @param {string} userId - UUID của giảng viên đang đăng nhập
 * @param {(request: sql.Request, transaction: sql.Transaction) => Promise<T>} callback
 * @param {object} [deps] - Dependency injection phục vụ Unit Test (mặc định dùng driver mssql thật)
 * @returns {Promise<T>}
 */
export async function runInTeacherContext(userId, callback, deps = {}) {
  if (!userId) {
    const unauthErr = new Error(DEFAULT_STATUS_MESSAGES[401]);
    unauthErr.statusCode = 401;
    throw unauthErr;
  }

  const limiter = deps.limiter || teacherLimiter;
  const createPool = deps.createPool || ((config) => new sql.ConnectionPool(config));
  const createTransaction = deps.createTransaction || ((pool) => new sql.Transaction(pool));

  // 1. Xin cấp quyền thực thi từ Limiter
  await limiter.acquire();

  let dedicatedPool = null;
  let tx = null;
  let isTxActive = false;
  let released = false;

  try {
    // 2. Kiểm tra cấu hình DB
    if (!ENV.DB) {
      const err = new Error(FIXED_503_DB_MESSAGE);
      err.statusCode = 503;
      throw err;
    }

    // 3. Khởi tạo Dedicated ConnectionPool với pool.max = 1 (100% Public API)
    dedicatedPool = createPool({
      ...ENV.DB,
      pool: {
        min: 0,
        max: 1,
        idleTimeoutMillis: 1000,
      },
    });

    // 4. Kết nối tới SQL Server (không lộ connErr.message ra ngoài)
    try {
      await dedicatedPool.connect();
    } catch (_connErr) {
      const err = new Error(FIXED_503_DB_MESSAGE);
      err.statusCode = 503;
      throw err;
    }

    // 5. Khởi tạo Transaction trên dedicatedPool
    tx = createTransaction(dedicatedPool);
    await tx.begin();
    isTxActive = true;

    const request = tx.request();

    // 6. Thiết lập SESSION_CONTEXT
    await request.input('UserId', sql.UniqueIdentifier, userId).execute('dbo.sp_SetCurrentUser');

    // 7. Xác thực vai trò Giảng viên
    const checkRole = await request.query('SELECT dbo.fn_IsTeacher() AS isTeacher;');
    const isTeacher = Boolean(checkRole.recordset?.[0]?.isTeacher);

    if (!isTeacher) {
      const forbiddenErr = new Error('Bạn không có quyền Giảng viên hoặc tài khoản đã bị khóa.');
      forbiddenErr.statusCode = 403;
      forbiddenErr.isSafeMessage = true;
      throw forbiddenErr;
    }

    // 8. Thực thi nghiệp vụ
    const result = await callback(request, tx);

    // 9. Xóa SESSION_CONTEXT chủ động trước Commit
    await request.query("EXEC sys.sp_set_session_context @key=N'UserId', @value=NULL;");

    // 10. Commit Transaction
    await tx.commit();
    isTxActive = false;

    return result;
  } catch (rawError) {
    // 11. Dọn dẹp và Rollback nếu transaction còn hoạt động
    if (isTxActive && tx) {
      try {
        const cleanReq = tx.request();
        await cleanReq.query("EXEC sys.sp_set_session_context @key=N'UserId', @value=NULL;");
      } catch {
        // Bỏ qua nếu transaction đã bị abort / uncommittable
      }

      try {
        await tx.rollback();
      } catch {
        // Bỏ qua nếu rollback thất bại do transaction đã bị abort
      }
      isTxActive = false;
    }

    throw normalizeDatabaseError(rawError);
  } finally {
    // 12. Luôn đóng Dedicated Pool để tiêu hủy connection vật lý
    if (dedicatedPool) {
      try {
        await dedicatedPool.close();
      } catch {
        // Bỏ qua lỗi khi đóng pool để không che khuất lỗi nghiệp vụ
      }
    }

    // 13. Đảm bảo Semaphore luôn release đúng 1 lần
    if (!released) {
      released = true;
      limiter.release();
    }
  }
}
