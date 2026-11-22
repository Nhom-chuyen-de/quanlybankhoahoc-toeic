USE QuanLyDaoTao_HopNhat;

IF EXISTS (SELECT 1 FROM dbo.nguoi_dung WHERE email = N'admin@toeic.vn')
    UPDATE dbo.nguoi_dung
    SET mat_khau_hash = N'$2b$12$0RNdy28IpyxnAVbE8g1GZeFYRbB7vpxZHc3EOYe1FJ4WZAvecEv82',
        vai_tro = N'quan tri vien',
        trang_thai = N'dang hoat dong'
    WHERE email = N'admin@toeic.vn';
ELSE
    UPDATE dbo.nguoi_dung
    SET email = N'admin@toeic.vn',
        mat_khau_hash = N'$2b$12$0RNdy28IpyxnAVbE8g1GZeFYRbB7vpxZHc3EOYe1FJ4WZAvecEv82',
        trang_thai = N'dang hoat dong'
    WHERE email = N'admin@demo.local';  