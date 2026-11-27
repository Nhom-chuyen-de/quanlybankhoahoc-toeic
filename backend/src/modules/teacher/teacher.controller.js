/**
 * @file teacher.controller.js
 * @description Controller điều phối toàn bộ các yêu cầu API phân hệ Giảng viên (Teacher).
 * Bao gồm đầy đủ Giai đoạn 1, 2, 3, 4, 5.
 */

import * as dashboardService from './dashboard/dashboard.service.js';
import * as profileService from './profile/profile.service.js';
import * as courseService from './courses/course.service.js';
import * as chapterService from './courses/chapter.service.js';
import * as contentService from './courses/content.service.js';
import * as classService from './classes/class.service.js';
import * as studentService from './classes/student.service.js';
import * as assignmentService from './classes/assignment.service.js';
import * as gradingService from './grading/grading.service.js';
import * as scheduleService from './schedule/schedule.service.js';
import * as attendanceService from './attendance/attendance.service.js';
import * as reportService from './reports/report.service.js';
import * as supportService from './support/support.service.js';
import { apiSuccess } from '../../utils/response.js';

/* ==========================================================================
   GIAI ĐOẠN 1: DASHBOARD & PROFILE
   ========================================================================== */
export async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboardStats(req.user.id);
    return apiSuccess(res, data, 'Lấy thông tin dashboard thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getUpcomingClasses(req, res, next) {
  try {
    const data = await dashboardService.getUpcomingClasses(req.user.id, req.query.limit);
    return apiSuccess(res, data, 'Lấy danh sách lịch dạy sắp tới thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getPendingGrading(req, res, next) {
  try {
    const data = await dashboardService.getPendingGradingSubmissions(req.user.id, req.query.limit);
    return apiSuccess(res, data, 'Lấy danh sách bài cần chấm thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const data = await profileService.getTeacherProfile(req.user.id);
    return apiSuccess(res, data, 'Lấy thông tin hồ sơ thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = await profileService.updateTeacherProfile(req.user.id, req.body);
    return apiSuccess(res, data, 'Cập nhật hồ sơ thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    await profileService.changeTeacherPassword(req.user.id, req.body);
    return apiSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

/* ==========================================================================
   GIAI ĐOẠN 2: COURSES, CHAPTERS & CONTENTS
   ========================================================================== */
export async function getCourses(req, res, next) {
  try {
    const data = await courseService.getCourses(req.user.id, req.query);
    return apiSuccess(res, data, 'Lấy danh sách khóa học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getCourseDetail(req, res, next) {
  try {
    const data = await courseService.getCourseDetail(req.user.id, req.params.courseId);
    return apiSuccess(res, data, 'Lấy chi tiết khóa học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getChapters(req, res, next) {
  try {
    const data = await chapterService.getChapters(req.user.id, req.params.courseId);
    return apiSuccess(res, data, 'Lấy danh sách chương học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getChapterDetail(req, res, next) {
  try {
    const data = await chapterService.getChapterDetail(
      req.user.id,
      req.params.courseId,
      req.params.chapterId
    );
    return apiSuccess(res, data, 'Lấy chi tiết chương học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createChapter(req, res, next) {
  try {
    const data = await chapterService.createChapter(
      req.user.id,
      req.params.courseId,
      req.body
    );
    return apiSuccess(res, data, 'Tạo chương học thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function updateChapter(req, res, next) {
  try {
    const data = await chapterService.updateChapter(
      req.user.id,
      req.params.courseId,
      req.params.chapterId,
      req.body
    );
    return apiSuccess(res, data, 'Cập nhật chương học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function deleteChapter(req, res, next) {
  try {
    const data = await chapterService.deleteChapter(
      req.user.id,
      req.params.courseId,
      req.params.chapterId
    );
    return apiSuccess(res, data, data?.message || 'Xóa chương học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getContents(req, res, next) {
  try {
    const data = await contentService.getContents(req.user.id, req.params.chapterId);
    return apiSuccess(res, data, 'Lấy danh sách bài học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getContentDetail(req, res, next) {
  try {
    const data = await contentService.getContentDetail(req.user.id, req.params.contentId);
    return apiSuccess(res, data, 'Lấy chi tiết bài học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createContent(req, res, next) {
  try {
    const data = await contentService.createContent(
      req.user.id,
      req.params.chapterId,
      req.body
    );
    return apiSuccess(res, data, 'Tạo bài học thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function updateContent(req, res, next) {
  try {
    const data = await contentService.updateContent(
      req.user.id,
      req.params.contentId,
      req.body
    );
    return apiSuccess(res, data, 'Cập nhật bài học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function deleteContent(req, res, next) {
  try {
    const data = await contentService.deleteContent(
      req.user.id,
      req.params.contentId
    );
    return apiSuccess(res, data, data?.message || 'Xóa bài học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

/* ==========================================================================
   GIAI ĐOẠN 3: CLASSES, STUDENTS & ASSIGNMENTS
   ========================================================================== */
export async function getClasses(req, res, next) {
  try {
    const data = await classService.getTeacherClasses(req.user.id, req.query);
    return apiSuccess(res, data, 'Lấy danh sách lớp học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getClassDetail(req, res, next) {
  try {
    const data = await classService.getTeacherClassDetail(req.user.id, req.params.classId);
    return apiSuccess(res, data, 'Lấy chi tiết lớp học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getClassStudents(req, res, next) {
  try {
    const data = await studentService.getClassStudents(req.user.id, req.params.classId, req.query);
    return apiSuccess(res, data, 'Lấy danh sách học viên trong lớp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getStudentDetailInClass(req, res, next) {
  try {
    const data = await studentService.getStudentDetailInClass(
      req.user.id,
      req.params.classId,
      req.params.studentId
    );
    return apiSuccess(res, data, 'Lấy thông tin học viên trong lớp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getAssignments(req, res, next) {
  try {
    const data = await assignmentService.getAssignments(req.user.id, req.params.classId, req.query);
    return apiSuccess(res, data, 'Lấy danh sách bài tập thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getAssignmentDetail(req, res, next) {
  try {
    const data = await assignmentService.getAssignmentDetail(req.user.id, req.params.assignmentId);
    return apiSuccess(res, data, 'Lấy chi tiết bài tập thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createAssignment(req, res, next) {
  try {
    const data = await assignmentService.createAssignment(
      req.user.id,
      req.params.classId,
      req.body
    );
    return apiSuccess(res, data, 'Tạo bài tập thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const data = await assignmentService.updateAssignment(
      req.user.id,
      req.params.assignmentId,
      req.body
    );
    return apiSuccess(res, data, 'Cập nhật bài tập thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    const data = await assignmentService.deleteAssignment(req.user.id, req.params.assignmentId);
    return apiSuccess(res, data, data?.message || 'Xóa bài tập thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getAssignmentSubmissions(req, res, next) {
  try {
    const data = await assignmentService.getAssignmentSubmissions(
      req.user.id,
      req.params.assignmentId,
      req.query
    );
    return apiSuccess(res, data, 'Lấy danh sách bài nộp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getSubmissionDetail(req, res, next) {
  try {
    const data = await assignmentService.getSubmissionDetail(req.user.id, req.params.submissionId);
    return apiSuccess(res, data, 'Lấy chi tiết bài nộp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

/* ==========================================================================
   GIAI ĐOẠN 4: GRADING, SCHEDULE & ATTENDANCE
   ========================================================================== */
export async function getPendingGradingList(req, res, next) {
  try {
    const data = await gradingService.getPendingGradingSubmissions(req.user.id, req.query);
    return apiSuccess(res, data, 'Lấy danh sách bài nộp cần chấm thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function gradeSubmission(req, res, next) {
  try {
    const data = await gradingService.gradeSubmission(
      req.user.id,
      req.params.submissionId,
      req.body
    );
    return apiSuccess(res, data, 'Chấm điểm bài nộp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getGradingStats(req, res, next) {
  try {
    const data = await gradingService.getGradingStats(req.user.id);
    return apiSuccess(res, data, 'Lấy thống kê chấm điểm thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getSchedules(req, res, next) {
  try {
    const data = await scheduleService.getTeacherSchedules(req.user.id, req.query);
    return apiSuccess(res, data, 'Lấy danh sách lịch dạy thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getScheduleDetail(req, res, next) {
  try {
    const data = await scheduleService.getScheduleDetail(req.user.id, req.params.scheduleId);
    return apiSuccess(res, data, 'Lấy chi tiết buổi học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createSchedule(req, res, next) {
  try {
    const data = await scheduleService.createSchedule(req.user.id, req.body);
    return apiSuccess(res, data, 'Tạo buổi học thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function updateSchedule(req, res, next) {
  try {
    const data = await scheduleService.updateSchedule(
      req.user.id,
      req.params.scheduleId,
      req.body
    );
    return apiSuccess(res, data, 'Cập nhật buổi học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function deleteSchedule(req, res, next) {
  try {
    const data = await scheduleService.deleteSchedule(req.user.id, req.params.scheduleId);
    return apiSuccess(res, data, data?.message || 'Xóa buổi học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getAttendanceList(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceList(req.user.id, req.params.scheduleId);
    return apiSuccess(res, data, 'Lấy danh sách điểm danh buổi học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function saveAttendance(req, res, next) {
  try {
    const data = await attendanceService.saveAttendance(
      req.user.id,
      req.params.scheduleId,
      req.body
    );
    return apiSuccess(res, data, 'Lưu dữ liệu điểm danh thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getAttendanceStatsByClass(req, res, next) {
  try {
    const data = await attendanceService.getAttendanceStatsByClass(
      req.user.id,
      req.params.classId
    );
    return apiSuccess(res, data, 'Lấy thống kê điểm danh lớp thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

/* ==========================================================================
   GIAI ĐOẠN 5: REPORTS & SUPPORT
   ========================================================================== */
export async function getOverviewReport(req, res, next) {
  try {
    const data = await reportService.getTeacherOverviewReport(req.user.id);
    return apiSuccess(res, data, 'Lấy báo cáo tổng quan thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getClassPerformanceReport(req, res, next) {
  try {
    const data = await reportService.getClassPerformanceReport(
      req.user.id,
      req.params.classId
    );
    return apiSuccess(res, data, 'Lấy báo cáo hiệu suất lớp học thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const data = await reportService.createReportRecord(req.user.id, req.body);
    return apiSuccess(res, data, 'Tạo bản ghi báo cáo thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getSupportTickets(req, res, next) {
  try {
    const data = await supportService.getSupportTickets(req.user.id, req.query);
    return apiSuccess(res, data, 'Lấy danh sách yêu cầu hỗ trợ thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function getSupportTicketDetail(req, res, next) {
  try {
    const data = await supportService.getSupportTicketDetail(req.user.id, req.params.ticketId);
    return apiSuccess(res, data, 'Lấy chi tiết yêu cầu hỗ trợ thành công');
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function createSupportTicket(req, res, next) {
  try {
    const data = await supportService.createSupportTicket(req.user.id, req.body);
    return apiSuccess(res, data, 'Gửi yêu cầu hỗ trợ thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}

export async function replySupportTicket(req, res, next) {
  try {
    const data = await supportService.replySupportTicket(
      req.user.id,
      req.params.ticketId,
      req.body
    );
    return apiSuccess(res, data, 'Gửi phản hồi yêu cầu hỗ trợ thành công', 201);
  } catch (err) {
    err.status = err.statusCode || err.status || 500;
    next(err);
  }
}
