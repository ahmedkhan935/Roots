const express = require('express');
const router = express.Router();
const Branch = require('../models/branch');
const { verifyToken, verifyAdmin, verifyBranchAdmin } = require('../middlewares/auth');
const branchController = require('../controllers/branchController');

// Existing routes
router.post('/', verifyToken, verifyAdmin, branchController.createBranch);
router.get('/', verifyToken, verifyAdmin, branchController.readBranches);
router.get('/:id', verifyToken, verifyAdmin, branchController.readBranchbyId);
router.put('/:id', verifyToken, verifyAdmin, branchController.updateBranch);
router.delete('/:id', verifyToken, verifyAdmin, branchController.deleteBranch);

// Class management routes
router.post('/class/create', verifyToken, verifyBranchAdmin, branchController.AddClass);
router.post('/class/add-students', verifyToken, verifyBranchAdmin, branchController.addStudentsToClass);
router.put('/class/change-student', verifyToken, verifyBranchAdmin, branchController.changeStudentClass);
router.post('/class/add-subject', verifyToken, verifyBranchAdmin, branchController.addSubjectToClass);

// Subject and teacher management routes
router.post('/class/assign-teacher', verifyToken, verifyBranchAdmin, branchController.assignTeacher);
router.put('/class/change-teacher', verifyToken, verifyBranchAdmin, branchController.changeSubjectTeacher);

// Get information routes
router.get('/student/class/:student_id', verifyToken, branchController.getStudentClassWithSubjects);
router.get('/teacher/subjects/:teacher_id', verifyToken, branchController.getTeacherSubjects);
router.get('/recent/:id', verifyToken, branchController.getAwardedMeritsByBranch);
module.exports = router;