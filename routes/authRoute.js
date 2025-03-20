const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken,verifyAdmin, verifyBranchAdmin } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// ...existing code...
router.get("/student2",verifyToken,authController.getAllStudents);
router.get("/student3",verifyToken,authController.getAdminAllStudents);
router.get("/student-dash",verifyToken,authController.getMeritReport);
router.post("/student/forgot-password",authController.forgotStudentPassword);
router.get("/student-dash2",verifyToken,authController.getFilteredPointsHistory);
router.put("/update-student-pass",verifyToken,authController.updateStudentPassword);
router.get("/get-admin-branch",verifyToken,authController.getAdminBranch);
router.post('/register/superadmin', authController.createSuperadmin);
router.post('/register/branchadmin',verifyToken,verifyAdmin, authController.createBranchadmin);
router.post('/register/teacher',verifyToken,verifyBranchAdmin, authController.createTeacher);
router.post('/register/student',verifyToken,verifyBranchAdmin, authController.createStudent);
router.post('/register/parent',verifyToken,verifyBranchAdmin, authController.createParent);
router.post('/login/superadmin', authController.loginSuperadmin);
router.post('/login/branchadmin', authController.loginBranchadmin);
router.post('/login/teacher', authController.loginTeacher);
router.post('/login/student', authController.loginStudent);
router.post('/login/parent', authController.loginParent);
router.get('/:role/check-auth', async (req, res) => {
    try{
    const token = req.header('auth');
    console.log(token);
    if (!token || token==null) return res.status(401).json({ authorization: false, message: 'Access Denied' });
    const role = req.params.role;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded); 
    if (decoded.role !== role) return res.status(401).json({ authorization: false, message: 'Access Denied' });
    res.json({ authorization: true, message: 'Access Granted' });
    }
    catch(err){
        res.status(500).json({ message: err.message,authorization: false });
    }


});

router.put('/:role/:id',verifyToken,authController.selectMiddleware, authController.updateUser);
router.delete('/:role/:id',verifyToken,authController.selectMiddleware, authController.deleteUser);
router.get('/:role',verifyToken,authController.selectMiddleware, authController.getAllUsers);
router.get('/:role/:id',verifyToken,authController.selectMiddleware, authController.getUserById);

module.exports = router;
