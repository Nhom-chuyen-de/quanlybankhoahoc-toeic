# Hệ thống Quản lý Đào tạo Online TOEIC/IELTS — Admin UI

Giao diện Admin được xây dựng bằng **React 18 + Vite + Tailwind CSS v4**.

## Hướng dẫn chạy

```bash
# 1. Cài đặt dependencies (chỉ cần lần đầu)
npm install

# 2. Chạy môi trường development
npm run dev
```

Truy cập: **http://localhost:5173/**

## Backend Admin API

Backend Express + SQL Server nằm trong [`backend/README.md`](backend/README.md). Tạo database từ `backend/db/QuanLyDaoTao_HopNhat.sql`, cấu hình `backend/.env`, cài dependencies trong thư mục `backend` rồi chạy `npm run dev`. Frontend đọc URL API từ `VITE_API_URL` (mặc định `http://localhost:4000/api`).

Đăng nhập tại `/admin/login` → tự động vào `/admin` (Dashboard).

---

## Cấu trúc thư mục

```
src/
├── assets/                    # Tài nguyên tĩnh
├── components/
│   ├── ui/                    # Component nguyên tử
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Drawer.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Select.jsx
│   │   ├── Table.jsx
│   │   ├── Tabs.jsx
│   │   ├── Textarea.jsx
│   │   └── Toast.jsx
│   └── shared/                # Component dùng chung
│       ├── ConfirmDialog.jsx
│       ├── EmptyState.jsx
│       ├── PageHeader.jsx
│       ├── SearchBar.jsx
│       ├── StatCard.jsx
│       └── StatusBadge.jsx
├── constants/
│   └── enums.js               # Ánh xạ DB → tiếng Việt + màu badge
├── contexts/
│   └── ToastContext.jsx        # Global toast provider
├── hooks/
│   └── useToast.js
├── layouts/
│   ├── AdminLayout.jsx         # Layout chính (Sidebar + Topbar)
│   ├── Sidebar.jsx             # Sidebar thu gọn được
│   └── Topbar.jsx              # Breadcrumb, tìm kiếm, dark mode, thông báo
├── mock/
│   ├── dashboard.js
│   ├── courses.js
│   ├── orders.js
│   └── users.js
├── pages/admin/
│   ├── LoginPage.jsx           # /admin/login (2 cột)
│   ├── DashboardPage.jsx       # /admin (Charts + StatCards)
│   ├── UsersPage.jsx           # /admin/users
│   ├── CoursesPage.jsx         # /admin/courses
│   ├── OrdersPage.jsx          # /admin/orders
│   └── UnderConstruction.jsx   # Placeholder cho trang chưa xây dựng
├── services/
│   └── adminService.js         # Stub rỗng (TODO: nối API)
├── App.jsx                     # Router chính
├── index.css                   # Global styles + Tailwind
└── main.jsx                    # Entry point
```

## Tech Stack

- **React 18** + **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router v6**
- **lucide-react** — icons
- **Recharts** — charts (Dashboard)
- **Font**: Inter (Google Fonts)
