// src/pages/auth/components/AuthBrandPanel.jsx
import {
  GraduationCap,
  BadgeCheck,
  BookOpen,
  Laptop,
  Award,
  Star,
  Users,
} from 'lucide-react';

export default function AuthBrandPanel() {
  const features = [
    {
      icon: BookOpen,
      title: 'Kho khóa học đa dạng từ 450 đến 850+',
      desc: 'Lộ trình bài bản, bài giảng video sắc nét bám sát format đề thi mới nhất.',
    },
    {
      icon: Laptop,
      title: 'Học trực tuyến linh hoạt 24/7 trọn đời',
      desc: 'Tự chủ thời gian học mọi lúc mọi nơi trên cả máy tính và điện thoại.',
    },
    {
      icon: Award,
      title: 'Giảng viên xuất sắc 950+ TOEIC',
      desc: 'Đội ngũ giáo viên tận tâm, đồng hành giải đáp thắc mắc trong suốt khóa học.',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-900 p-8 sm:p-12 lg:p-14 text-white flex flex-col justify-between min-h-[220px] lg:min-h-full">
      {/* Họa tiết nền: Lưới chấm mờ 10% */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Quầng sáng mờ góc trên-trái và dưới-phải */}
      <div className="absolute -top-28 -left-28 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-28 w-96 h-96 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />

      {/* Phần trên: Logo, Tên thương hiệu & Huy hiệu */}
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 lg:mb-12">
          {/* Logo + Tên (đã xóa chữ 'Nền tảng luyện thi') */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight leading-tight">TOEIC Master</h2>
            </div>
          </div>

          {/* Huy hiệu khóa học chuẩn quốc tế */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white">
            <BadgeCheck className="w-4 h-4 text-amber-300 shrink-0" />
            <span>Khóa học TOEIC chuẩn quốc tế</span>
          </div>
        </div>

        {/* Tiêu đề & mô tả tập trung vào Khóa học */}
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug lg:leading-tight mb-4">
            Học TOEIC online chất lượng cao, bứt phá mục tiêu điểm số cùng các khóa học hàng đầu
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-8 lg:mb-10">
            Sở hữu trọn đời các khóa học TOEIC từ mất gốc đến 850+. Bài giảng video chi tiết, tài liệu độc quyền và hỗ trợ giải đáp chuyên sâu 24/7.
          </p>
        </div>

        {/* 3 Thẻ tính năng về khóa học */}
        <div className="hidden sm:grid sm:grid-cols-1 gap-3.5 max-w-xl">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 text-white">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{item.title}</h3>
                <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phần dưới: Lời chứng thực học viên mua khóa học */}
      <div className="relative z-10 hidden lg:block mt-8 pt-6 border-t border-white/15">
        <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
          {/* 5 sao đánh giá */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-amber-300 text-amber-300" />
              ))}
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>50.000+ học viên tin tưởng</span>
            </div>
          </div>

          {/* Câu trích */}
          <p className="text-xs sm:text-sm text-indigo-50 italic leading-relaxed mb-3">
            "Khóa học TOEIC 750+ rất chi tiết và dễ hiểu, video bài giảng bài bản giúp mình đạt 865 TOEIC ngay lần thi đầu tiên."
          </p>

          {/* Người đánh giá */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-300 text-indigo-950 font-black text-xs flex items-center justify-center ring-2 ring-white/30 shrink-0">
              MQ
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                Nguyễn Minh Quân
              </p>
              <p className="text-[11px] text-indigo-200 leading-tight mt-0.5">
                Học viên khóa Chinh Phục TOEIC 800+ • Đạt 865/990
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
