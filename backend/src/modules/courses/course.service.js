import { mockDatabase } from '../../config/db.js';

export const courseService = {
  // Lấy danh sách khóa học mở bán cho học viên
  async getAllCourses({ danhMuc, trinhDo, search }) {
    let list = mockDatabase.courses.filter((c) => c.trangThai === 'published');

    if (danhMuc) {
      list = list.filter((c) => c.danhMuc.toLowerCase() === danhMuc.toLowerCase());
    }

    if (trinhDo) {
      list = list.filter((c) => c.trinhDo.toLowerCase().includes(trinhDo.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((c) => c.tieuDe.toLowerCase().includes(q) || c.moTa.toLowerCase().includes(q));
    }

    return list;
  },

  // Chi tiết khóa học và khung chương trình (Curriculum)
  async getCourseById(courseId) {
    const course = mockDatabase.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Không tìm thấy khóa học');

    const chapters = mockDatabase.chapters.filter((ch) => ch.khoaHocId === courseId);

    return {
      ...course,
      curriculum: chapters,
    };
  },
};
