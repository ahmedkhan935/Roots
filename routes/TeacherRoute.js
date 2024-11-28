const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/TeacherController');
const { verifyToken, verifyTeacher } = require('../middlewares/auth');

// Apply authentication and teacher role middleware to all routes
router.use(verifyToken, verifyTeacher);

// Announcement routes
router.post('/classroom/:classroomId/announcements', teacherController.addAnnouncement);
router.get('/classroom/:classroomId/announcements', teacherController.getAnnouncements);
router.put('/classroom/:classroomId/announcements/:announcementId', teacherController.updateAnnouncement);
router.delete('/classroom/:classroomId/announcements/:announcementId', teacherController.deleteAnnouncement);
router.get('/classroom/:classroomId/announcements/:announcementId', teacherController.getAnnouncementById);

// Homework submissions route
router.get('/classroom/:classroomId/announcements/:announcementId/submissions', teacherController.getHomeworkSubmissions);

// Evaluation routes
router.post('/classroom/:classroomId/evaluations', teacherController.addEvaluation);
router.get('/classroom/:classroomId/evaluations', teacherController.getEvaluations);
router.put('/classroom/:classroomId/evaluations/:evaluationId', teacherController.updateEvaluation);
router.delete('/classroom/:classroomId/evaluations/:evaluationId', teacherController.deleteEvaluation);
router.get('/classroom/:classroomId/evaluations/:evaluationId', teacherController.getEvaluationById);

// Student-specific evaluation route
router.get('/classroom/:classroomId/student/:studentId/evaluations', teacherController.getStudentEvaluations);

// Active homework route
router.get('/classroom/:classroomId/homework/active', teacherController.getActiveHomework);

// Student-specific active homework route
router.get('/classroom/:classroomId/student/:studentId/homework/active', teacherController.getStudentActiveHomework);

// Get all active homework for a student across all classes
router.get('/student/:studentId/homework/active', teacherController.getAllClassesStudentActiveHomework);

module.exports = router;
