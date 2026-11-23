import { useState } from 'react';
import { ArrowLeft, CheckCircle, LifeBuoy, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentSupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('Hỗ trợ tài khoản & khóa học');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setSubject('');
    setMessage('');
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          type="button"
          onClick={() => navigate('/hoc-vien')}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại không gian học viên
        </button>

        <section className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/15 p-3">
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black sm:text-2xl">Trung tâm hỗ trợ</h1>
              <p className="mt-1 text-sm text-indigo-100">
                Xin chào {user?.hoTen || 'bạn'}, gửi yêu cầu để đội ngũ TOEIC Master hỗ trợ.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <h2 className="text-base font-bold">Gửi yêu cầu hỗ trợ</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Vui lòng mô tả vấn đề cụ thể. Bộ phận hỗ trợ sẽ phản hồi trong giờ làm việc.
          </p>

          {submitted && (
            <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Yêu cầu của bạn đã được ghi nhận.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="support-type" className="mb-1.5 block text-sm font-semibold">Loại yêu cầu</label>
              <select
                id="support-type"
                value={requestType}
                onChange={(event) => setRequestType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option>Hỗ trợ tài khoản & khóa học</option>
                <option>Hỗ trợ thanh toán</option>
                <option>Hỗ trợ bài học & phòng thi</option>
                <option>Góp ý hoặc yêu cầu khác</option>
              </select>
            </div>

            <div>
              <label htmlFor="support-subject" className="mb-1.5 block text-sm font-semibold">Tiêu đề</label>
              <input
                id="support-subject"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Tóm tắt vấn đề bạn cần hỗ trợ"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="support-message" className="mb-1.5 block text-sm font-semibold">Nội dung</label>
              <textarea
                id="support-message"
                required
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Mô tả chi tiết vấn đề..."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-indigo-700">
              <Send className="h-4 w-4" />
              Gửi yêu cầu
            </button>
          </form>
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Liên hệ trực tiếp: <a className="font-semibold text-indigo-600 hover:underline" href="mailto:cskh@toeicmaster.vn">cskh@toeicmaster.vn</a>
          </p>
        </section>
      </div>
    </main>
  );
}
