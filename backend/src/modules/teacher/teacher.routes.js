/**
 * @file teacher.routes.js
 * @description Định tuyến API toàn diện cho phân hệ Giảng viên (Teacher).
 * Tất cả các endpoints đều yêu cầu JWT hợp lệ và vai trò 'giang vien'.
 */

import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { requireRole } from '../../middlewares/roleGuard.js';
import { ROLES } from '../../constants/roles.js';
import * as teacherController from './teacher.controller.js';

const router = Router();

// Toàn bộ route Teacher đều được bảo vệ bởi authMiddleware và requireRole([ROLES.TEACHER])
router.use(authMiddleware);
router.use(requireRole([ROLES.TEACHER]));

/* ==========================================================================
   1. GIAI ĐOẠN 1: DASHBOARD & PROFILE
   ========================================================================== */
router.get('/dashboard', teacherController.getDashboard);
router.get('/dashboard/upcoming-classes', teacherController.getUpcomingClasses);
router.get('/dashboard/pending-grading', teacherController.getPendingGrading);

router.get('/profile', teacherController.getProfile);
router.patch('/profile', teacherController.updateProfile);
router.post('/profile/change-password', teacherController.changePassword);

/* ==========================================================================
   2. GIAI ĐOẠN 2: COURSES, CHAPTERS & CONTENTS
   ========================================================================== */
router.get('/courses', teacherController.getCourses);
router.get('/courses/:courseId', teacherController.getCourseDetail);

router.get('/courses/:courseId/chapters', teacherController.getChapters);
router.get('/courses/:courseId/chapters/:chapterId', teacherController.getChapterDetail);
router.post('/courses/:courseId/chapters', teacherController.createChapter);
router.put('/courses/:courseId/chapters/:chapterId', teacherController.updateChapter);
router.delete('/courses/:courseId/chapters/:chapterId', teacherController.deleteChapter);

router.get('/chapters/:chapterId/contents', teacherController.getContents);
router.get('/contents/:contentId', teacherController.getContentDetail);
router.post('/chapters/:chapterId/contents', teacherController.createContent);
router.put('/contents/:contentId', teacherController.updateContent);
router.delete('/contents/:contentId', teacherController.deleteContent);

/* ==========================================================================
   3. GIAI ĐOẠN 3: CLASSES, STUDENTS & ASSIGNMENTS
   ========================================================================== */
// Lớp học
router.get('/classes', teacherController.getClasses);
router.get('/classes/:classId', teacherController.getClassDetail);

// Học viên trong lớp
router.get('/classes/:classId/students', teacherController.getClassStudents);
router.get('/classes/:classId/students/:studentId', teacherController.getStudentDetailInClass);

// Bài tập trong lớp & bài nộp
router.get('/classes/:classId/assignments', teacherController.getAssignments);
router.post('/classes/:classId/assignments', teacherController.createAssignment);
router.get('/assignments/:assignmentId', teacherController.getAssignmentDetail);
router.put('/assignments/:assignmentId', teacherController.updateAssignment);
router.delete('/assignments/:assignmentId', teacherController.deleteAssignment);
router.get('/assignments/:assignmentId/submissions', teacherController.getAssignmentSubmissions);
router.get('/submissions/:submissionId', teacherController.getSubmissionDetail);

/* ==========================================================================
   4. GIAI ĐOẠN 4: GRADING, SCHEDULE & ATTENDANCE
   ========================================================================== */
// Chấm điểm
router.get('/grading/pending', teacherController.getPendingGradingList);
router.post('/submissions/:submissionId/grade', teacherController.gradeSubmission);
router.get('/grading/stats', teacherController.getGradingStats);

// Lịch dạy
router.get('/schedules', teacherController.getSchedules);
router.post('/schedules', teacherController.createSchedule);
router.get('/schedules/:scheduleId', teacherController.getScheduleDetail);
router.put('/schedules/:scheduleId', teacherController.updateSchedule);
router.delete('/schedules/:scheduleId', teacherController.deleteSchedule);

// Điểm danh
router.get('/schedules/:scheduleId/attendance', teacherController.getAttendanceList);
router.post('/schedules/:scheduleId/attendance', teacherController.saveAttendance);
router.get('/classes/:classId/attendance-stats', teacherController.getAttendanceStatsByClass);

/* ==========================================================================
   5. GIAI ĐOẠN 5: REPORTS & SUPPORT
   ========================================================================== */
// Báo cáo & Thống kê
router.get('/reports/overview', teacherController.getOverviewReport);
router.get('/reports/classes/:classId', teacherController.getClassPerformanceReport);
router.post('/reports', teacherController.createReport);

// Hỗ trợ
router.get('/support/tickets', teacherController.getSupportTickets);
router.post('/support/tickets', teacherController.createSupportTicket);
router.get('/support/tickets/:ticketId', teacherController.getSupportTicketDetail);
router.post('/support/tickets/:ticketId/reply', teacherController.replySupportTicket);

export default router;
