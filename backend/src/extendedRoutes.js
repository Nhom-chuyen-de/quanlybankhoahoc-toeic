import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, sql } from './db.js';

const router = Router();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const id = (value) => { if (!uuid.test(value || '')) throw fail(400, 'INVALID_ID', 'ID không hợp lệ.'); return value; };
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../storage/reports');
const reportTypes = { users: 'nguoi dung', courses: 'khoa hoc', revenue: 'doanh thu' };
const parseDate = (raw) => {
  if (!raw) return null;
  const text = String(raw).trim();
  const vi = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  const d = vi ? new Date(+vi[3], +vi[2] - 1, +vi[1], +(vi[4] || 0), +(vi[5] || 0)) : new Date(text);
  if (Number.isNaN(d.valueOf())) throw fail(400, 'VALIDATION_ERROR', 'Ngày lọc không hợp lệ.');
  return d;
};
const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const makeCsv = (columns, rows) => `\uFEFF${[columns, ...rows.map(row => columns.map((key, i) => row[i]))].map(row => row.map(csvEscape).join(',')).join('\r\n')}`;

router.get('/courses/:id/detail',async(req,res)=>{
  const courseId=id(req.params.id),pool=await getPool(),result=await pool.request().input('id',sql.UniqueIdentifier,courseId).query(`
    SELECT k.id,k.ten_khoa_hoc,k.mo_ta,k.trinh_do,k.trang_thai,k.loai_ky_thi,k.gia,d.id category_id,d.ten_danh_muc,g.ho_ten creator
    FROM dbo.khoa_hoc k JOIN dbo.danh_muc_khoa_hoc d ON d.id=k.danh_muc_id JOIN dbo.nguoi_dung g ON g.id=k.nguoi_tao_id WHERE k.id=@id;
    SELECT ma_chuong,ten_chuong,mo_ta,thu_tu FROM dbo.chuong_khoa_hoc WHERE ma_khoa_hoc=@id ORDER BY thu_tu;
    SELECT n.ma_noi_dung,n.ma_chuong,n.tieu_de,n.loai_noi_dung,n.thoi_luong_phut,n.trang_thai_duyet,n.ly_do_tu_choi,n.thu_tu
    FROM dbo.noi_dung_khoa_hoc n JOIN dbo.chuong_khoa_hoc c ON c.ma_chuong=n.ma_chuong WHERE c.ma_khoa_hoc=@id ORDER BY c.thu_tu,n.thu_tu;
    SELECT l.id,l.ten_lop,l.giao_vien_id,g.ho_ten teacher,l.si_so_toi_da,l.ngay_bat_dau,l.ngay_ket_thuc,l.trang_thai,
      (SELECT COUNT(*) FROM dbo.ghi_danh gd WHERE gd.lop_hoc_id=l.id AND gd.trang_thai=N'dang hoc') enrolled
    FROM dbo.lop_hoc l JOIN dbo.nguoi_dung g ON g.id=l.giao_vien_id WHERE l.khoa_hoc_id=@id ORDER BY l.ngay_bat_dau DESC;`);
  const c=result.recordsets[0][0];if(!c)throw fail(404,'NOT_FOUND','Không tìm thấy khóa học.');
  const lessonsByChapter=new Map();for(const lesson of result.recordsets[2]){const items=lessonsByChapter.get(lesson.ma_chuong)||[];items.push({id:lesson.ma_noi_dung,title:lesson.tieu_de,type:lesson.loai_noi_dung,duration:lesson.thoi_luong_phut?`${lesson.thoi_luong_phut} phút`:'',moderationStatus:lesson.trang_thai_duyet,rejectionReason:lesson.ly_do_tu_choi});lessonsByChapter.set(lesson.ma_chuong,items);}
  const chapters=result.recordsets[1].map(ch=>({id:ch.ma_chuong,title:ch.ten_chuong,description:ch.mo_ta,order:ch.thu_tu,lessons:lessonsByChapter.get(ch.ma_chuong)||[]}));
  const classes=result.recordsets[3].map(cl=>({id:cl.id,name:cl.ten_lop,classCode:cl.ten_lop,teacher:cl.teacher,enrolled:cl.enrolled,max:cl.si_so_toi_da,startDate:cl.ngay_bat_dau,status:{'sap dien ra':'upcoming','dang dien ra':'ongoing','da hoan thanh':'completed','da huy':'cancelled'}[cl.trang_thai]}));
  res.json({data:{id:c.id,title:c.ten_khoa_hoc,description:c.mo_ta,category:c.ten_danh_muc,categoryId:c.category_id,creator:c.creator,level:{'co ban':'beginner','trung cap':'intermediate','nang cao':'advanced'}[c.trinh_do],examType:c.loai_ky_thi==='khong ap dung'?'none':c.loai_ky_thi,price:c.gia,status:{nhap:'draft','da xuat ban':'published','da luu tru':'archived'}[c.trang_thai],moderationStatus:c.trang_thai==='da xuat ban'?'approved':'pending',chapters,classes}});
});

// Class operations backed by lop_hoc, ghi_danh, lich_hoc and diem_danh.
router.get('/classes/:id', async (req, res) => {
  const classId = id(req.params.id), pool = await getPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, classId).query(`
    SELECT l.id,l.ten_lop,l.khoa_hoc_id,k.ten_khoa_hoc,l.giao_vien_id,g.ho_ten ten_giao_vien,
      l.si_so_toi_da,l.ngay_bat_dau,l.ngay_ket_thuc,l.trang_thai
    FROM dbo.lop_hoc l JOIN dbo.khoa_hoc k ON k.id=l.khoa_hoc_id JOIN dbo.nguoi_dung g ON g.id=l.giao_vien_id WHERE l.id=@id;
    SELECT u.id,u.ho_ten,u.email,u.so_dien_thoai,gd.diem_muc_tieu,gd.trang_thai,
      COUNT(DISTINCT dd.id) attendance_count,
      SUM(CASE WHEN dd.trang_thai IN (N'co mat',N'di tre') THEN 1 ELSE 0 END) attended_count
    FROM dbo.ghi_danh gd JOIN dbo.nguoi_dung u ON u.id=gd.hoc_vien_id
    LEFT JOIN dbo.lich_hoc lh ON lh.lop_hoc_id=gd.lop_hoc_id
    LEFT JOIN dbo.diem_danh dd ON dd.lich_hoc_id=lh.id AND dd.hoc_vien_id=u.id
    WHERE gd.lop_hoc_id=@id GROUP BY u.id,u.ho_ten,u.email,u.so_dien_thoai,gd.diem_muc_tieu,gd.trang_thai;
    SELECT id,ngay_hoc,gio_bat_dau,gio_ket_thuc,phong_hoc,duong_link_online FROM dbo.lich_hoc WHERE lop_hoc_id=@id ORDER BY ngay_hoc,gio_bat_dau;`);
  const c = result.recordsets[0][0];
  if (!c) throw fail(404, 'NOT_FOUND', 'Không tìm thấy lớp học.');
  const students = result.recordsets[1].map(s => ({
    id: s.id, name: s.ho_ten, email: s.email, phone: s.so_dien_thoai,
    targetScore: s.diem_muc_tieu, status: s.trang_thai === 'dang hoc' ? 'studying' : 'dropped',
    attendanceRate: s.attendance_count ? Math.round(s.attended_count / s.attendance_count * 100) : 0,
  }));
  const sessions = result.recordsets[2].map(s => ({ id: s.id, date: s.ngay_hoc, startsAt: s.gio_bat_dau, endsAt: s.gio_ket_thuc, room: s.phong_hoc, onlineLink: s.duong_link_online }));
  res.json({ data: {
    id: c.id, name: c.ten_lop, courseId: c.khoa_hoc_id, courseName: c.ten_khoa_hoc,
    teacherId: c.giao_vien_id, teacher: c.ten_giao_vien, maxStudents: c.si_so_toi_da,
    enrolled: students.filter(s => s.status === 'studying').length,
    startDate: c.ngay_bat_dau, endDate: c.ngay_ket_thuc,
    status: { 'sap dien ra':'upcoming','dang dien ra':'ongoing','da hoan thanh':'completed','da huy':'cancelled' }[c.trang_thai],
    students, sessions,
  } });
});

router.put('/classes/:id', async (req, res) => {
  const classId = id(req.params.id), { courseId, name, teacherId, capacity, startDate, endDate } = req.body;
  if (!uuid.test(courseId || '') || !uuid.test(teacherId || '') || !name?.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1 || !startDate || !endDate) {
    throw fail(400, 'VALIDATION_ERROR', 'Thông tin lớp học không hợp lệ.');
  }
  const pool = await getPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, classId)
    .input('course', sql.UniqueIdentifier, courseId).input('name', sql.NVarChar(100), name.trim())
    .input('teacher', sql.UniqueIdentifier, teacherId).input('capacity', sql.Int, Number(capacity))
    .input('start', sql.Date, parseDate(startDate)).input('end', sql.Date, parseDate(endDate))
    .query(`UPDATE dbo.lop_hoc SET khoa_hoc_id=@course,ten_lop=@name,giao_vien_id=@teacher,
      si_so_toi_da=@capacity,ngay_bat_dau=@start,ngay_ket_thuc=@end OUTPUT inserted.id WHERE id=@id`);
  if (!result.recordset[0]) throw fail(404, 'NOT_FOUND', 'Không tìm thấy lớp học.');
  res.json({ data: { id: classId, updated: true } });
});

router.delete('/classes/:id', async (req, res) => {
  const classId = id(req.params.id), pool = await getPool();
  const result = await pool.request().input('id', sql.UniqueIdentifier, classId)
    .query('DELETE dbo.lop_hoc WHERE id=@id; SELECT @@ROWCOUNT affected');
  if (!result.recordset[0]?.affected) throw fail(404, 'NOT_FOUND', 'Không tìm thấy lớp học.');
  res.status(204).end();
});

router.post('/classes/:id/students', async (req, res) => {
  const classId = id(req.params.id), email = String(req.body.email || '').trim().toLowerCase();
  const scoreText = String(req.body.targetScore || '').split('/')[0];
  const score = scoreText ? Number(scoreText) : null;
  if (!email || (score !== null && !Number.isFinite(score))) throw fail(400, 'VALIDATION_ERROR', 'Email hoặc điểm mục tiêu không hợp lệ.');
  const pool = await getPool(), tx = new sql.Transaction(pool); await tx.begin();
  try {
    const request = new sql.Request(tx).input('classId', sql.UniqueIdentifier, classId)
      .input('email', sql.NVarChar(150), email).input('score', sql.Decimal(5, 2), score);
    const result = await request.query(`DECLARE @student uniqueidentifier;
      SELECT @student=id FROM dbo.nguoi_dung WHERE email=@email AND vai_tro=N'hoc vien' AND trang_thai=N'dang hoat dong';
      IF @student IS NULL THROW 51001,'ACTIVE_STUDENT_NOT_FOUND',1;
      IF EXISTS(SELECT 1 FROM dbo.ghi_danh WHERE lop_hoc_id=@classId AND hoc_vien_id=@student)
        UPDATE dbo.ghi_danh SET trang_thai=N'dang hoc',diem_muc_tieu=@score WHERE lop_hoc_id=@classId AND hoc_vien_id=@student;
      ELSE INSERT dbo.ghi_danh(lop_hoc_id,hoc_vien_id,diem_muc_tieu) VALUES(@classId,@student,@score);
      SELECT u.id,u.ho_ten,u.email,u.so_dien_thoai,gd.diem_muc_tieu FROM dbo.ghi_danh gd JOIN dbo.nguoi_dung u ON u.id=gd.hoc_vien_id WHERE gd.lop_hoc_id=@classId AND gd.hoc_vien_id=@student;`);
    await tx.commit(); const s = result.recordset[0];
    res.status(201).json({ data: { id:s.id,name:s.ho_ten,email:s.email,phone:s.so_dien_thoai,targetScore:s.diem_muc_tieu,status:'studying',attendanceRate:0 } });
  } catch (error) {
    await tx.rollback();
    if (error.number === 51001) throw fail(404, 'STUDENT_NOT_FOUND', 'Không có học viên đang hoạt động với email này.');
    throw error;
  }
});

router.patch('/classes/:id/students/:studentId', async (req, res) => {
  const classId=id(req.params.id), studentId=id(req.params.studentId), status=req.body.status;
  if (!['studying','dropped'].includes(status)) throw fail(400,'VALIDATION_ERROR','Trạng thái ghi danh không hợp lệ.');
  const pool=await getPool(), result=await pool.request().input('classId',sql.UniqueIdentifier,classId)
    .input('studentId',sql.UniqueIdentifier,studentId).input('status',sql.NVarChar(20),status==='studying'?'dang hoc':'da nghi')
    .query('UPDATE dbo.ghi_danh SET trang_thai=@status WHERE lop_hoc_id=@classId AND hoc_vien_id=@studentId; SELECT @@ROWCOUNT affected');
  if(!result.recordset[0]?.affected) throw fail(404,'NOT_FOUND','Không tìm thấy học viên trong lớp.');
  res.json({data:{classId,studentId,status}});
});

router.get('/courses/:id/enrollments', async (req,res) => {
  const courseId=id(req.params.id), pool=await getPool();
  const result=await pool.request().input('course',sql.UniqueIdentifier,courseId).query(`
    SELECT dk.ma_dang_ky,dk.ngay_bat_dau,dk.ngay_het_han,dk.trang_thai,u.id student_id,u.ho_ten,u.email,
      (SELECT COUNT(*) FROM dbo.noi_dung_khoa_hoc n JOIN dbo.chuong_khoa_hoc c ON c.ma_chuong=n.ma_chuong WHERE c.ma_khoa_hoc=dk.ma_khoa_hoc) lesson_count,
      (SELECT COUNT(*) FROM dbo.tien_do_hoc p JOIN dbo.noi_dung_khoa_hoc n ON n.ma_noi_dung=p.ma_noi_dung JOIN dbo.chuong_khoa_hoc c ON c.ma_chuong=n.ma_chuong WHERE c.ma_khoa_hoc=dk.ma_khoa_hoc AND p.ma_dang_ky=dk.ma_dang_ky AND p.da_hoan_thanh=1) completed_count
    FROM dbo.dang_ky_khoa_hoc dk JOIN dbo.nguoi_dung u ON u.id=dk.ma_hoc_vien WHERE dk.ma_khoa_hoc=@course ORDER BY dk.ngay_bat_dau DESC`);
  res.json({data:result.recordset.map(x=>({id:x.ma_dang_ky,studentId:x.student_id,name:x.ho_ten,email:x.email,startDate:x.ngay_bat_dau,expireDate:x.ngay_het_han,progress:x.lesson_count?Math.round(x.completed_count/x.lesson_count*100):0,status:{'dang hoc':'active','hoan thanh':'completed','het han':'expired','da huy':'cancelled'}[x.trang_thai]}))});
});

router.patch('/courses/:courseId/enrollments/:enrollmentId', async(req,res)=>{
  const courseId=id(req.params.courseId), enrollmentId=id(req.params.enrollmentId), {status,expireDate}=req.body;
  const map={active:'dang hoc',completed:'hoan thanh',expired:'het han',cancelled:'da huy'};
  if(status&&!map[status])throw fail(400,'VALIDATION_ERROR','Trạng thái ghi danh không hợp lệ.');
  const expires=expireDate===undefined?undefined:parseDate(expireDate);
  const pool=await getPool(),request=pool.request().input('course',sql.UniqueIdentifier,courseId).input('enrollment',sql.UniqueIdentifier,enrollmentId)
    .input('status',sql.NVarChar(20),status?map[status]:null).input('expires',sql.DateTime2,expires??null);
  const result=await request.query(`UPDATE dbo.dang_ky_khoa_hoc SET trang_thai=COALESCE(@status,trang_thai),
    ngay_het_han=CASE WHEN @expires IS NULL THEN ngay_het_han ELSE @expires END
    OUTPUT inserted.ma_dang_ky WHERE ma_dang_ky=@enrollment AND ma_khoa_hoc=@course`);
  if(!result.recordset[0])throw fail(404,'NOT_FOUND','Không tìm thấy ghi danh của khóa học.');
  res.json({data:{id:enrollmentId,status:status||undefined,expireDate:expireDate||undefined}});
});

router.post('/payments/:id/manual-confirm',async(req,res)=>{
  const paymentId=id(req.params.id),pool=await getPool(),tx=new sql.Transaction(pool);await tx.begin();
  try {
    const result=await new sql.Request(tx).input('id',sql.UniqueIdentifier,paymentId)
      .input('admin',sql.UniqueIdentifier,req.user.id).query(`
        DECLARE @order uniqueidentifier;
        SELECT @order=t.ma_don_hang FROM dbo.thanh_toan t JOIN dbo.don_hang dh ON dh.ma_don_hang=t.ma_don_hang
          WHERE t.ma_thanh_toan=@id AND t.trang_thai=N'cho xu ly' AND dh.trang_thai=N'cho thanh toan';
        IF @order IS NULL THROW 51002,'PAYMENT_NOT_PENDING',1;
        UPDATE dbo.thanh_toan SET trang_thai=N'thanh cong',ma_admin_xac_nhan=@admin,thoi_gian_xac_nhan=SYSDATETIME() WHERE ma_thanh_toan=@id;
        UPDATE dbo.don_hang SET trang_thai=N'da thanh toan',ngay_cap_nhat=SYSDATETIME() WHERE ma_don_hang=@order AND trang_thai=N'cho thanh toan';
        
        MERGE dbo.dang_ky_khoa_hoc AS target
        USING (
          SELECT dh.ma_hoc_vien, ct.ma_khoa_hoc, dh.ma_don_hang,
                 CASE WHEN kh.so_ngay_truy_cap IS NOT NULL THEN DATEADD(DAY, kh.so_ngay_truy_cap, SYSDATETIME()) ELSE NULL END AS ngay_het_han
          FROM dbo.don_hang dh
          JOIN dbo.chi_tiet_don_hang ct ON ct.ma_don_hang = dh.ma_don_hang
          JOIN dbo.khoa_hoc kh ON kh.id = ct.ma_khoa_hoc
          WHERE dh.ma_don_hang = @order
        ) AS source
        ON (target.ma_hoc_vien = source.ma_hoc_vien AND target.ma_khoa_hoc = source.ma_khoa_hoc)
        WHEN MATCHED AND target.trang_thai <> N'dang hoc' THEN
          UPDATE SET target.trang_thai = N'dang hoc',
                     target.ma_don_hang = source.ma_don_hang,
                     target.ngay_bat_dau = SYSDATETIME(),
                     target.ngay_het_han = source.ngay_het_han
        WHEN NOT MATCHED THEN
          INSERT (ma_hoc_vien, ma_khoa_hoc, ma_don_hang, ngay_bat_dau, ngay_het_han, trang_thai)
          VALUES (source.ma_hoc_vien, source.ma_khoa_hoc, source.ma_don_hang, SYSDATETIME(), source.ngay_het_han, N'dang hoc');
        SELECT @order orderId;`);
    await tx.commit();res.json({data:{id:paymentId,orderId:result.recordset[0].orderId,status:'success'}});
  } catch(error) { await tx.rollback();if(error.number===51002)throw fail(409,'INVALID_STATE','Giao dịch không còn ở trạng thái chờ xác nhận.');throw error; }
});

router.get('/certificate-enrollments',async(_req,res)=>{
  const pool=await getPool(),result=await pool.request().query(`SELECT dk.ma_dang_ky,u.ho_ten,u.email,k.ten_khoa_hoc,k.loai_ky_thi
    FROM dbo.dang_ky_khoa_hoc dk JOIN dbo.nguoi_dung u ON u.id=dk.ma_hoc_vien JOIN dbo.khoa_hoc k ON k.id=dk.ma_khoa_hoc
    WHERE dk.trang_thai=N'hoan thanh' AND NOT EXISTS(SELECT 1 FROM dbo.chung_chi cc WHERE cc.ma_dang_ky=dk.ma_dang_ky)
    ORDER BY dk.ngay_bat_dau DESC`);
  res.json({data:result.recordset.map(x=>({id:x.ma_dang_ky,studentName:x.ho_ten,studentEmail:x.email,courseName:x.ten_khoa_hoc,courseCategory:x.loai_ky_thi}))});
});

// Reports use the file path column already present in dbo.bao_cao. CSV is the supported export format.
router.get('/reports',async(req,res)=>{
  const page=Math.max(1,Number.parseInt(req.query.page,10)||1),limit=Math.min(100,Math.max(1,Number.parseInt(req.query.limit,10)||20)),pool=await getPool();
  const result=await pool.request().input('offset',sql.Int,(page-1)*limit).input('limit',sql.Int,limit)
    .query(`SELECT b.id,b.loai_bao_cao,b.bo_loc,b.duong_dan_tep,b.ngay_tao,b.ngay_het_han,u.ho_ten,COUNT(*) OVER() total
      FROM dbo.bao_cao b JOIN dbo.nguoi_dung u ON u.id=b.nguoi_tao_id ORDER BY b.ngay_tao DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  res.json({data:result.recordset.map(x=>{const filters=JSON.parse(x.bo_loc||'{}');return{id:x.id,type:Object.keys(reportTypes).find(k=>reportTypes[k]===x.loai_bao_cao),typeLabel:{'nguoi dung':'Người dùng','khoa hoc':'Khóa học','doanh thu':'Doanh thu','diem danh':'Điểm danh'}[x.loai_bao_cao],name:`Báo cáo ${{'nguoi dung':'Người dùng','khoa hoc':'Khóa học','doanh thu':'Doanh thu'}[x.loai_bao_cao]||'Điểm danh'} ${filters.startDate||''} - ${filters.endDate||''}`.trim(),author:x.ho_ten,createdAt:x.ngay_tao,expiresAt:x.ngay_het_han,format:'CSV',status:x.duong_dan_tep?'ready':'failed'};}),pagination:{page,limit,total:result.recordset[0]?.total||0}});
});

router.post('/reports/generate',async(req,res)=>{
  const {type,format='CSV',startDate,endDate,courseId,classId}=req.body;
  if(!reportTypes[type])throw fail(400,'VALIDATION_ERROR','Loại báo cáo không hợp lệ.');
  if(format!=='CSV')throw fail(422,'UNSUPPORTED_FORMAT','Backend hiện xuất báo cáo dạng CSV.');
  if((courseId&&courseId!=='all'&&!uuid.test(courseId))||(classId&&classId!=='all'&&!uuid.test(classId)))throw fail(400,'VALIDATION_ERROR','Bộ lọc khóa/lớp không hợp lệ.');
  const from=parseDate(startDate),to=parseDate(endDate);if(!from||!to||from>to)throw fail(400,'VALIDATION_ERROR','Khoảng thời gian báo cáo không hợp lệ.');
  const pool=await getPool(),query=type==='users'?`SELECT u.id,u.ho_ten,u.email,u.vai_tro,u.trang_thai,u.ngay_tao FROM dbo.nguoi_dung u WHERE u.ngay_tao>=@from AND u.ngay_tao<DATEADD(MINUTE,1,@to) AND (@class IS NULL OR EXISTS(SELECT 1 FROM dbo.ghi_danh gd WHERE gd.hoc_vien_id=u.id AND gd.lop_hoc_id=@class)) ORDER BY u.ngay_tao`:
    type==='courses'?`SELECT k.id,k.ten_khoa_hoc,d.ten_danh_muc,k.trinh_do,k.loai_ky_thi,k.trang_thai,k.gia,k.ngay_tao,(SELECT COUNT(*) FROM dbo.dang_ky_khoa_hoc dk WHERE dk.ma_khoa_hoc=k.id) ghi_danh FROM dbo.khoa_hoc k JOIN dbo.danh_muc_khoa_hoc d ON d.id=k.danh_muc_id WHERE k.ngay_tao>=@from AND k.ngay_tao<DATEADD(MINUTE,1,@to) AND (@course IS NULL OR k.id=@course) AND (@class IS NULL OR EXISTS(SELECT 1 FROM dbo.lop_hoc l WHERE l.khoa_hoc_id=k.id AND l.id=@class)) ORDER BY k.ngay_tao`:
    `SELECT dh.ma_don_hang,dh.ngay_tao,nd.ho_ten,dh.tong_tien,dh.so_tien_giam,dh.so_tien_phai_tra,dh.trang_thai,g.ten_cong FROM dbo.don_hang dh JOIN dbo.nguoi_dung nd ON nd.id=dh.ma_hoc_vien OUTER APPLY(SELECT TOP 1 c.ten_cong FROM dbo.thanh_toan t JOIN dbo.cong_thanh_toan c ON c.ma_cong=t.ma_cong WHERE t.ma_don_hang=dh.ma_don_hang)g WHERE dh.ngay_tao>=@from AND dh.ngay_tao<DATEADD(MINUTE,1,@to) AND (@course IS NULL OR EXISTS(SELECT 1 FROM dbo.chi_tiet_don_hang ct WHERE ct.ma_don_hang=dh.ma_don_hang AND ct.ma_khoa_hoc=@course)) AND (@class IS NULL OR EXISTS(SELECT 1 FROM dbo.chi_tiet_don_hang ct JOIN dbo.lop_hoc l ON l.khoa_hoc_id=ct.ma_khoa_hoc WHERE ct.ma_don_hang=dh.ma_don_hang AND l.id=@class)) ORDER BY dh.ngay_tao`;
  const request=pool.request().input('from',sql.DateTime2,from).input('to',sql.DateTime2,to).input('course',sql.UniqueIdentifier,courseId&&courseId!=='all'?courseId:null).input('class',sql.UniqueIdentifier,classId&&classId!=='all'?classId:null);
  const queryResult=await request.query(query),rows=queryResult.recordset;
  const columns=rows.length?Object.keys(rows[0]):type==='users'?['id','ho_ten','email','vai_tro','trang_thai','ngay_tao']:type==='courses'?['id','ten_khoa_hoc','ten_danh_muc','trinh_do','loai_ky_thi','trang_thai','gia','ngay_tao','ghi_danh']:['ma_don_hang','ngay_tao','ho_ten','tong_tien','so_tien_giam','so_tien_phai_tra','trang_thai','ten_cong'];
  const content=makeCsv(columns,rows.map(row=>columns.map(column=>row[column] instanceof Date?row[column].toISOString():row[column])));
  await mkdir(root,{recursive:true});const filename=`${randomUUID()}.csv`,filepath=path.join(root,filename);await writeFile(filepath,content,'utf8');
  const filterJson=JSON.stringify({startDate,endDate,courseId:courseId||'all',classId:classId||'all',format});
  try {
    const saved=await pool.request().input('type',sql.NVarChar(20),reportTypes[type]).input('admin',sql.UniqueIdentifier,req.user.id)
      .input('filters',sql.NVarChar(sql.MAX),filterJson).input('file',sql.NVarChar(255),filepath)
      .query(`INSERT dbo.bao_cao(loai_bao_cao,nguoi_tao_id,bo_loc,duong_dan_tep) OUTPUT inserted.id,inserted.ngay_tao,inserted.ngay_het_han VALUES(@type,@admin,@filters,@file)`);
    res.status(201).json({data:{id:saved.recordset[0].id,type,name:`Báo cáo ${{users:'Người dùng',courses:'Khóa học',revenue:'Doanh thu'}[type]} ${startDate} - ${endDate}`,author:req.user.name,createdAt:saved.recordset[0].ngay_tao,expiresAt:saved.recordset[0].ngay_het_han,format:'CSV',status:'ready',rowCount:rows.length}});
  } catch(error) { await unlink(filepath).catch(()=>{}); throw error; }
});

router.get('/reports/:id/download',async(req,res)=>{
  const reportId=id(req.params.id),pool=await getPool(),result=await pool.request().input('id',sql.UniqueIdentifier,reportId).query(`SELECT duong_dan_tep,loai_bao_cao,ngay_het_han FROM dbo.bao_cao WHERE id=@id`),report=result.recordset[0];
  if(!report)throw fail(404,'NOT_FOUND','Không tìm thấy báo cáo.');if(report.ngay_het_han<new Date())throw fail(410,'EXPIRED','Báo cáo đã hết hạn.');
  const file=path.resolve(report.duong_dan_tep||'');if(!file.startsWith(`${root}${path.sep}`))throw fail(404,'FILE_NOT_FOUND','Không tìm thấy tệp báo cáo.');
  try{const content=await readFile(file);res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="report-${reportId}.csv"`);res.send(content);}catch{throw fail(404,'FILE_NOT_FOUND','Tệp báo cáo không còn tồn tại.');}
});
router.delete('/reports/:id',async(req,res)=>{
  const reportId=id(req.params.id),pool=await getPool(),result=await pool.request().input('id',sql.UniqueIdentifier,reportId).input('admin',sql.UniqueIdentifier,req.user.id)
    .query('DELETE dbo.bao_cao OUTPUT deleted.duong_dan_tep WHERE id=@id AND nguoi_tao_id=@admin');
  if(!result.recordset[0])throw fail(404,'NOT_FOUND','Không tìm thấy báo cáo của quản trị viên này.');
  const file=path.resolve(result.recordset[0].duong_dan_tep||'');if(file.startsWith(`${root}${path.sep}`))await unlink(file).catch(()=>{});
  res.status(204).end();
});

export default router;
