const express = require('express');
const router = express.Router();
const Branch = require('../models/branch');
const { verifyToken, verifyAdmin, verifyBranchAdmin } = require('../middlewares/auth');
const branchController = require('../controllers/branchController');
router.post('/create', verifyToken, verifyAdmin,branchController.createBranch);
router.get('/read', verifyToken, verifyAdmin,branchController.readBranches);
router.get('/read/:id', verifyToken, verifyAdmin,branchController.readBranchbyId);
router.put('/update/:id', verifyToken, verifyAdmin,branchController.updateBranch);
router.delete('/delete/:id', verifyToken, verifyAdmin,branchController.deleteBranch);

// Class management routes
router.post('/class/create', verifyToken, verifyBranchAdmin, branchController.AddClass);
router.put('/class/update/:id', verifyToken, verifyBranchAdmin, branchController.updateClass);
router.delete('/class/delete/:id', verifyToken, verifyBranchAdmin, branchController.deleteClass);
router.get('/class/:id', verifyToken, branchController.getClass);
router.get('/class/details/:id', verifyToken, branchController.getClassbyId);

// Student-related routes
router.get('/student/classes/:id', verifyToken, branchController.getStudentClasses);
router.post('/class/students/add', verifyToken, verifyBranchAdmin, branchController.addStudentsToClass);
router.post('/class/students/remove', verifyToken, verifyBranchAdmin, branchController.removeStudentsFromClass);

// Teacher-related routes
router.get('/teacher/classes/:id', verifyToken, branchController.getTeacherClasses);
router.post('/class/teacher/assign', verifyToken, verifyBranchAdmin, branchController.assignTeacher);
router.post('/class/teacher/remove', verifyToken, verifyBranchAdmin, branchController.removeClassFromTeacher);

// Branch information routes
router.get('/:id/classes', verifyToken,verifyBranchAdmin, branchController.getBranchClasses);
router.get('/:id/teachers', verifyToken,verifyBranchAdmin, branchController.getBranchTeachers);
router.get('/:id/students', verifyToken,verifyBranchAdmin, branchController.getBranchStudents);

module.exports = router;
