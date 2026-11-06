/* ================================================================
   KỊCH BẢN KIỂM THỬ TỰ ĐỘNG DATABASE (TEST SUITE - SELF-CONTAINED)
   Cơ sở dữ liệu: QuanLyDaoTao_HopNhat
   Đặc điểm: Tự tạo dữ liệu phụ thuộc trong Transaction, tự ROLLBACK,
             chạy an toàn tuyệt đối và độc lập ngay cả khi DB trống!
   ================================================================ */

USE QuanLyDaoTao_HopNhat;
GO

SET NOCOUNT ON;
PRINT N'======================================================';
PRINT N'   BẮT ĐẦU KIỂM THỬ RÀNG BUỘC VÀ TRIGGER HỆ THỐNG     ';
PRINT N'======================================================';

DECLARE @TotalTests INT = 0;
DECLARE @PassedTests INT = 0;

-- ---------------------------------------------------------------
-- TEST 1: Bảo vệ Admin cuối cùng (Trigger trg_nguoi_dung_bao_ve_admin_cuoi)
-- Kỳ vọng: Không cho phép xóa hoặc hạ quyền Admin duy nhất còn lại
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @admin_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai <> N'da xoa');
    IF @admin_id IS NULL
    BEGIN
        SET @admin_id = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@admin_id, N'Admin Test 1', N'adm_test1@domain.com', N'hash', N'quan tri vien');
    END

    UPDATE dbo.nguoi_dung SET vai_tro = N'hoc vien' WHERE id = @admin_id;
    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 1: Lỗi bảo vệ Admin cuối (Không chặn được hạ quyền Admin cuối)';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    IF ERROR_NUMBER() = 50002
    BEGIN
        SET @PassedTests = @PassedTests + 1;
        PRINT N'[PASS] Test 1: Bảo vệ Admin cuối hoạt động chính xác (Error 50002)';
    END
    ELSE
        PRINT N'[FAIL] Test 1: Ném sai mã lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

-- ---------------------------------------------------------------
-- TEST 2: Xuất bản bài học trực thuộc khóa học (Trigger trg_bai_hoc_phan_quyen_xuat_ban)
-- Kỳ vọng: Bài học gắn trực tiếp vào khóa học đã xuất bản PHẢI XUẤT BẢN ĐƯỢC
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @dm_id UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.danh_muc_khoa_hoc);
    IF @dm_id IS NULL
    BEGIN
        SET @dm_id = NEWID();
        INSERT INTO dbo.danh_muc_khoa_hoc(id, ten_danh_muc) 
        VALUES (@dm_id, N'Danh Mục Test Suite ' + CAST(NEWID() AS NVARCHAR(36)));
    END

    DECLARE @admin_uid UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai = N'dang hoat dong');
    IF @admin_uid IS NULL
    BEGIN
        SET @admin_uid = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@admin_uid, N'Admin Test 2', N'adm_test2_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'quan tri vien');
    END
    
    DECLARE @kh_id UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.khoa_hoc(id, ten_khoa_hoc, danh_muc_id, nguoi_tao_id, trang_thai, gia)
    VALUES (@kh_id, N'Khóa Học Test Xuất Bản ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @dm_id, @admin_uid, N'da xuat ban', 500000);

    DECLARE @bh_id UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.bai_hoc(id, khoa_hoc_id, tieu_de, thu_tu, trang_thai)
    VALUES (@bh_id, @kh_id, N'Bài 1: Giới thiệu', 1, N'da xuat ban');

    ROLLBACK TRAN;
    SET @PassedTests = @PassedTests + 1;
    PRINT N'[PASS] Test 2: Xuất bản bài học thuộc khóa học thành công';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 2: Xuất bản bài học bị lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

-- ---------------------------------------------------------------
-- TEST 3: Giới hạn số lượt dùng mã giảm giá (Trigger trg_don_hang_ma_giam_gia)
-- Kỳ vọng: Khi mã giảm giá hết lượt, không cho đơn hàng hoàn tất thanh toán
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @mgg UNIQUEIDENTIFIER = NEWID();
    DECLARE @ad UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai = N'dang hoat dong');
    IF @ad IS NULL
    BEGIN
        SET @ad = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@ad, N'Admin Test 3', N'adm_test3_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'quan tri vien');
    END

    DECLARE @hv UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'hoc vien' AND trang_thai = N'dang hoat dong');
    IF @hv IS NULL
    BEGIN
        SET @hv = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@hv, N'Học Viên Test 3', N'hv_test3_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'hoc vien');
    END

    INSERT INTO dbo.ma_giam_gia(ma_giam_gia, ma_code, loai_giam, gia_tri_giam, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da, so_luot_da_dung, ma_admin_tao)
    VALUES (@mgg, N'TEST_LIMIT_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), N'tien mat', 10000, SYSDATETIME(), DATEADD(DAY, 7, SYSDATETIME()), 1, 0, @ad);

    -- Đơn hàng 1 dùng mã (số lượt đã dùng tăng từ 0 -> 1 <= 1: Thành công)
    DECLARE @dh1 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.don_hang(ma_don_hang, ma_hoc_vien, ma_giam_gia, tong_tien, so_tien_giam, so_tien_phai_tra, trang_thai)
    VALUES (@dh1, @hv, @mgg, 100000, 10000, 90000, N'da thanh toan');

    -- Đơn hàng 2 cố tình dùng tiếp (số lượt tăng từ 1 -> 2 > 1: Bị chặn Error 50120)
    DECLARE @dh2 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.don_hang(ma_don_hang, ma_hoc_vien, ma_giam_gia, tong_tien, so_tien_giam, so_tien_phai_tra, trang_thai)
    VALUES (@dh2, @hv, @mgg, 100000, 10000, 90000, N'da thanh toan');

    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 3: Không chặn được mã giảm giá đã quá số lượng tối đa';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    IF ERROR_NUMBER() = 50120
    BEGIN
        SET @PassedTests = @PassedTests + 1;
        PRINT N'[PASS] Test 3: Chặn mã giảm giá hết lượt thành công (Error 50120)';
    END
    ELSE
        PRINT N'[FAIL] Test 3: Ném sai mã lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

-- ---------------------------------------------------------------
-- TEST 4: Trùng phòng học cùng khung giờ (Trigger trg_lich_hoc_phan_quyen_trung)
-- Kỳ vọng: Báo lỗi 50061 khi xếp trùng phòng học vật lý
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @gv UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'giang vien' AND trang_thai = N'dang hoat dong');
    IF @gv IS NULL
    BEGIN
        SET @gv = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@gv, N'GV Test 4', N'gv_test4_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'giang vien');
    END

    DECLARE @gv2 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
    VALUES (@gv2, N'GV Test 4b', N'gv_test4b_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'giang vien');

    DECLARE @admin4 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai = N'dang hoat dong');
    IF @admin4 IS NULL
    BEGIN
        SET @admin4 = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@admin4, N'Admin Test 4', N'adm_test4_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'quan tri vien');
    END

    DECLARE @dm4 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.danh_muc_khoa_hoc);
    IF @dm4 IS NULL
    BEGIN
        SET @dm4 = NEWID();
        INSERT INTO dbo.danh_muc_khoa_hoc(id, ten_danh_muc) 
        VALUES (@dm4, N'Danh Mục Test 4 ' + CAST(NEWID() AS NVARCHAR(36)));
    END

    DECLARE @kh4 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.khoa_hoc(id, ten_khoa_hoc, danh_muc_id, nguoi_tao_id, trang_thai, gia)
    VALUES (@kh4, N'Khóa Học Test 4 ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @dm4, @admin4, N'da xuat ban', 200000);

    DECLARE @lop UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.lop_hoc(id, khoa_hoc_id, ten_lop, giao_vien_id, si_so_toi_da, ngay_bat_dau, ngay_ket_thuc)
    VALUES (@lop, @kh4, N'Lớp Test Phòng ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @gv, 30, '2026-11-01', '2026-12-31');

    -- Tiết 1: GV 1 dạy phòng A1 từ 08:00 đến 10:00
    INSERT INTO dbo.lich_hoc(lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, phong_hoc)
    VALUES (@lop, @gv, '2026-11-20', '08:00:00', '10:00:00', N'PHONG_A1');

    -- Tiết 2: GV 2 xếp phòng A1 từ 09:00 đến 11:00 (Trùng phòng -> Chặn Error 50061)
    INSERT INTO dbo.lich_hoc(lop_hoc_id, giao_vien_id, ngay_hoc, gio_bat_dau, gio_ket_thuc, phong_hoc)
    VALUES (@lop, @gv2, '2026-11-20', '09:00:00', '11:00:00', N'PHONG_A1');

    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 4: Không chặn được lịch học trùng phòng';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    IF ERROR_NUMBER() = 50061
    BEGIN
        SET @PassedTests = @PassedTests + 1;
        PRINT N'[PASS] Test 4: Chặn trùng phòng học thành công (Error 50061)';
    END
    ELSE
        PRINT N'[FAIL] Test 4: Ném sai mã lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

-- ---------------------------------------------------------------
-- TEST 5: Sĩ số tối đa lớp học (Trigger trg_ghi_danh_kiem_tra)
-- Kỳ vọng: Báo lỗi 50015 khi số học viên vượt quá si_so_toi_da
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @gv_t UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'giang vien' AND trang_thai = N'dang hoat dong');
    IF @gv_t IS NULL
    BEGIN
        SET @gv_t = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@gv_t, N'GV Test 5', N'gv_test5_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'giang vien');
    END

    DECLARE @admin5 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai = N'dang hoat dong');
    IF @admin5 IS NULL
    BEGIN
        SET @admin5 = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@admin5, N'Admin Test 5', N'adm_test5_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'quan tri vien');
    END

    DECLARE @dm5 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.danh_muc_khoa_hoc);
    IF @dm5 IS NULL
    BEGIN
        SET @dm5 = NEWID();
        INSERT INTO dbo.danh_muc_khoa_hoc(id, ten_danh_muc) 
        VALUES (@dm5, N'Danh Mục Test 5 ' + CAST(NEWID() AS NVARCHAR(36)));
    END

    DECLARE @kh_t UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.khoa_hoc(id, ten_khoa_hoc, danh_muc_id, nguoi_tao_id, trang_thai, gia)
    VALUES (@kh_t, N'Khóa Học Test 5 ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @dm5, @admin5, N'da xuat ban', 300000);

    DECLARE @lop_test UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.lop_hoc(id, khoa_hoc_id, ten_lop, giao_vien_id, si_so_toi_da, ngay_bat_dau, ngay_ket_thuc)
    VALUES (@lop_test, @kh_t, N'Lớp Test Sĩ Số 1 Người ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @gv_t, 1, '2026-11-01', '2026-12-01');

    -- Học viên 1 ghi danh thành công (1/1)
    DECLARE @hv1 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
    VALUES (@hv1, N'Học Viên 1', N'hv1_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@test.com', N'hash1', N'hoc vien');
    INSERT INTO dbo.ghi_danh(lop_hoc_id, hoc_vien_id) VALUES (@lop_test, @hv1);

    -- Học viên 2 ghi danh -> Phải bị chặn vì quá sĩ số (max 1) -> Error 50015
    DECLARE @hv2 UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
    VALUES (@hv2, N'Học Viên 2', N'hv2_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@test.com', N'hash2', N'hoc vien');
    INSERT INTO dbo.ghi_danh(lop_hoc_id, hoc_vien_id) VALUES (@lop_test, @hv2);

    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 5: Không chặn được khi vượt quá sĩ số tối đa';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    IF ERROR_NUMBER() = 50015
    BEGIN
        SET @PassedTests = @PassedTests + 1;
        PRINT N'[PASS] Test 5: Chặn vượt sĩ số tối đa thành công (Error 50015)';
    END
    ELSE
        PRINT N'[FAIL] Test 5: Ném sai mã lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

-- ---------------------------------------------------------------
-- TEST 6: Đánh giá khóa học khi chưa hoàn thành (Trigger trg_danh_gia_kiem_tra)
-- Kỳ vọng: Báo lỗi 50131 nếu trạng thái đăng ký chưa phải 'hoan thanh'
-- ---------------------------------------------------------------
SET @TotalTests = @TotalTests + 1;
BEGIN TRY
    BEGIN TRAN;
    DECLARE @admin6 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'quan tri vien' AND trang_thai = N'dang hoat dong');
    IF @admin6 IS NULL
    BEGIN
        SET @admin6 = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@admin6, N'Admin Test 6', N'adm_test6_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'quan tri vien');
    END

    DECLARE @dm6 UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.danh_muc_khoa_hoc);
    IF @dm6 IS NULL
    BEGIN
        SET @dm6 = NEWID();
        INSERT INTO dbo.danh_muc_khoa_hoc(id, ten_danh_muc) 
        VALUES (@dm6, N'Danh Mục Test 6 ' + CAST(NEWID() AS NVARCHAR(36)));
    END

    DECLARE @kh_dg UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.khoa_hoc(id, ten_khoa_hoc, danh_muc_id, nguoi_tao_id, trang_thai, gia)
    VALUES (@kh_dg, N'Khóa Học Test 6 ' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8), @dm6, @admin6, N'da xuat ban', 400000);

    DECLARE @hv_dg UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM dbo.nguoi_dung WHERE vai_tro = N'hoc vien' AND trang_thai = N'dang hoat dong');
    IF @hv_dg IS NULL
    BEGIN
        SET @hv_dg = NEWID();
        INSERT INTO dbo.nguoi_dung(id, ho_ten, email, mat_khau_hash, vai_tro)
        VALUES (@hv_dg, N'Học Viên Test 6', N'hv_test6_' + SUBSTRING(CAST(NEWID() AS NVARCHAR(36)), 1, 8) + N'@domain.com', N'hash', N'hoc vien');
    END

    DECLARE @dk_dg UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.dang_ky_khoa_hoc(ma_dang_ky, ma_hoc_vien, ma_khoa_hoc, trang_thai)
    VALUES (@dk_dg, @hv_dg, @kh_dg, N'dang hoc'); -- Đang học, chưa hoàn thành

    -- Đánh giá khóa học -> Phải bị chặn Error 50131
    INSERT INTO dbo.danh_gia_khoa_hoc(ma_dang_ky, ma_khoa_hoc, ma_hoc_vien, so_sao, nhan_xet)
    VALUES (@dk_dg, @kh_dg, @hv_dg, 5, N'Khóa học rất hay!');

    ROLLBACK TRAN;
    PRINT N'[FAIL] Test 6: Cho phép đánh giá khi chưa hoàn thành khóa học';
END TRY
BEGIN CATCH
    ROLLBACK TRAN;
    IF ERROR_NUMBER() = 50131
    BEGIN
        SET @PassedTests = @PassedTests + 1;
        PRINT N'[PASS] Test 6: Chặn đánh giá sớm thành công (Error 50131)';
    END
    ELSE
        PRINT N'[FAIL] Test 6: Ném sai mã lỗi (' + CAST(ERROR_NUMBER() AS NVARCHAR(20)) + N': ' + ERROR_MESSAGE() + N')';
END CATCH;

PRINT N'------------------------------------------------------';
PRINT N'KẾT QUẢ KIỂM THỬ: ' + CAST(@PassedTests AS NVARCHAR(10)) + N'/' + CAST(@TotalTests AS NVARCHAR(10)) + N' bài kiểm tra đạt chuẩn (PASS).';
PRINT N'======================================================';
GO