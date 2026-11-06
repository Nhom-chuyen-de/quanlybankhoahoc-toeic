/* ================================================================
   QUAN LY DAO TAO ONLINE - DATABASE HOP NHAT (DA SUA LOI)
   Phien ban: FIXED v2.0
   Ngay sua: 2026-10-28

   DANH SACH SUA LOI:
   [FIX-01] bai_kiem_tra: Bo sung day du CHECK constraint bi thieu
   [FIX-02] bai_kiem_tra: Them ngay_bat_dau, ngay_ket_thuc, ngay_cap_nhat
   [FIX-03] Trigger DELETE: Sua 7 trigger dung 'inserted' cho su kien DELETE
   [FIX-04] trg_bai_lam_phan_quyen: Cho phep giang vien cham diem
   [FIX-05] trg_lich_hoc_phan_quyen_trung: Sua logic kiem tra trung phong/NULL
   [FIX-06] Them ngay_cap_nhat vao 9 bang con thieu + trigger tu dong cap nhat
   [FIX-07] Them CHECK khoa_hoc.gia IS NOT NULL khi hien_thi = 1
   [FIX-08] Them trigger tu dong tang ma_giam_gia.so_luot_da_dung
   [FIX-09] Them trigger kiem tra lich_hoc.ngay_hoc trong khoang lop hoc
   [FIX-10] Them sp_settriggerorder de dam bao thu tu trigger nguoi_dung
   [FIX-11] Them bang tien_do_hoc, chung_chi, danh_gia_khoa_hoc
   [FIX-12] Them index con thieu

   Nen tang: Microsoft SQL Server 2016+
   ================================================================ */

USE master;
GO

IF DB_ID(N'QuanLyDaoTao_HopNhat') IS NULL
BEGIN
    CREATE DATABASE QuanLyDaoTao_HopNhat;
END
GO

USE QuanLyDaoTao_HopNhat;
GO

/* ================================================================
   0. CAU HINH PHAN QUYEN UNG DUNG
   ================================================================ */

IF OBJECT_ID(N'dbo.nguoi_dung', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.nguoi_dung (
        id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        ho_ten              NVARCHAR(100) NOT NULL,
        email               NVARCHAR(150) NOT NULL,
        mat_khau_hash       NVARCHAR(255) NOT NULL,
        so_dien_thoai       NVARCHAR(20) NULL,
        anh_dai_dien        NVARCHAR(255) NULL,
        vai_tro             NVARCHAR(20) NOT NULL DEFAULT N'hoc vien',
        trang_thai          NVARCHAR(20) NOT NULL DEFAULT N'dang hoat dong',
        lan_dang_nhap_cuoi  DATETIME2 NULL,
        ngay_tao            DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT pk_nguoi_dung PRIMARY KEY (id),
        CONSTRAINT ck_nguoi_dung_vai_tro
            CHECK (vai_tro IN (N'quan tri vien', N'giang vien', N'hoc vien')),
        CONSTRAINT ck_nguoi_dung_trang_thai
            CHECK (trang_thai IN (N'dang hoat dong', N'ngung hoat dong', N'bi khoa', N'da xoa')),
        CONSTRAINT ck_nguoi_dung_email
            CHECK (email LIKE '%_@__%.__%' AND email NOT LIKE '% %'),
        CONSTRAINT ck_nguoi_dung_sdt
            CHECK (so_dien_thoai IS NULL OR so_dien_thoai NOT LIKE '%[^0-9+()-]%')
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'uq_nguoi_dung_email_active'
      AND object_id = OBJECT_ID(N'dbo.nguoi_dung')
)
BEGIN
    CREATE UNIQUE INDEX uq_nguoi_dung_email_active
    ON dbo.nguoi_dung(email)
    WHERE trang_thai <> N'da xoa';
END
GO

CREATE OR ALTER FUNCTION dbo.fn_CurrentUserId()
RETURNS UNIQUEIDENTIFIER
AS
BEGIN
    RETURN TRY_CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'UserId'));
END
GO

CREATE OR ALTER FUNCTION dbo.fn_IsActiveUser(@UserId UNIQUEIDENTIFIER)
RETURNS BIT
AS
BEGIN
    DECLARE @r BIT = 0;
    IF EXISTS (
        SELECT 1 FROM dbo.nguoi_dung
        WHERE id = @UserId AND trang_thai = N'dang hoat dong'
    ) SET @r = 1;
    RETURN @r;
END
GO

CREATE OR ALTER FUNCTION dbo.fn_IsAdmin()
RETURNS BIT
AS
BEGIN
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    RETURN CASE WHEN EXISTS (
        SELECT 1 FROM dbo.nguoi_dung
        WHERE id = @uid AND vai_tro = N'quan tri vien'
              AND trang_thai = N'dang hoat dong'
    ) THEN 1 ELSE 0 END;
END
GO

CREATE OR ALTER FUNCTION dbo.fn_IsTeacher()
RETURNS BIT
AS
BEGIN
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    RETURN CASE WHEN EXISTS (
        SELECT 1 FROM dbo.nguoi_dung
        WHERE id = @uid AND vai_tro = N'giang vien'
              AND trang_thai = N'dang hoat dong'
    ) THEN 1 ELSE 0 END;
END
GO

CREATE OR ALTER FUNCTION dbo.fn_IsStudent()
RETURNS BIT
AS
BEGIN
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    RETURN CASE WHEN EXISTS (
        SELECT 1 FROM dbo.nguoi_dung
        WHERE id = @uid AND vai_tro = N'hoc vien'
              AND trang_thai = N'dang hoat dong'
    ) THEN 1 ELSE 0 END;
END
GO

CREATE OR ALTER PROCEDURE dbo.sp_SetCurrentUser
    @UserId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (
        SELECT 1 FROM dbo.nguoi_dung
        WHERE id = @UserId AND trang_thai = N'dang hoat dong'
    )
        THROW 50001, N'Nguoi dung khong ton tai hoac dang bi khoa/ngung hoat dong.', 1;
    EXEC sys.sp_set_session_context @key=N'UserId', @value=@UserId;
END
GO

/* ================================================================
   1. NGUOI DUNG - TRIGGERS
   ================================================================ */

CREATE OR ALTER TRIGGER dbo.trg_nguoi_dung_cap_nhat
ON dbo.nguoi_dung
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE nd SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.nguoi_dung nd JOIN inserted i ON i.id = nd.id;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_nguoi_dung_bao_ve_admin_cuoi
ON dbo.nguoi_dung
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM deleted d
        WHERE d.vai_tro = N'quan tri vien' AND d.trang_thai <> N'da xoa'
          AND NOT EXISTS (
              SELECT 1 FROM inserted i
              WHERE i.id = d.id AND i.vai_tro = N'quan tri vien'
                AND i.trang_thai <> N'da xoa'
          )
          AND (SELECT COUNT(*) FROM dbo.nguoi_dung
               WHERE vai_tro = N'quan tri vien' AND trang_thai <> N'da xoa') = 0
    )
        THROW 50002, N'Khong the xoa/ha quyen quan tri vien cuoi cung.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_nguoi_dung_phan_quyen
ON dbo.nguoi_dung
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    IF @uid IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND (EXISTS (SELECT 1 FROM inserted i WHERE i.id <> @uid)
            OR EXISTS (SELECT 1 FROM deleted d WHERE d.id <> @uid))
    BEGIN;
        THROW 50003, N'Chi quan tri vien moi duoc quan ly nguoi dung khac.', 1;
    END
    IF @uid IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN deleted d ON d.id = i.id
           WHERE i.vai_tro <> d.vai_tro)
    BEGIN;
        THROW 50004, N'Khong duoc tu y thay doi vai tro.', 1;
    END
END
GO

/* [FIX-10] Dat thu tu trigger: bao_ve_admin_cuoi chay CUOI CUNG */
EXEC sys.sp_settriggerorder
    @triggername = N'dbo.trg_nguoi_dung_bao_ve_admin_cuoi',
    @order       = N'Last',
    @stmttype    = N'UPDATE';
GO
EXEC sys.sp_settriggerorder
    @triggername = N'dbo.trg_nguoi_dung_bao_ve_admin_cuoi',
    @order       = N'Last',
    @stmttype    = N'DELETE';
GO

/* ================================================================
   2. DANH MUC - KHOA HOC
   ================================================================ */
IF OBJECT_ID(N'dbo.danh_muc_khoa_hoc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.danh_muc_khoa_hoc (
        id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ten_danh_muc NVARCHAR(100) NOT NULL UNIQUE,
        ngay_tao     DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.khoa_hoc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.khoa_hoc (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ten_khoa_hoc  NVARCHAR(200) NOT NULL,
        danh_muc_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.danh_muc_khoa_hoc(id),
        mo_ta         NVARCHAR(MAX) NULL,
        trinh_do      NVARCHAR(20) NOT NULL DEFAULT N'co ban',
        trang_thai    NVARCHAR(20) NOT NULL DEFAULT N'nhap',
        loai_ky_thi   NVARCHAR(20) NOT NULL DEFAULT N'khong ap dung',
        gia           DECIMAL(12,2) NULL,
        nguoi_tao_id  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_khoa_hoc_trinh_do   CHECK (trinh_do IN (N'co ban', N'trung cap', N'nang cao')),
        CONSTRAINT ck_khoa_hoc_trang_thai CHECK (trang_thai IN (N'nhap', N'da xuat ban', N'da luu tru')),
        CONSTRAINT ck_khoa_hoc_loai_ky_thi CHECK (loai_ky_thi IN (N'TOEIC', N'IELTS', N'khong ap dung')),
        CONSTRAINT ck_khoa_hoc_gia        CHECK (gia IS NULL OR gia >= 0),
        CONSTRAINT uq_khoa_hoc_ten_danh_muc UNIQUE (danh_muc_id, ten_khoa_hoc)
    );
END
GO

IF COL_LENGTH(N'dbo.khoa_hoc', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.khoa_hoc ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_kh_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_khoa_hoc_trang_thai' AND object_id = OBJECT_ID(N'dbo.khoa_hoc'))
    CREATE INDEX idx_khoa_hoc_trang_thai ON dbo.khoa_hoc(trang_thai);
GO

CREATE OR ALTER FUNCTION dbo.fn_CanManageCourse(@KhoaHocId UNIQUEIDENTIFIER)
RETURNS BIT
AS
BEGIN
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    RETURN CASE WHEN dbo.fn_IsAdmin() = 1 OR EXISTS (
        SELECT 1 FROM dbo.khoa_hoc WHERE id = @KhoaHocId AND nguoi_tao_id = @uid
    ) THEN 1 ELSE 0 END;
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE; DELETE xu ly o Section 15 */
CREATE OR ALTER TRIGGER dbo.trg_khoa_hoc_phan_quyen
ON dbo.khoa_hoc
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE dbo.fn_CanManageCourse(i.id) = 0)
        THROW 50010, N'Chi admin hoac nguoi tao khoa hoc moi duoc quan ly khoa hoc.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_khoa_hoc_cap_nhat
ON dbo.khoa_hoc
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE kh SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.khoa_hoc kh JOIN inserted i ON i.id = kh.id;
END
GO

/* ================================================================
   3. LOP HOC - GHI DANH
   [FIX-06] Them ngay_cap_nhat
   ================================================================ */
IF OBJECT_ID(N'dbo.lop_hoc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.lop_hoc (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        khoa_hoc_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.khoa_hoc(id),
        ten_lop       NVARCHAR(100) NOT NULL,
        giao_vien_id  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        si_so_toi_da  INT NOT NULL,
        ngay_bat_dau  DATE NOT NULL,
        ngay_ket_thuc DATE NOT NULL,
        trang_thai    NVARCHAR(20) NOT NULL DEFAULT N'sap dien ra',
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_lop_hoc_si_so     CHECK (si_so_toi_da > 0),
        CONSTRAINT ck_lop_hoc_trang_thai CHECK (trang_thai IN (N'sap dien ra', N'dang dien ra', N'da hoan thanh', N'da huy')),
        CONSTRAINT ck_lop_hoc_ngay      CHECK (ngay_ket_thuc > ngay_bat_dau),
        CONSTRAINT uq_lop_hoc_ten       UNIQUE (khoa_hoc_id, ten_lop)
    );
END
GO

IF COL_LENGTH(N'dbo.lop_hoc', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.lop_hoc ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_lh_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_lop_hoc_giao_vien' AND object_id = OBJECT_ID(N'dbo.lop_hoc'))
    CREATE INDEX idx_lop_hoc_giao_vien ON dbo.lop_hoc(giao_vien_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_lop_hoc_cap_nhat
ON dbo.lop_hoc AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE lh SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.lop_hoc lh JOIN inserted i ON i.id = lh.id;
END
GO

CREATE OR ALTER FUNCTION dbo.fn_CanManageClass(@LopId UNIQUEIDENTIFIER)
RETURNS BIT
AS
BEGIN
    DECLARE @uid UNIQUEIDENTIFIER = dbo.fn_CurrentUserId();
    RETURN CASE WHEN dbo.fn_IsAdmin() = 1 OR EXISTS (
        SELECT 1 FROM dbo.lop_hoc WHERE id = @LopId AND giao_vien_id = @uid
    ) THEN 1 ELSE 0 END;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_lop_hoc_kiem_tra_giao_vien
ON dbo.lop_hoc AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.nguoi_dung nd
            WHERE nd.id = i.giao_vien_id AND nd.vai_tro = N'giang vien'
              AND nd.trang_thai = N'dang hoat dong'
        )
    )
        THROW 50011, N'giao_vien_id phai la giang vien dang hoat dong.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE i.giao_vien_id <> dbo.fn_CurrentUserId())
        THROW 50012, N'Giang vien chi duoc tao/quan ly lop do minh phu trach.', 1;
END
GO

IF OBJECT_ID(N'dbo.ghi_danh', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ghi_danh (
        lop_hoc_id    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        hoc_vien_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_ghi_danh DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        trang_thai    NVARCHAR(20) NOT NULL DEFAULT N'dang hoc',
        diem_muc_tieu DECIMAL(5,2) NULL,
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT pk_ghi_danh PRIMARY KEY (lop_hoc_id, hoc_vien_id),
        CONSTRAINT ck_ghi_danh_trang_thai CHECK (trang_thai IN (N'dang hoc', N'da nghi'))
    );
END
GO

IF COL_LENGTH(N'dbo.ghi_danh', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.ghi_danh ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_gd_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_ghi_danh_hoc_vien' AND object_id = OBJECT_ID(N'dbo.ghi_danh'))
    CREATE INDEX idx_ghi_danh_hoc_vien ON dbo.ghi_danh(hoc_vien_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_ghi_danh_cap_nhat
ON dbo.ghi_danh AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE gd SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.ghi_danh gd
    JOIN inserted i ON i.lop_hoc_id = gd.lop_hoc_id AND i.hoc_vien_id = gd.hoc_vien_id;
END
GO

CREATE OR ALTER FUNCTION dbo.fn_IsEnrolled(@LopId UNIQUEIDENTIFIER, @HocVienId UNIQUEIDENTIFIER)
RETURNS BIT AS
BEGIN
    RETURN CASE WHEN EXISTS (
        SELECT 1 FROM dbo.ghi_danh
        WHERE lop_hoc_id = @LopId AND hoc_vien_id = @HocVienId AND trang_thai = N'dang hoc'
    ) THEN 1 ELSE 0 END;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_ghi_danh_kiem_tra
ON dbo.ghi_danh AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.nguoi_dung nd
            WHERE nd.id = i.hoc_vien_id AND nd.vai_tro = N'hoc vien'
              AND nd.trang_thai = N'dang hoat dong'
        )
    )
        THROW 50013, N'hoc_vien_id phai la hoc vien dang hoat dong.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN dbo.lop_hoc l ON l.id = i.lop_hoc_id
           WHERE NOT (
               (dbo.fn_IsTeacher() = 1 AND l.giao_vien_id = dbo.fn_CurrentUserId())
               OR (dbo.fn_IsStudent() = 1 AND i.hoc_vien_id = dbo.fn_CurrentUserId())
           )
       )
        THROW 50014, N'Khong co quyen thay doi ban ghi ghi danh nay.', 1;

    IF EXISTS (
        SELECT i.lop_hoc_id FROM inserted i WHERE i.trang_thai = N'dang hoc'
        GROUP BY i.lop_hoc_id
        HAVING (SELECT COUNT(*) FROM dbo.ghi_danh gd
                WHERE gd.lop_hoc_id = i.lop_hoc_id AND gd.trang_thai = N'dang hoc')
             > (SELECT si_so_toi_da FROM dbo.lop_hoc WHERE id = i.lop_hoc_id)
    )
        THROW 50015, N'Lop hoc da dat si so toi da.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.lop_hoc l ON l.id = i.lop_hoc_id
        JOIN dbo.khoa_hoc k ON k.id = l.khoa_hoc_id
        WHERE i.diem_muc_tieu IS NOT NULL AND k.loai_ky_thi = N'IELTS'
          AND (i.diem_muc_tieu < 0 OR i.diem_muc_tieu > 9
               OR i.diem_muc_tieu * 2 <> ROUND(i.diem_muc_tieu * 2, 0))
    )
        THROW 50016, N'Diem muc tieu IELTS phai tu 0 den 9, buoc 0.5.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.lop_hoc l ON l.id = i.lop_hoc_id
        JOIN dbo.khoa_hoc k ON k.id = l.khoa_hoc_id
        WHERE i.diem_muc_tieu IS NOT NULL AND k.loai_ky_thi = N'TOEIC'
          AND (i.diem_muc_tieu < 10 OR i.diem_muc_tieu > 990)
    )
        THROW 50017, N'Diem muc tieu TOEIC phai tu 10 den 990.', 1;
END
GO

/* ================================================================
   4. BAI HOC - TAI LIEU
   ================================================================ */
IF OBJECT_ID(N'dbo.bai_hoc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bai_hoc (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        lop_hoc_id    UNIQUEIDENTIFIER NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        khoa_hoc_id   UNIQUEIDENTIFIER NULL REFERENCES dbo.khoa_hoc(id) ON DELETE CASCADE,
        tieu_de       NVARCHAR(200) NOT NULL,
        noi_dung      NVARCHAR(MAX) NULL,
        thu_tu        INT NOT NULL,
        loai_noi_dung NVARCHAR(20) NOT NULL DEFAULT N'van ban',
        trang_thai    NVARCHAR(20) NOT NULL DEFAULT N'nhap',
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_bai_hoc_parent    CHECK (lop_hoc_id IS NOT NULL OR khoa_hoc_id IS NOT NULL),
        CONSTRAINT ck_bai_hoc_thu_tu    CHECK (thu_tu > 0),
        CONSTRAINT ck_bai_hoc_loai      CHECK (loai_noi_dung IN (N'video', N'tai lieu', N'van ban', N'lien ket')),
        CONSTRAINT ck_bai_hoc_trang_thai CHECK (trang_thai IN (N'nhap', N'da xuat ban'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_hoc_lop' AND object_id = OBJECT_ID(N'dbo.bai_hoc'))
    CREATE INDEX idx_bai_hoc_lop  ON dbo.bai_hoc(lop_hoc_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_hoc_khoa' AND object_id = OBJECT_ID(N'dbo.bai_hoc'))
    CREATE INDEX idx_bai_hoc_khoa ON dbo.bai_hoc(khoa_hoc_id);
GO

IF OBJECT_ID(N'dbo.tai_lieu', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tai_lieu (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_hoc_id    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.bai_hoc(id) ON DELETE CASCADE,
        ten_file      NVARCHAR(255) NULL,
        duong_dan_tep NVARCHAR(500) NOT NULL,
        dung_luong_kb INT NOT NULL,
        nguoi_tai_id  UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        ngay_tai_len  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_tai_lieu_dung_luong CHECK (dung_luong_kb > 0 AND dung_luong_kb <= 512000)
    );
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_hoc_phan_quyen_xuat_ban
ON dbo.bai_hoc AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i WHERE i.trang_thai = N'da xuat ban'
          AND NOT EXISTS (
              SELECT 1 FROM dbo.khoa_hoc k
              WHERE k.trang_thai = N'da xuat ban'
                AND (
                    (i.khoa_hoc_id IS NOT NULL AND k.id = i.khoa_hoc_id)
                    OR
                    (i.lop_hoc_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM dbo.lop_hoc l WHERE l.id = i.lop_hoc_id AND l.khoa_hoc_id = k.id
                    ))
                )
          )
    )
        THROW 50020, N'Khong the xuat ban bai hoc khi khoa hoc chua xuat ban.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE (i.lop_hoc_id IS NOT NULL AND dbo.fn_CanManageClass(i.lop_hoc_id) = 0)
              OR (i.khoa_hoc_id IS NOT NULL AND dbo.fn_CanManageCourse(i.khoa_hoc_id) = 0)
       )
        THROW 50021, N'Khong co quyen quan ly bai hoc nay.', 1;
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE; DELETE o Section 15 */
CREATE OR ALTER TRIGGER dbo.trg_tai_lieu_phan_quyen
ON dbo.tai_lieu AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN dbo.bai_hoc b ON b.id = i.bai_hoc_id
           WHERE (b.lop_hoc_id IS NOT NULL AND dbo.fn_CanManageClass(b.lop_hoc_id) = 0)
              OR (b.khoa_hoc_id IS NOT NULL AND dbo.fn_CanManageCourse(b.khoa_hoc_id) = 0)
       )
        THROW 50022, N'Khong co quyen quan ly tai lieu nay.', 1;
END
GO

/* ================================================================
   5. BAI KIEM TRA - CAU HOI - DAP AN - BAI LAM - KY NANG
   [FIX-01] Bo sung CHECK constraints
   [FIX-02] Them ngay_bat_dau, ngay_ket_thuc, ngay_cap_nhat
   [FIX-04] Giang vien duoc cap nhat diem_so
   ================================================================ */
IF OBJECT_ID(N'dbo.bai_kiem_tra', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bai_kiem_tra (
        id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_hoc_id       UNIQUEIDENTIFIER NULL REFERENCES dbo.bai_hoc(id) ON DELETE NO ACTION,
        lop_hoc_id       UNIQUEIDENTIFIER NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        tieu_de          NVARCHAR(200) NOT NULL,
        loai_bai_thi     NVARCHAR(20) NOT NULL DEFAULT N'bai tap thuong',
        loai_ky_thi      NVARCHAR(20) NOT NULL DEFAULT N'khong ap dung',
        thoi_gian_phut   INT NOT NULL,
        diem_dat         DECIMAL(5,2) NOT NULL,
        so_lan_lam_toi_da INT NOT NULL DEFAULT 1,
        ngay_bat_dau     DATETIME2 NULL,
        ngay_ket_thuc    DATETIME2 NULL,
        ngay_tao         DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat    DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        /* [FIX-01] Day du CHECK constraints */
        CONSTRAINT ck_bkt_parent       CHECK (bai_hoc_id IS NOT NULL OR lop_hoc_id IS NOT NULL),
        CONSTRAINT ck_bkt_loai_bai_thi CHECK (loai_bai_thi IN (N'bai tap thuong', N'giua ky', N'cuoi ky')),
        CONSTRAINT ck_bkt_loai_ky_thi  CHECK (loai_ky_thi IN (N'TOEIC', N'IELTS', N'khong ap dung')),
        CONSTRAINT ck_bkt_thoi_gian    CHECK (thoi_gian_phut > 0),
        CONSTRAINT ck_bkt_diem_dat     CHECK (diem_dat >= 0 AND diem_dat <= 100),
        CONSTRAINT ck_bkt_so_lan       CHECK (so_lan_lam_toi_da > 0),
        CONSTRAINT ck_bkt_ngay         CHECK (ngay_bat_dau IS NULL OR ngay_ket_thuc IS NULL
                                               OR ngay_ket_thuc > ngay_bat_dau)
    );
END
GO

IF COL_LENGTH(N'dbo.bai_kiem_tra', N'ngay_bat_dau') IS NULL
    ALTER TABLE dbo.bai_kiem_tra ADD ngay_bat_dau DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.bai_kiem_tra', N'ngay_ket_thuc') IS NULL
    ALTER TABLE dbo.bai_kiem_tra ADD ngay_ket_thuc DATETIME2 NULL;
GO
IF COL_LENGTH(N'dbo.bai_kiem_tra', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.bai_kiem_tra ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_bkt_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_kiem_tra_lop' AND object_id = OBJECT_ID(N'dbo.bai_kiem_tra'))
    CREATE INDEX idx_bai_kiem_tra_lop ON dbo.bai_kiem_tra(lop_hoc_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_kiem_tra_cap_nhat
ON dbo.bai_kiem_tra AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE bkt SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.bai_kiem_tra bkt JOIN inserted i ON i.id = bkt.id;
END
GO

IF OBJECT_ID(N'dbo.cau_hoi', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cau_hoi (
        id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_kiem_tra_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.bai_kiem_tra(id) ON DELETE CASCADE,
        ky_nang         NVARCHAR(20) NULL,
        noi_dung        NVARCHAR(MAX) NOT NULL,
        duong_dan_am_thanh NVARCHAR(255) NULL,
        loai_cau_hoi    NVARCHAR(30) NOT NULL,
        diem            DECIMAL(5,2) NOT NULL,
        CONSTRAINT ck_cau_hoi_skill CHECK (ky_nang IS NULL OR ky_nang IN (N'Nghe', N'Doc', N'Viet', N'Noi')),
        CONSTRAINT ck_cau_hoi_type  CHECK (loai_cau_hoi IN (N'mot dap an dung', N'nhieu dap an dung', N'tu luan')),
        CONSTRAINT ck_cau_hoi_diem  CHECK (diem > 0)
    );
END
GO

IF OBJECT_ID(N'dbo.dap_an', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.dap_an (
        id         UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        cau_hoi_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.cau_hoi(id) ON DELETE CASCADE,
        noi_dung   NVARCHAR(MAX) NOT NULL,
        ket_qua    NVARCHAR(10) NOT NULL DEFAULT N'sai',
        CONSTRAINT ck_dap_an_ket_qua CHECK (ket_qua IN (N'dung', N'sai'))
    );
END
GO

CREATE OR ALTER TRIGGER dbo.trg_dap_an_kiem_tra_mot_dap_an
ON dbo.dap_an AFTER INSERT, UPDATE, DELETE AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @c TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @c(id)
    SELECT DISTINCT cau_hoi_id FROM inserted
    UNION
    SELECT DISTINCT cau_hoi_id FROM deleted;

    IF EXISTS (
        SELECT 1 FROM @c x JOIN dbo.cau_hoi q ON q.id = x.id
        WHERE q.loai_cau_hoi = N'mot dap an dung'
          AND (SELECT COUNT(*) FROM dbo.dap_an a
               WHERE a.cau_hoi_id = x.id AND a.ket_qua = N'dung') > 1
    )
        THROW 50030, N'Cau hoi mot dap an dung chi duoc co 1 dap an dung.', 1;
END
GO

IF OBJECT_ID(N'dbo.bai_lam', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bai_lam (
        id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_kiem_tra_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.bai_kiem_tra(id) ON DELETE CASCADE,
        hoc_vien_id     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        diem_so         DECIMAL(5,2) NULL,
        lan_lam_thu     INT NOT NULL,
        ngay_nop        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_bai_lam_lan CHECK (lan_lam_thu > 0),
        CONSTRAINT uq_bai_lam UNIQUE (bai_kiem_tra_id, hoc_vien_id, lan_lam_thu)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_lam_hoc_vien' AND object_id = OBJECT_ID(N'dbo.bai_lam'))
    CREATE INDEX idx_bai_lam_hoc_vien     ON dbo.bai_lam(hoc_vien_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_lam_bai_kiem_tra' AND object_id = OBJECT_ID(N'dbo.bai_lam'))
    CREATE INDEX idx_bai_lam_bai_kiem_tra ON dbo.bai_lam(bai_kiem_tra_id);
GO

/*
   [FIX-04] Giang vien phu trach lop duoc phep cap nhat diem_so.
   Truoc day trigger block toan bo nguoi khong phai admin,
   gio them exception cho giang vien.
*/
CREATE OR ALTER TRIGGER dbo.trg_bai_lam_phan_quyen
ON dbo.bai_lam AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.bai_kiem_tra b ON b.id = i.bai_kiem_tra_id
        WHERE i.lan_lam_thu > b.so_lan_lam_toi_da
    )
        THROW 50031, N'Vuot qua so lan lam bai toi da.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN dbo.bai_kiem_tra b ON b.id = i.bai_kiem_tra_id
           WHERE i.hoc_vien_id <> dbo.fn_CurrentUserId()
             AND NOT (
                 /* [FIX-04] Giang vien phu trach lop duoc cham diem */
                 dbo.fn_IsTeacher() = 1
                 AND b.lop_hoc_id IS NOT NULL
                 AND dbo.fn_CanManageClass(b.lop_hoc_id) = 1
             )
       )
        THROW 50032, N'Hoc vien chi duoc tao/sua bai lam cua chinh minh; giang vien chi duoc cham diem lop phu trach.', 1;
END
GO

IF OBJECT_ID(N'dbo.ket_qua_ky_nang', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ket_qua_ky_nang (
        id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_lam_id            UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.bai_lam(id) ON DELETE CASCADE,
        ky_nang               NVARCHAR(20) NOT NULL,
        diem                  DECIMAL(5,2) NOT NULL,
        duong_dan_file_ghi_am NVARCHAR(255) NULL,
        nguoi_cham_id         UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        nhan_xet              NVARCHAR(MAX) NULL,
        ngay_cham             DATETIME2 NULL,
        CONSTRAINT ck_kqkn_skill CHECK (ky_nang IN (N'Nghe', N'Doc', N'Viet', N'Noi')),
        CONSTRAINT uq_kqkn UNIQUE (bai_lam_id, ky_nang)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_kq_kn_bai_lam' AND object_id = OBJECT_ID(N'dbo.ket_qua_ky_nang'))
    CREATE INDEX idx_kq_kn_bai_lam ON dbo.ket_qua_ky_nang(bai_lam_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_ket_qua_ky_nang
ON dbo.ket_qua_ky_nang AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE i.nguoi_cham_id IS NOT NULL AND i.nguoi_cham_id <> dbo.fn_CurrentUserId()
       )
        THROW 50033, N'Khong duoc gia mao nguoi cham.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.bai_lam bl ON bl.id = i.bai_lam_id
        JOIN dbo.bai_kiem_tra b ON b.id = bl.bai_kiem_tra_id
        WHERE b.loai_ky_thi = N'IELTS'
          AND (i.diem < 0 OR i.diem > 9 OR i.diem * 2 <> ROUND(i.diem * 2, 0))
    )
        THROW 50034, N'Diem IELTS phai tu 0 den 9, buoc 0.5.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.bai_lam bl ON bl.id = i.bai_lam_id
        JOIN dbo.bai_kiem_tra b ON b.id = bl.bai_kiem_tra_id
        WHERE b.loai_ky_thi = N'TOEIC' AND i.ky_nang IN (N'Nghe', N'Doc')
          AND (i.diem < 5 OR i.diem > 495)
    )
        THROW 50035, N'Diem TOEIC Nghe/Doc phai tu 5 den 495.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.bai_lam bl ON bl.id = i.bai_lam_id
        JOIN dbo.bai_kiem_tra b ON b.id = bl.bai_kiem_tra_id
        WHERE b.loai_ky_thi = N'TOEIC' AND i.ky_nang IN (N'Noi', N'Viet')
          AND (i.diem < 0 OR i.diem > 200)
    )
        THROW 50036, N'Diem TOEIC Noi/Viet phai tu 0 den 200.', 1;
END
GO

/* ================================================================
   6. BAI TAP - BAI NOP
   [FIX-06] Them ngay_cap_nhat
   [FIX-03] Doi sang AFTER INSERT, UPDATE
   ================================================================ */
IF OBJECT_ID(N'dbo.bai_tap', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bai_tap (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        lop_hoc_id    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        tieu_de       NVARCHAR(200) NOT NULL,
        mo_ta         NVARCHAR(MAX) NULL,
        han_nop       DATETIME2 NULL,
        nguoi_tao_id  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

IF COL_LENGTH(N'dbo.bai_tap', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.bai_tap ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_bt_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_bai_tap_lop' AND object_id = OBJECT_ID(N'dbo.bai_tap'))
    CREATE INDEX idx_bai_tap_lop ON dbo.bai_tap(lop_hoc_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_tap_cap_nhat
ON dbo.bai_tap AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE bt SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.bai_tap bt JOIN inserted i ON i.id = bt.id;
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE */
CREATE OR ALTER TRIGGER dbo.trg_bai_tap_phan_quyen
ON dbo.bai_tap AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE dbo.fn_IsTeacher() = 0
              OR i.nguoi_tao_id <> dbo.fn_CurrentUserId()
              OR dbo.fn_CanManageClass(i.lop_hoc_id) = 0
       )
        THROW 50040, N'Chi giang vien phu trach hoac admin moi duoc quan ly bai tap.', 1;
END
GO

IF OBJECT_ID(N'dbo.bai_tap_nop', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bai_tap_nop (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        bai_tap_id    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.bai_tap(id) ON DELETE CASCADE,
        hoc_vien_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        duong_dan_file NVARCHAR(500) NULL,
        ngay_nop      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        diem          DECIMAL(5,2) NULL,
        nhan_xet      NVARCHAR(MAX) NULL,
        nguoi_cham_id UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        ngay_cham     DATETIME2 NULL,
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT uq_bai_tap_hoc_vien UNIQUE (bai_tap_id, hoc_vien_id),
        CONSTRAINT ck_bai_tap_diem CHECK (diem IS NULL OR (diem >= 0 AND diem <= 100))
    );
END
GO

IF COL_LENGTH(N'dbo.bai_tap_nop', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.bai_tap_nop ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_btn_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_tap_nop_cap_nhat
ON dbo.bai_tap_nop AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE btn SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.bai_tap_nop btn JOIN inserted i ON i.id = btn.id;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_tap_nop_phan_quyen
ON dbo.bai_tap_nop AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN dbo.bai_tap bt ON bt.id = i.bai_tap_id
           WHERE NOT (
               (dbo.fn_IsStudent() = 1 AND i.hoc_vien_id = dbo.fn_CurrentUserId())
               OR (dbo.fn_IsTeacher() = 1 AND dbo.fn_CanManageClass(bt.lop_hoc_id) = 1)
           )
       )
        THROW 50041, N'Khong co quyen nop/cham bai tap nay.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.bai_tap bt ON bt.id = i.bai_tap_id
        WHERE i.hoc_vien_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM dbo.ghi_danh gd
              WHERE gd.lop_hoc_id = bt.lop_hoc_id
                AND gd.hoc_vien_id = i.hoc_vien_id AND gd.trang_thai = N'dang hoc'
          )
    )
        THROW 50042, N'Hoc vien chua ghi danh lop nen khong duoc nop bai.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i WHERE i.nguoi_cham_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM dbo.nguoi_dung nd WHERE nd.id = i.nguoi_cham_id
                AND nd.vai_tro IN (N'giang vien', N'quan tri vien') AND nd.trang_thai = N'dang hoat dong'
          )
    )
        THROW 50043, N'Nguoi cham phai la giang vien hoac quan tri vien.', 1;
END
GO

/* ================================================================
   7. QUIZ
   [FIX-06] Them ngay_cap_nhat
   [FIX-03] Doi sang AFTER INSERT, UPDATE
   ================================================================ */
IF OBJECT_ID(N'dbo.quiz', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.quiz (
        id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        lop_hoc_id        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        tieu_de           NVARCHAR(200) NOT NULL,
        thoi_gian_lam_bai INT NOT NULL DEFAULT 15,
        so_lan_lam_toi_da INT NOT NULL DEFAULT 1,
        nguoi_tao_id      UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_tao          DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_quiz_time    CHECK (thoi_gian_lam_bai > 0),
        CONSTRAINT ck_quiz_attempt CHECK (so_lan_lam_toi_da > 0)
    );
END
GO

IF COL_LENGTH(N'dbo.quiz', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.quiz ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_q_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_quiz_lop' AND object_id = OBJECT_ID(N'dbo.quiz'))
    CREATE INDEX idx_quiz_lop ON dbo.quiz(lop_hoc_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_quiz_cap_nhat
ON dbo.quiz AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE q SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.quiz q JOIN inserted i ON i.id = q.id;
END
GO

IF OBJECT_ID(N'dbo.cau_hoi_quiz', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cau_hoi_quiz (
        id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        quiz_id          UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.quiz(id) ON DELETE CASCADE,
        noi_dung_cau_hoi NVARCHAR(MAX) NOT NULL,
        thu_tu           INT NOT NULL DEFAULT 0,
        CONSTRAINT ck_cau_hoi_quiz_order CHECK (thu_tu >= 0)
    );
END
GO

IF OBJECT_ID(N'dbo.dap_an_quiz', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.dap_an_quiz (
        id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        cau_hoi_id     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.cau_hoi_quiz(id) ON DELETE CASCADE,
        noi_dung_dap_an NVARCHAR(500) NOT NULL,
        la_dap_an_dung BIT NOT NULL DEFAULT 0
    );
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE */
CREATE OR ALTER TRIGGER dbo.trg_quiz_phan_quyen
ON dbo.quiz AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE dbo.fn_IsTeacher() = 0
              OR i.nguoi_tao_id <> dbo.fn_CurrentUserId()
              OR dbo.fn_CanManageClass(i.lop_hoc_id) = 0
       )
        THROW 50050, N'Chi giang vien phu trach hoac admin moi duoc quan ly quiz.', 1;
END
GO

IF OBJECT_ID(N'dbo.ket_qua_quiz', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ket_qua_quiz (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        quiz_id       UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.quiz(id) ON DELETE CASCADE,
        hoc_vien_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        diem          DECIMAL(5,2) NULL,
        lan_lam_thu   INT NOT NULL DEFAULT 1,
        ngay_nop      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_ket_qua_quiz_lan  CHECK (lan_lam_thu > 0),
        CONSTRAINT ck_ket_qua_quiz_diem CHECK (diem IS NULL OR (diem >= 0 AND diem <= 100)),
        CONSTRAINT uq_ket_qua_quiz      UNIQUE (quiz_id, hoc_vien_id, lan_lam_thu)
    );
END
GO

IF COL_LENGTH(N'dbo.ket_qua_quiz', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.ket_qua_quiz ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_kq_ngay_cap_nhat DEFAULT SYSDATETIME();
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_kq_quiz_hoc_vien' AND object_id = OBJECT_ID(N'dbo.ket_qua_quiz'))
    CREATE INDEX idx_kq_quiz_hoc_vien ON dbo.ket_qua_quiz(hoc_vien_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_ket_qua_quiz_cap_nhat
ON dbo.ket_qua_quiz AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE kq SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.ket_qua_quiz kq JOIN inserted i ON i.id = kq.id;
END
GO

IF OBJECT_ID(N'dbo.cau_tra_loi_quiz', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cau_tra_loi_quiz (
        id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ket_qua_quiz_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.ket_qua_quiz(id) ON DELETE CASCADE,
        cau_hoi_id        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.cau_hoi_quiz(id),
        dap_an_da_chon_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.dap_an_quiz(id),
        CONSTRAINT uq_ketqua_cauhoi UNIQUE (ket_qua_quiz_id, cau_hoi_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_cau_tra_loi_kq' AND object_id = OBJECT_ID(N'dbo.cau_tra_loi_quiz'))
    CREATE INDEX idx_cau_tra_loi_kq ON dbo.cau_tra_loi_quiz(ket_qua_quiz_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_ket_qua_quiz_phan_quyen
ON dbo.ket_qua_quiz AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE i.hoc_vien_id <> dbo.fn_CurrentUserId() AND NOT (dbo.fn_IsTeacher() = 1)
       )
        THROW 50051, N'Hoc vien chi duoc tao ket qua quiz cua chinh minh.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.quiz q ON q.id = i.quiz_id
        WHERE i.lan_lam_thu > q.so_lan_lam_toi_da
    )
        THROW 50052, N'Vuot qua so lan lam quiz toi da.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.quiz q ON q.id = i.quiz_id
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.ghi_danh gd
            WHERE gd.lop_hoc_id = q.lop_hoc_id
              AND gd.hoc_vien_id = i.hoc_vien_id AND gd.trang_thai = N'dang hoc'
        )
    )
        THROW 50053, N'Hoc vien chua ghi danh lop.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_cau_tra_loi_quiz_kiem_tra
ON dbo.cau_tra_loi_quiz AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN dbo.dap_an_quiz da ON da.id = i.dap_an_da_chon_id
        JOIN dbo.cau_hoi_quiz qh ON qh.id = da.cau_hoi_id
        WHERE qh.id <> i.cau_hoi_id
    )
        THROW 50054, N'Dap an duoc chon khong thuoc cau hoi.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i
        JOIN dbo.ket_qua_quiz kq ON kq.id = i.ket_qua_quiz_id
        JOIN dbo.quiz q ON q.id = kq.quiz_id
        JOIN dbo.cau_hoi_quiz ch ON ch.id = i.cau_hoi_id
        WHERE ch.quiz_id <> q.id
    )
        THROW 50055, N'Cau hoi khong thuoc quiz cua ket qua.', 1;
END
GO

/* ================================================================
   8. LICH HOC - DIEM DANH
   [FIX-05] Sua NULL-safe kiem tra trung phong hoc
   [FIX-09] Them kiem tra ngay_hoc trong khoang lop hoc
   ================================================================ */
IF OBJECT_ID(N'dbo.lich_hoc', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.lich_hoc (
        id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        lop_hoc_id        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lop_hoc(id) ON DELETE CASCADE,
        giao_vien_id      UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_hoc          DATE NOT NULL,
        gio_bat_dau       TIME(0) NOT NULL,
        gio_ket_thuc      TIME(0) NOT NULL,
        phong_hoc         NVARCHAR(100) NULL,
        duong_link_online NVARCHAR(500) NULL,
        CONSTRAINT ck_lich_hoc_gio      CHECK (gio_ket_thuc > gio_bat_dau),
        CONSTRAINT ck_lich_hoc_dia_diem CHECK (phong_hoc IS NOT NULL OR duong_link_online IS NOT NULL)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_lich_hoc_lop_ngay' AND object_id = OBJECT_ID(N'dbo.lich_hoc'))
    CREATE INDEX idx_lich_hoc_lop_ngay ON dbo.lich_hoc(lop_hoc_id, ngay_hoc);
GO

CREATE OR ALTER TRIGGER dbo.trg_lich_hoc_phan_quyen_trung
ON dbo.lich_hoc AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;

    -- Phan quyen
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE i.giao_vien_id <> dbo.fn_CurrentUserId()
              OR dbo.fn_CanManageClass(i.lop_hoc_id) = 0
       )
        THROW 50060, N'Chi giang vien phu trach moi duoc tao lich hoc.', 1;

    -- [FIX-09] Kiem tra ngay_hoc trong khoang lop hoc
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.lop_hoc l ON l.id = i.lop_hoc_id
        WHERE i.ngay_hoc < l.ngay_bat_dau OR i.ngay_hoc > l.ngay_ket_thuc
    )
        THROW 50066, N'Ngay hoc phai nam trong khoang [ngay_bat_dau, ngay_ket_thuc] cua lop.', 1;

    -- [FIX-05] Kiem tra trung phong hoc dung EXISTS (NULL-safe, dung voi phong vat ly)
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE i.phong_hoc IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM dbo.lich_hoc l
              WHERE l.ngay_hoc     = i.ngay_hoc
                AND l.id          <> i.id
                AND l.phong_hoc    = i.phong_hoc
                AND l.gio_bat_dau  < i.gio_ket_thuc
                AND l.gio_ket_thuc > i.gio_bat_dau
          )
    )
        THROW 50061, N'Phong hoc bi trung khung gio.', 1;

    -- Kiem tra trung lich giang vien
    IF EXISTS (
        SELECT 1 FROM inserted i
        WHERE EXISTS (
            SELECT 1 FROM dbo.lich_hoc l
            WHERE l.ngay_hoc      = i.ngay_hoc
              AND l.id            <> i.id
              AND l.giao_vien_id   = i.giao_vien_id
              AND l.gio_bat_dau   < i.gio_ket_thuc
              AND l.gio_ket_thuc  > i.gio_bat_dau
        )
    )
        THROW 50062, N'Giang vien bi trung khung gio.', 1;
END
GO

IF OBJECT_ID(N'dbo.diem_danh', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.diem_danh (
        id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        lich_hoc_id         UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lich_hoc(id) ON DELETE CASCADE,
        hoc_vien_id         UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        trang_thai          NVARCHAR(20) NOT NULL,
        thoi_gian_diem_danh DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        nguoi_diem_danh_id  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        CONSTRAINT ck_diem_danh_trang_thai
            CHECK (trang_thai IN (N'co mat', N'vang mat', N'di tre', N'co phep')),
        CONSTRAINT uq_diem_danh UNIQUE (lich_hoc_id, hoc_vien_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_diem_danh_lop' AND object_id = OBJECT_ID(N'dbo.diem_danh'))
    CREATE INDEX idx_diem_danh_lop ON dbo.diem_danh(lich_hoc_id, hoc_vien_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_diem_danh_kiem_tra
ON dbo.diem_danh AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.lich_hoc l ON l.id = i.lich_hoc_id
        WHERE l.ngay_hoc > CAST(SYSDATETIME() AS DATE)
    )
        THROW 50063, N'Khong the diem danh cho buoi hoc trong tuong lai.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.lich_hoc l ON l.id = i.lich_hoc_id
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.ghi_danh gd
            WHERE gd.lop_hoc_id = l.lop_hoc_id
              AND gd.hoc_vien_id = i.hoc_vien_id AND gd.trang_thai = N'dang hoc'
        )
    )
        THROW 50064, N'Hoc vien chua ghi danh lop.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i JOIN dbo.lich_hoc l ON l.id = i.lich_hoc_id
           WHERE i.nguoi_diem_danh_id <> dbo.fn_CurrentUserId()
              OR l.giao_vien_id <> dbo.fn_CurrentUserId()
       )
        THROW 50065, N'Chi giang vien phu trach moi duoc diem danh.', 1;
END
GO

/* ================================================================
   9. THONG BAO  [FIX-03]
   ================================================================ */
IF OBJECT_ID(N'dbo.thong_bao', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.thong_bao (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        nguoi_dung_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id) ON DELETE CASCADE,
        tieu_de       NVARCHAR(200) NOT NULL,
        noi_dung      NVARCHAR(MAX) NULL,
        da_doc        BIT NOT NULL DEFAULT 0,
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_thong_bao_user' AND object_id = OBJECT_ID(N'dbo.thong_bao'))
    CREATE INDEX idx_thong_bao_user ON dbo.thong_bao(nguoi_dung_id);
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE */
CREATE OR ALTER TRIGGER dbo.trg_thong_bao_phan_quyen
ON dbo.thong_bao AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE i.nguoi_dung_id <> dbo.fn_CurrentUserId())
        THROW 50070, N'Chi admin moi duoc gui thong bao cho nguoi khac.', 1;
END
GO

/* ================================================================
   10. HO TRO  [FIX-03] [FIX-06]
   ================================================================ */
IF OBJECT_ID(N'dbo.yeu_cau_ho_tro', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.yeu_cau_ho_tro (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        nguoi_dung_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        tieu_de       NVARCHAR(200) NOT NULL,
        danh_muc      NVARCHAR(20) NOT NULL DEFAULT N'khac',
        trang_thai    NVARCHAR(20) NOT NULL DEFAULT N'moi',
        do_uu_tien    NVARCHAR(20) NOT NULL DEFAULT N'trung binh',
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_xu_ly_xong DATETIME2 NULL,
        CONSTRAINT ck_yc_danh_muc  CHECK (danh_muc IN (N'ky thuat', N'tai khoan', N'khoa hoc', N'khac')),
        CONSTRAINT ck_yc_trang_thai CHECK (trang_thai IN (N'moi', N'dang xu ly', N'da xu ly', N'da dong')),
        CONSTRAINT ck_yc_uu_tien   CHECK (do_uu_tien IN (N'thap', N'trung binh', N'cao')),
        CONSTRAINT ck_yc_ngay_xu_ly CHECK (
            (trang_thai IN (N'da xu ly', N'da dong') AND ngay_xu_ly_xong IS NOT NULL)
            OR (trang_thai NOT IN (N'da xu ly', N'da dong') AND ngay_xu_ly_xong IS NULL)
        )
    );
END
GO

IF COL_LENGTH(N'dbo.yeu_cau_ho_tro', N'ngay_cap_nhat') IS NULL
    ALTER TABLE dbo.yeu_cau_ho_tro ADD ngay_cap_nhat DATETIME2 NOT NULL CONSTRAINT df_yc_ngay_cap_nhat DEFAULT SYSDATETIME();
GO
IF COL_LENGTH(N'dbo.yeu_cau_ho_tro', N'ngay_xu_ly_xong') IS NULL
    ALTER TABLE dbo.yeu_cau_ho_tro ADD ngay_xu_ly_xong DATETIME2 NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_yeu_cau_user' AND object_id = OBJECT_ID(N'dbo.yeu_cau_ho_tro'))
    CREATE INDEX idx_yeu_cau_user ON dbo.yeu_cau_ho_tro(nguoi_dung_id);
GO

CREATE OR ALTER TRIGGER dbo.trg_yeu_cau_ho_tro_cap_nhat
ON dbo.yeu_cau_ho_tro AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE yc SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.yeu_cau_ho_tro yc JOIN inserted i ON i.id = yc.id;
END
GO

IF OBJECT_ID(N'dbo.phan_hoi_ho_tro', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.phan_hoi_ho_tro (
        id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        yeu_cau_id   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.yeu_cau_ho_tro(id) ON DELETE CASCADE,
        nguoi_gui_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        noi_dung     NVARCHAR(MAX) NOT NULL,
        ngay_gui     DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE */
CREATE OR ALTER TRIGGER dbo.trg_yeu_cau_ho_tro_phan_quyen
ON dbo.yeu_cau_ho_tro AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE i.nguoi_dung_id <> dbo.fn_CurrentUserId())
        THROW 50080, N'Chi admin moi duoc quan ly yeu cau cua nguoi khac.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_phan_hoi_kiem_tra
ON dbo.phan_hoi_ho_tro AFTER INSERT AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.yeu_cau_ho_tro yc ON yc.id = i.yeu_cau_id
        WHERE yc.trang_thai = N'da dong'
    )
        THROW 50081, N'Khong the phan hoi yeu cau da dong.', 1;

    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE i.nguoi_gui_id <> dbo.fn_CurrentUserId())
        THROW 50082, N'Nguoi gui phan hoi khong hop le.', 1;
END
GO

/* ================================================================
   11. BAO CAO  [FIX-03]
   ================================================================ */
IF OBJECT_ID(N'dbo.bao_cao', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bao_cao (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        loai_bao_cao  NVARCHAR(20) NOT NULL,
        nguoi_tao_id  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        bo_loc        NVARCHAR(MAX) NULL,
        duong_dan_tep NVARCHAR(255) NULL,
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_het_han  DATETIME2 NOT NULL DEFAULT DATEADD(DAY,30,SYSDATETIME()),
        CONSTRAINT ck_bao_cao_loai CHECK (loai_bao_cao IN (N'nguoi dung', N'khoa hoc', N'diem danh', N'doanh thu')),
        CONSTRAINT ck_bao_cao_json CHECK (bo_loc IS NULL OR ISJSON(bo_loc) = 1)
    );
END
GO

/* [FIX-03] Doi sang AFTER INSERT, UPDATE */
CREATE OR ALTER TRIGGER dbo.trg_bao_cao_phan_quyen
ON dbo.bao_cao AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM inserted i
           WHERE i.nguoi_tao_id <> dbo.fn_CurrentUserId() OR dbo.fn_IsTeacher() = 0
       )
        THROW 50090, N'Chi giang vien hoac admin moi duoc tao quan ly bao cao.', 1;
END
GO

/* ================================================================
   12. VIEW
   ================================================================ */
CREATE OR ALTER VIEW dbo.vw_nguoi_dung_tong_quan AS
SELECT
    nd.id, nd.ho_ten, nd.email, nd.vai_tro, nd.trang_thai, nd.ngay_tao,
    COUNT(DISTINCT gd.lop_hoc_id) AS so_lop_dang_hoc
FROM dbo.nguoi_dung nd
LEFT JOIN dbo.ghi_danh gd ON gd.hoc_vien_id = nd.id
GROUP BY nd.id, nd.ho_ten, nd.email, nd.vai_tro, nd.trang_thai, nd.ngay_tao;
GO

CREATE OR ALTER VIEW dbo.vw_lop_hoc_tong_quan AS
SELECT
    l.id AS lop_hoc_id, l.ten_lop,
    k.id AS khoa_hoc_id, k.ten_khoa_hoc,
    gv.id AS giao_vien_id, gv.ho_ten AS ten_giao_vien,
    l.si_so_toi_da,
    SUM(CASE WHEN gd.trang_thai = N'dang hoc' THEN 1 ELSE 0 END) AS si_so_hien_tai,
    l.trang_thai, l.ngay_bat_dau, l.ngay_ket_thuc
FROM dbo.lop_hoc l
JOIN dbo.khoa_hoc k ON k.id = l.khoa_hoc_id
JOIN dbo.nguoi_dung gv ON gv.id = l.giao_vien_id
LEFT JOIN dbo.ghi_danh gd ON gd.lop_hoc_id = l.id
GROUP BY l.id,l.ten_lop,k.id,k.ten_khoa_hoc,gv.id,gv.ho_ten,
         l.si_so_toi_da,l.trang_thai,l.ngay_bat_dau,l.ngay_ket_thuc;
GO

/* ================================================================
   13. DU LIEU DEMO
   ================================================================ */
IF NOT EXISTS (SELECT 1 FROM dbo.nguoi_dung WHERE email=N'admin@demo.local')
    INSERT dbo.nguoi_dung(id,ho_ten,email,mat_khau_hash,vai_tro)
    VALUES(NEWID(),N'Administrator',N'admin@demo.local',
           N'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7',N'quan tri vien');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.nguoi_dung WHERE email=N'teacher@demo.local')
    INSERT dbo.nguoi_dung(id,ho_ten,email,mat_khau_hash,vai_tro)
    VALUES(NEWID(),N'Giang Vien Demo',N'teacher@demo.local',
           N'd041c3d3ca4ed64c5b54c5d807bd9a0bd2d6ae3609ecd2d06ac383bd449360e1',N'giang vien');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.nguoi_dung WHERE email=N'student@demo.local')
    INSERT dbo.nguoi_dung(id,ho_ten,email,mat_khau_hash,vai_tro)
    VALUES(NEWID(),N'Hoc Vien Demo',N'student@demo.local',
           N'b2a1f4fd0a460606b34c8913e2981dac8d2e283d778aba586c416ee2629bfa54',N'hoc vien');
GO

/* ================================================================
   14. TRIGGER CHAN QUYEN DELETE (dung bang 'deleted')
   ================================================================ */
CREATE OR ALTER TRIGGER dbo.trg_khoa_hoc_phan_quyen_delete ON dbo.khoa_hoc AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE d.nguoi_tao_id <> dbo.fn_CurrentUserId())
        THROW 50100, N'Chi admin hoac nguoi tao khoa hoc moi duoc xoa khoa hoc.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_lop_hoc_phan_quyen_delete ON dbo.lop_hoc AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE d.giao_vien_id <> dbo.fn_CurrentUserId())
        THROW 50101, N'Chi admin hoac giang vien phu trach moi duoc xoa lop.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_hoc_phan_quyen_delete ON dbo.bai_hoc AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d
           WHERE (d.lop_hoc_id IS NOT NULL AND dbo.fn_CanManageClass(d.lop_hoc_id) = 0)
              OR (d.khoa_hoc_id IS NOT NULL AND dbo.fn_CanManageCourse(d.khoa_hoc_id) = 0)
       )
        THROW 50102, N'Khong co quyen xoa bai hoc.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_tai_lieu_phan_quyen_delete ON dbo.tai_lieu AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d JOIN dbo.bai_hoc b ON b.id = d.bai_hoc_id
           WHERE (b.lop_hoc_id IS NOT NULL AND dbo.fn_CanManageClass(b.lop_hoc_id) = 0)
              OR (b.khoa_hoc_id IS NOT NULL AND dbo.fn_CanManageCourse(b.khoa_hoc_id) = 0)
       )
        THROW 50103, N'Khong co quyen xoa tai lieu.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_tap_phan_quyen_delete ON dbo.bai_tap AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE dbo.fn_CanManageClass(d.lop_hoc_id) = 0)
        THROW 50104, N'Khong co quyen xoa bai tap.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bai_tap_nop_phan_quyen_delete ON dbo.bai_tap_nop AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d JOIN dbo.bai_tap bt ON bt.id = d.bai_tap_id
           WHERE NOT (
               (dbo.fn_IsStudent() = 1 AND d.hoc_vien_id = dbo.fn_CurrentUserId())
               OR (dbo.fn_IsTeacher() = 1 AND dbo.fn_CanManageClass(bt.lop_hoc_id) = 1)
           )
       )
        THROW 50105, N'Khong co quyen xoa bai nop.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_quiz_phan_quyen_delete ON dbo.quiz AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE dbo.fn_CanManageClass(d.lop_hoc_id) = 0)
        THROW 50106, N'Khong co quyen xoa quiz.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_ket_qua_quiz_phan_quyen_delete ON dbo.ket_qua_quiz AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d
           WHERE d.hoc_vien_id <> dbo.fn_CurrentUserId() AND dbo.fn_IsTeacher() = 0
       )
        THROW 50107, N'Khong co quyen xoa ket qua quiz.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_lich_hoc_phan_quyen_delete ON dbo.lich_hoc AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE d.giao_vien_id <> dbo.fn_CurrentUserId())
        THROW 50108, N'Khong co quyen xoa lich hoc.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_diem_danh_phan_quyen_delete ON dbo.diem_danh AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d JOIN dbo.lich_hoc l ON l.id = d.lich_hoc_id
           WHERE l.giao_vien_id <> dbo.fn_CurrentUserId()
       )
        THROW 50109, N'Khong co quyen xoa diem danh.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_thong_bao_phan_quyen_delete ON dbo.thong_bao AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE d.nguoi_dung_id <> dbo.fn_CurrentUserId())
        THROW 50110, N'Chi duoc xoa thong bao cua chinh minh.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_yeu_cau_ho_tro_phan_quyen_delete ON dbo.yeu_cau_ho_tro AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM deleted d WHERE d.nguoi_dung_id <> dbo.fn_CurrentUserId())
        THROW 50111, N'Chi duoc xoa yeu cau ho tro cua chinh minh.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_bao_cao_phan_quyen_delete ON dbo.bao_cao AFTER DELETE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (
           SELECT 1 FROM deleted d
           WHERE d.nguoi_tao_id <> dbo.fn_CurrentUserId() OR dbo.fn_IsTeacher() = 0
       )
        THROW 50112, N'Khong co quyen xoa bao cao.', 1;
END
GO

/* ================================================================
   15. MO RONG LMS: NOI DUNG KHOA HOC + THUONG MAI
   ================================================================ */

IF COL_LENGTH(N'dbo.khoa_hoc',N'anh_dai_dien')    IS NULL ALTER TABLE dbo.khoa_hoc ADD anh_dai_dien    NVARCHAR(500) NULL;
IF COL_LENGTH(N'dbo.khoa_hoc',N'trinh_do_dau_vao') IS NULL ALTER TABLE dbo.khoa_hoc ADD trinh_do_dau_vao NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.khoa_hoc',N'diem_muc_tieu')    IS NULL ALTER TABLE dbo.khoa_hoc ADD diem_muc_tieu    DECIMAL(5,2) NULL;
IF COL_LENGTH(N'dbo.khoa_hoc',N'hinh_thuc')        IS NULL ALTER TABLE dbo.khoa_hoc ADD hinh_thuc        NVARCHAR(20) NOT NULL CONSTRAINT df_khoa_hoc_hinh_thuc DEFAULT N'tu hoc';
IF COL_LENGTH(N'dbo.khoa_hoc',N'thoi_luong_gio')   IS NULL ALTER TABLE dbo.khoa_hoc ADD thoi_luong_gio   DECIMAL(7,2) NULL;
IF COL_LENGTH(N'dbo.khoa_hoc',N'so_ngay_truy_cap') IS NULL ALTER TABLE dbo.khoa_hoc ADD so_ngay_truy_cap INT NULL;
IF COL_LENGTH(N'dbo.khoa_hoc',N'hien_thi')         IS NULL ALTER TABLE dbo.khoa_hoc ADD hien_thi         BIT NOT NULL CONSTRAINT df_khoa_hoc_hien_thi DEFAULT 0;
IF COL_LENGTH(N'dbo.khoa_hoc',N'trang_thai_duyet') IS NULL ALTER TABLE dbo.khoa_hoc ADD trang_thai_duyet NVARCHAR(20) NOT NULL CONSTRAINT df_khoa_hoc_trang_thai_duyet DEFAULT N'cho duyet';
GO

/* [FIX-07] Bat buoc co gia khi hien_thi = 1 */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints
               WHERE name=N'ck_khoa_hoc_hien_thi_gia'
                 AND parent_object_id=OBJECT_ID(N'dbo.khoa_hoc'))
    ALTER TABLE dbo.khoa_hoc ADD CONSTRAINT ck_khoa_hoc_hien_thi_gia
        CHECK (hien_thi = 0 OR gia IS NOT NULL);
GO

/* Chuong khoa hoc */
IF OBJECT_ID(N'dbo.chuong_khoa_hoc',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chuong_khoa_hoc (
        ma_chuong    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_khoa_hoc  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.khoa_hoc(id) ON DELETE CASCADE,
        ten_chuong   NVARCHAR(200) NOT NULL,
        mo_ta        NVARCHAR(MAX) NULL,
        thu_tu       INT NOT NULL DEFAULT 1,
        ngay_tao     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_chuong_thu_tu CHECK (thu_tu > 0)
    );
END
GO

CREATE OR ALTER TRIGGER dbo.trg_chuong_khoa_hoc_cap_nhat
ON dbo.chuong_khoa_hoc AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ckh SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.chuong_khoa_hoc ckh JOIN inserted i ON i.ma_chuong = ckh.ma_chuong;
END
GO

/* Noi dung trong chuong */
IF OBJECT_ID(N'dbo.noi_dung_khoa_hoc',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.noi_dung_khoa_hoc (
        ma_noi_dung      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_chuong        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.chuong_khoa_hoc(ma_chuong) ON DELETE CASCADE,
        tieu_de          NVARCHAR(250) NOT NULL,
        loai_noi_dung    NVARCHAR(30) NOT NULL,
        noi_dung         NVARCHAR(MAX) NULL,
        duong_dan_video  NVARCHAR(1000) NULL,
        tai_lieu_dinh_kem NVARCHAR(1000) NULL,
        thoi_luong_phut  INT NULL,
        thu_tu           INT NOT NULL DEFAULT 1,
        trang_thai_duyet NVARCHAR(20) NOT NULL DEFAULT N'cho duyet',
        ly_do_tu_choi    NVARCHAR(500) NULL,
        ma_admin_duyet   UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        ngay_duyet       DATETIME2 NULL,
        ngay_tao         DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_noi_dung_loai        CHECK (loai_noi_dung IN (N'bai doc',N'video',N'tai lieu',N'am thanh',N'bai tap')),
        CONSTRAINT ck_noi_dung_trang_thai  CHECK (trang_thai_duyet IN (N'cho duyet',N'da duyet',N'tu choi')),
        CONSTRAINT ck_noi_dung_thoi_luong  CHECK (thoi_luong_phut IS NULL OR thoi_luong_phut >= 0),
        CONSTRAINT ck_noi_dung_thu_tu      CHECK (thu_tu > 0)
    );
END
GO

/* Ma giam gia */
IF OBJECT_ID(N'dbo.ma_giam_gia',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ma_giam_gia (
        ma_giam_gia     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_code         NVARCHAR(50) NOT NULL UNIQUE,
        loai_giam       NVARCHAR(20) NOT NULL,
        gia_tri_giam    DECIMAL(12,2) NOT NULL,
        ngay_bat_dau    DATETIME2 NOT NULL,
        ngay_ket_thuc   DATETIME2 NOT NULL,
        so_luong_toi_da INT NULL,
        so_luot_da_dung INT NOT NULL DEFAULT 0,
        ma_khoa_hoc     UNIQUEIDENTIFIER NULL REFERENCES dbo.khoa_hoc(id),
        kich_hoat       BIT NOT NULL DEFAULT 1,
        ma_admin_tao    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ngay_tao        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_giam_gia_loai      CHECK (loai_giam IN (N'phan tram',N'tien mat')),
        CONSTRAINT ck_giam_gia_gia_tri   CHECK (gia_tri_giam > 0),
        CONSTRAINT ck_giam_gia_ngay      CHECK (ngay_ket_thuc > ngay_bat_dau),
        CONSTRAINT ck_giam_gia_so_luong  CHECK ((so_luong_toi_da IS NULL OR so_luong_toi_da > 0) AND so_luot_da_dung >= 0),
        CONSTRAINT ck_giam_gia_phan_tram CHECK (loai_giam <> N'phan tram' OR gia_tri_giam <= 100)
    );
END
GO

/* Cong thanh toan */
IF OBJECT_ID(N'dbo.cong_thanh_toan',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.cong_thanh_toan (
        ma_cong       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ten_cong      NVARCHAR(100) NOT NULL UNIQUE,
        phi_giao_dich DECIMAL(7,4) NOT NULL DEFAULT 0,
        kich_hoat     BIT NOT NULL DEFAULT 1,
        ngay_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_cong_phi CHECK (phi_giao_dich >= 0 AND phi_giao_dich <= 100)
    );
END
GO

/* Don hang */
IF OBJECT_ID(N'dbo.don_hang',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.don_hang (
        ma_don_hang     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_hoc_vien     UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ma_giam_gia     UNIQUEIDENTIFIER NULL REFERENCES dbo.ma_giam_gia(ma_giam_gia),
        tong_tien       DECIMAL(12,2) NOT NULL,
        so_tien_giam    DECIMAL(12,2) NOT NULL DEFAULT 0,
        so_tien_phai_tra DECIMAL(12,2) NOT NULL,
        trang_thai      NVARCHAR(20) NOT NULL DEFAULT N'cho thanh toan',
        ngay_tao        DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_don_hang_tien CHECK
            (tong_tien >= 0 AND so_tien_giam >= 0 AND so_tien_phai_tra >= 0
             AND so_tien_giam <= tong_tien AND so_tien_phai_tra = tong_tien - so_tien_giam),
        CONSTRAINT ck_don_hang_trang_thai CHECK (trang_thai IN
            (N'cho thanh toan',N'da thanh toan',N'that bai',N'da huy',
             N'hoan tien mot phan',N'da hoan tien'))
    );
END
GO

/* Chi tiet don hang */
IF OBJECT_ID(N'dbo.chi_tiet_don_hang',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chi_tiet_don_hang (
        ma_chi_tiet UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_don_hang UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.don_hang(ma_don_hang) ON DELETE CASCADE,
        ma_khoa_hoc UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.khoa_hoc(id),
        don_gia     DECIMAL(12,2) NOT NULL,
        CONSTRAINT uq_ctdh_don_khoa UNIQUE (ma_don_hang, ma_khoa_hoc),
        CONSTRAINT ck_ctdh_don_gia  CHECK (don_gia >= 0)
    );
END
GO

/* Thanh toan */
IF OBJECT_ID(N'dbo.thanh_toan',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.thanh_toan (
        ma_thanh_toan      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_don_hang        UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.don_hang(ma_don_hang),
        ma_cong            UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.cong_thanh_toan(ma_cong),
        so_tien            DECIMAL(12,2) NOT NULL,
        ma_giao_dich_cong  NVARCHAR(200) NULL,
        trang_thai         NVARCHAR(20) NOT NULL DEFAULT N'cho xu ly',
        thoi_gian_tao      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ma_admin_xac_nhan  UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        thoi_gian_xac_nhan DATETIME2 NULL,
        CONSTRAINT ck_thanh_toan_so_tien   CHECK (so_tien > 0),
        CONSTRAINT ck_thanh_toan_trang_thai CHECK (trang_thai IN (N'cho xu ly',N'thanh cong',N'that bai',N'huy'))
    );
END
GO

/* Yeu cau hoan tien */
IF OBJECT_ID(N'dbo.yeu_cau_hoan_tien',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.yeu_cau_hoan_tien (
        ma_yeu_cau     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_thanh_toan  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.thanh_toan(ma_thanh_toan),
        ma_hoc_vien    UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ly_do          NVARCHAR(1000) NOT NULL,
        so_tien_hoan   DECIMAL(12,2) NOT NULL,
        trang_thai     NVARCHAR(20) NOT NULL DEFAULT N'cho xu ly',
        ma_admin_xu_ly UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id),
        ngay_yeu_cau   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_xu_ly     DATETIME2 NULL,
        CONSTRAINT ck_hoan_tien_so_tien   CHECK (so_tien_hoan > 0),
        CONSTRAINT ck_hoan_tien_trang_thai CHECK (trang_thai IN (N'cho xu ly',N'da chap nhan',N'tu choi',N'da hoan tien'))
    );
END
GO

/* Hoa don */
IF OBJECT_ID(N'dbo.hoa_don',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.hoa_don (
        ma_hoa_don    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        so_hoa_don    NVARCHAR(50) NOT NULL UNIQUE,
        ma_don_hang   UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.don_hang(ma_don_hang),
        ngay_xuat     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ma_admin_xuat UNIQUEIDENTIFIER NULL REFERENCES dbo.nguoi_dung(id)
    );
END
GO

/* Dang ky khoa hoc */
IF OBJECT_ID(N'dbo.dang_ky_khoa_hoc',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.dang_ky_khoa_hoc (
        ma_dang_ky   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_hoc_vien  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        ma_khoa_hoc  UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.khoa_hoc(id),
        ma_don_hang  UNIQUEIDENTIFIER NULL REFERENCES dbo.don_hang(ma_don_hang),
        ngay_bat_dau DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_het_han DATETIME2 NULL,
        trang_thai   NVARCHAR(20) NOT NULL DEFAULT N'dang hoc',
        CONSTRAINT ck_dkkh_trang_thai    CHECK (trang_thai IN (N'dang hoc',N'het han',N'da huy',N'hoan thanh')),
        CONSTRAINT ck_dkkh_ngay          CHECK (ngay_het_han IS NULL OR ngay_het_han > ngay_bat_dau)
    );
END
GO

/* Cho phep dang ky lai khi het han/huy: dung Filtered Unique Index thay vi Hard Constraint */
IF EXISTS (
    SELECT 1 FROM sys.key_constraints 
    WHERE name = N'uq_dkkh_hoc_vien_khoa' AND parent_object_id = OBJECT_ID(N'dbo.dang_ky_khoa_hoc')
)
BEGIN
    ALTER TABLE dbo.dang_ky_khoa_hoc DROP CONSTRAINT uq_dkkh_hoc_vien_khoa;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'uq_dkkh_hoc_vien_active' AND object_id = OBJECT_ID(N'dbo.dang_ky_khoa_hoc')
)
BEGIN
    CREATE UNIQUE INDEX uq_dkkh_hoc_vien_active
    ON dbo.dang_ky_khoa_hoc(ma_hoc_vien, ma_khoa_hoc)
    WHERE trang_thai = N'dang hoc';
END
GO

/* Index thuong mai */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_don_hang_hoc_vien'     AND object_id=OBJECT_ID(N'dbo.don_hang'))
    CREATE INDEX idx_don_hang_hoc_vien     ON dbo.don_hang(ma_hoc_vien, ngay_tao DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_don_hang_trang_thai'   AND object_id=OBJECT_ID(N'dbo.don_hang'))
    CREATE INDEX idx_don_hang_trang_thai   ON dbo.don_hang(trang_thai, ngay_tao DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_thanh_toan_don_hang'   AND object_id=OBJECT_ID(N'dbo.thanh_toan'))
    CREATE INDEX idx_thanh_toan_don_hang   ON dbo.thanh_toan(ma_don_hang, thoi_gian_tao DESC);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_chuong_khoa_hoc'       AND object_id=OBJECT_ID(N'dbo.chuong_khoa_hoc'))
    CREATE INDEX idx_chuong_khoa_hoc       ON dbo.chuong_khoa_hoc(ma_khoa_hoc, thu_tu);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_noi_dung_chuong'       AND object_id=OBJECT_ID(N'dbo.noi_dung_khoa_hoc'))
    CREATE INDEX idx_noi_dung_chuong       ON dbo.noi_dung_khoa_hoc(ma_chuong, thu_tu);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_noi_dung_trang_thai'   AND object_id=OBJECT_ID(N'dbo.noi_dung_khoa_hoc'))
    CREATE INDEX idx_noi_dung_trang_thai   ON dbo.noi_dung_khoa_hoc(trang_thai_duyet);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_dang_ky_khoa_hoc'      AND object_id=OBJECT_ID(N'dbo.dang_ky_khoa_hoc'))
    CREATE INDEX idx_dang_ky_khoa_hoc      ON dbo.dang_ky_khoa_hoc(ma_khoa_hoc, trang_thai);
GO

/* View khoa hoc cong khai */
CREATE OR ALTER VIEW dbo.vw_khoa_hoc_cong_khai AS
SELECT
    kh.id AS khoa_hoc_id, kh.ten_khoa_hoc, kh.mo_ta, kh.anh_dai_dien,
    kh.trinh_do, kh.trinh_do_dau_vao, kh.diem_muc_tieu, kh.loai_ky_thi,
    kh.hinh_thuc, kh.thoi_luong_gio, kh.so_ngay_truy_cap, kh.gia, kh.ngay_tao,
    dm.ten_danh_muc
FROM dbo.khoa_hoc kh JOIN dbo.danh_muc_khoa_hoc dm ON dm.id = kh.danh_muc_id
WHERE kh.trang_thai = N'da xuat ban' AND kh.hien_thi = 1
  AND kh.trang_thai_duyet = N'da duyet';
GO

/* ================================================================
   16. BANG MOI BO SUNG  [FIX-11]
   ================================================================ */

/* Theo doi tien do hoc */
IF OBJECT_ID(N'dbo.tien_do_hoc',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tien_do_hoc (
        ma_dang_ky    UNIQUEIDENTIFIER NOT NULL,
        ma_noi_dung   UNIQUEIDENTIFIER NOT NULL,
        da_hoan_thanh BIT NOT NULL DEFAULT 0,
        thoi_gian_xem INT NULL,
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT pk_tien_do_hoc   PRIMARY KEY (ma_dang_ky, ma_noi_dung),
        CONSTRAINT fk_tdh_dang_ky   FOREIGN KEY (ma_dang_ky) REFERENCES dbo.dang_ky_khoa_hoc(ma_dang_ky) ON DELETE CASCADE,
        CONSTRAINT fk_tdh_noi_dung  FOREIGN KEY (ma_noi_dung) REFERENCES dbo.noi_dung_khoa_hoc(ma_noi_dung),
        CONSTRAINT ck_tdh_thoi_gian CHECK (thoi_gian_xem IS NULL OR thoi_gian_xem >= 0)
    );
END
GO

CREATE OR ALTER TRIGGER dbo.trg_tien_do_hoc_cap_nhat
ON dbo.tien_do_hoc AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE tdh SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.tien_do_hoc tdh
    JOIN inserted i ON i.ma_dang_ky = tdh.ma_dang_ky AND i.ma_noi_dung = tdh.ma_noi_dung;
END
GO

/* Chung chi */
IF OBJECT_ID(N'dbo.chung_chi',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.chung_chi (
        id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_dang_ky   UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.dang_ky_khoa_hoc(ma_dang_ky),
        so_chung_chi NVARCHAR(50) NOT NULL UNIQUE,
        ngay_cap     DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_het_han DATETIME2 NULL,
        trang_thai   NVARCHAR(20) NOT NULL DEFAULT N'hop le',
        CONSTRAINT ck_cc_trang_thai CHECK (trang_thai IN (N'hop le',N'het han',N'bi thu hoi')),
        CONSTRAINT ck_cc_ngay       CHECK (ngay_het_han IS NULL OR ngay_het_han > ngay_cap)
    );
END
GO

/* Danh gia khoa hoc */
IF OBJECT_ID(N'dbo.danh_gia_khoa_hoc',N'U') IS NULL
BEGIN
    CREATE TABLE dbo.danh_gia_khoa_hoc (
        id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
        ma_dang_ky    UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES dbo.dang_ky_khoa_hoc(ma_dang_ky),
        ma_khoa_hoc   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.khoa_hoc(id),
        ma_hoc_vien   UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.nguoi_dung(id),
        so_sao        TINYINT NOT NULL,
        nhan_xet      NVARCHAR(MAX) NULL,
        ngay_danh_gia DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        ngay_cap_nhat DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT ck_dg_so_sao CHECK (so_sao BETWEEN 1 AND 5)
    );
END
GO

CREATE OR ALTER TRIGGER dbo.trg_danh_gia_kiem_tra
ON dbo.danh_gia_khoa_hoc AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF dbo.fn_CurrentUserId() IS NOT NULL AND dbo.fn_IsAdmin() = 0
       AND EXISTS (SELECT 1 FROM inserted i WHERE i.ma_hoc_vien <> dbo.fn_CurrentUserId())
        THROW 50130, N'Hoc vien chi duoc danh gia khoa hoc cua chinh minh.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.dang_ky_khoa_hoc dk ON dk.ma_dang_ky = i.ma_dang_ky
        WHERE dk.trang_thai <> N'hoan thanh'
    )
        THROW 50131, N'Chi duoc danh gia sau khi hoan thanh khoa hoc.', 1;

    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.dang_ky_khoa_hoc dk ON dk.ma_dang_ky = i.ma_dang_ky
        WHERE dk.ma_hoc_vien <> i.ma_hoc_vien OR dk.ma_khoa_hoc <> i.ma_khoa_hoc
    )
        THROW 50132, N'Thong tin hoc vien hoac khoa hoc khong khop voi dang ky.', 1;
END
GO

CREATE OR ALTER TRIGGER dbo.trg_danh_gia_cap_nhat
ON dbo.danh_gia_khoa_hoc AFTER UPDATE AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dg SET ngay_cap_nhat = SYSDATETIME()
    FROM dbo.danh_gia_khoa_hoc dg JOIN inserted i ON i.id = dg.id;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_tien_do_dang_ky'  AND object_id=OBJECT_ID(N'dbo.tien_do_hoc'))
    CREATE INDEX idx_tien_do_dang_ky  ON dbo.tien_do_hoc(ma_dang_ky, da_hoan_thanh);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'idx_danh_gia_khoa_hoc' AND object_id=OBJECT_ID(N'dbo.danh_gia_khoa_hoc'))
    CREATE INDEX idx_danh_gia_khoa_hoc ON dbo.danh_gia_khoa_hoc(ma_khoa_hoc, so_sao);
GO

/* ================================================================
   17. TRIGGER TU DONG TANG SO_LUOT_DA_DUNG  [FIX-08]
   ================================================================ */
CREATE OR ALTER TRIGGER dbo.trg_don_hang_ma_giam_gia
ON dbo.don_hang AFTER INSERT, UPDATE AS
BEGIN
    SET NOCOUNT ON;
    IF TRIGGER_NESTLEVEL() > 1 RETURN;

    /* Tang so_luot_da_dung theo tap hop khi don hang lan dau chuyen sang 'da thanh toan' */
    WITH CouponCounts AS (
        SELECT i.ma_giam_gia, COUNT(*) AS cnt
        FROM inserted i
        LEFT JOIN deleted d ON d.ma_don_hang = i.ma_don_hang
        WHERE i.trang_thai = N'da thanh toan'
          AND (d.ma_don_hang IS NULL OR d.trang_thai <> N'da thanh toan')
          AND i.ma_giam_gia IS NOT NULL
        GROUP BY i.ma_giam_gia
    )
    UPDATE mgg
    SET so_luot_da_dung = mgg.so_luot_da_dung + c.cnt
    FROM dbo.ma_giam_gia mgg
    JOIN CouponCounts c ON c.ma_giam_gia = mgg.ma_giam_gia;

    /* Kiem tra gioi han su dung */
    IF EXISTS (
        SELECT 1 FROM inserted i JOIN dbo.ma_giam_gia mgg ON mgg.ma_giam_gia = i.ma_giam_gia
        WHERE i.trang_thai = N'da thanh toan'
          AND mgg.so_luong_toi_da IS NOT NULL
          AND mgg.so_luot_da_dung > mgg.so_luong_toi_da
    )
        THROW 50120, N'Ma giam gia da het luot su dung.', 1;

    /* Cap nhat ngay_cap_nhat neu chua cap nhat */
    IF NOT UPDATE(ngay_cap_nhat)
    BEGIN
        UPDATE dh SET ngay_cap_nhat = SYSDATETIME()
        FROM dbo.don_hang dh JOIN inserted i ON i.ma_don_hang = dh.ma_don_hang;
    END
END
GO

/* ================================================================
   HUONG DAN TEST PHAN QUYEN
   ================================================================
   SELECT id, email, vai_tro FROM dbo.nguoi_dung;

   EXEC dbo.sp_SetCurrentUser @UserId = 'GUID_ADMIN';
   EXEC dbo.sp_SetCurrentUser @UserId = 'GUID_TEACHER';
   EXEC dbo.sp_SetCurrentUser @UserId = 'GUID_STUDENT';

   SELECT dbo.fn_CurrentUserId() AS CurrentUserId,
          dbo.fn_IsAdmin()       AS IsAdmin,
          dbo.fn_IsTeacher()     AS IsTeacher,
          dbo.fn_IsStudent()     AS IsStudent;

   LUU Y BAO MAT:
   - Backend xac minh chu ky callback/webhook thanh toan truoc khi cap quyen.
   - Mat khau hash bang Argon2id/bcrypt o backend, khong luu plaintext.
   ================================================================ */
GO
