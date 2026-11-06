# Backend Admin API

REST API cho giao diện React trong repository này. Dùng Express và SQL Server, theo schema `db/QuanLyDaoTao_HopNhat.sql`.

## Chạy local

1. Với database mới, chạy file `db/QuanLyDaoTao_HopNhat.sql` từ đầu đến cuối trong SQL Server Management Studio. Nếu database gốc đã tồn tại, không chạy lại toàn bộ file này.
2. Tạo `backend/.env` từ `.env.example`, điền thông tin SQL Server và một `JWT_SECRET` ngẫu nhiên tối thiểu 32 ký tự.
3. Tạo tài khoản quản trị trong `dbo.nguoi_dung` với `vai_tro=N'quan tri vien'`, `trang_thai=N'dang hoat dong'` và `mat_khau_hash` là bcrypt hash. Có thể lấy hash bằng `node -e "import('bcryptjs').then(async b=>console.log(await b.hash('mat-khau-manh',12)))"` sau khi cài dependencies.
4. Chạy `npm install` trong thư mục `backend`, sau đó `npm run dev`.

API chạy ở `http://localhost:4000`. Endpoint nghiệp vụ cần `Authorization: Bearer <token>`. Đăng nhập tại `POST /api/admin/auth/login` với `{ "email", "password" }`.

## API

| Nhóm | Endpoint chính |
|---|---|
| Tài khoản | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Tổng quan | `GET /dashboard/stats`, `/revenue-chart`, `/enrollment-chart`, `/role-distribution`, `/recent-orders`, `/pending-reviews`, `/urgent-tickets` |
| Người dùng | `GET/POST /users`, `GET/PUT/DELETE /users/:id`, `PATCH /users/:id/status`, `POST /users/bulk-action` |
| Đào tạo | CRUD `/categories`, `GET/POST /courses`, `GET/PUT/PATCH/DELETE /courses/:id`, `GET/POST /classes`, `PATCH /classes/:id/status`, `GET /teachers`, `GET /moderation`, quản lý học viên lớp/khóa học và hạn đăng ký |
| Kinh doanh | `GET /orders`, `GET /orders/:id` (gồm dòng hàng và lịch sử thanh toán), `POST /orders/:id/invoice`, `GET /payments`, `POST /payments/:id/manual-confirm`, `/payment-gateways`, `/refunds` (approve/reject/complete) |
| Mã giảm giá | CRUD `/coupons`, `PATCH /coupons/:id/toggle` |
| Hỗ trợ | `GET /tickets`, `PATCH /tickets/:id`, `GET/POST /tickets/:id/replies`, `POST /notifications/broadcast` (thông báo trong ứng dụng theo vai trò) |
| Báo cáo | `GET /reports`, `POST /reports/generate`, `GET /reports/:id/download` (CSV), `DELETE /reports/:id` |
| Chứng chỉ/duyệt | `GET/POST /certificates`, `PATCH /certificates/:id/revoke`, `GET/DELETE /reviews`, `GET /moderation`, `POST /moderation/:id/approve`, `POST /moderation/:id/reject` |
| Thông báo admin | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/:id/unread`, `PUT /notifications/mark-all-read`, `DELETE /notifications/:id` |
| Hồ sơ | `GET/PUT /profile`, `PUT /profile/change-password` |

Danh sách nhận `page`, `limit` (mặc định 1 và 20, giới hạn 100), cùng các bộ lọc hỗ trợ theo từng route. Kết quả có dạng `{ data, pagination }`; lỗi có dạng `{ error: { code, message } }`. Giá trị vai trò, trạng thái được chuyển giữa enum tiếng Anh của UI và dữ liệu tiếng Việt trong SQL.

## Ghi chú schema

Một số thuộc tính giao diện chưa có cột hoặc hạ tầng trong schema gửi kèm (ví dụ giới tính, IP/thiết bị đăng nhập, cấu hình giao diện đồng bộ, ảnh đại diện dạng tải tệp, email/SMS và gửi thông báo theo lớp). API không tạo dữ liệu giả cho các trường này. Phát thông báo hiện hỗ trợ in-app theo vai trò; lọc theo lớp và gửi email chưa được triển khai. Duyệt nội dung dùng `noi_dung_khoa_hoc`; đánh giá khóa học được lấy riêng từ `danh_gia_khoa_hoc`. Báo cáo được xuất dưới dạng CSV vì schema không định nghĩa mẫu PDF/XLSX.

Backend chỉ dùng cột có trong schema gửi kèm. Mã cổng thanh toán được hiển thị theo tên cổng vì bảng `cong_thanh_toan` không có cột mã riêng. Lý do từ chối hoàn tiền được kiểm tra khi gửi nhưng schema không có cột để lưu; trạng thái và người/ngày xử lý vẫn được lưu.

Schema demo chứa mật khẩu SHA-256 cũ. Khi tài khoản đó đăng nhập thành công, API tự nâng cấp hash sang bcrypt. Tài khoản mới và mọi lần đổi mật khẩu đều dùng bcrypt.

## Hướng dẫn chạy kiểm thử (Testing)

1. **Kiểm thử Database (Trigger & Constraints)**: Mở SSMS hoặc Azure Data Studio, mở tệp `backend/db/test_suite.sql` và nhấn **Execute**. Script sẽ chạy 6 kịch bản kiểm thử nghiệp vụ (bảo vệ admin cuối, xuất bản bài học, giới hạn mã giảm giá, trùng phòng học, giới hạn sĩ số, chặn đánh giá sớm) và in ra kết quả PASS/FAIL mà không để lại dữ liệu rác (tự động ROLLBACK).
2. **Kiểm thử API Endpoint**: Khởi động server (`npm run dev`), kiểm tra `/api/health`, sau đó dùng cURL hoặc Postman gửi request đăng nhập lấy JWT token theo hướng dẫn.
