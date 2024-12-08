const express = require('express');
const router = express.Router();
const { 
    createMeritTemplate, 
    createDemeritTemplate, 
    awardPoints,
    getMeritTemplates,
    getDemeritTemplates,
    getStudentPoints
} = require('../controllers/meritController');
const { 
    verifyToken, 
    verifyBranchAdmin, 
    verifyTeacher,
    verifyStudent,
    verifyParent
} = require('../middlewares/auth');

// Merit/Demerit Template routes - only branch admin can manage templates
router.post('/merit-template', verifyToken, verifyBranchAdmin, createMeritTemplate);
router.post('/demerit-template', verifyToken, verifyBranchAdmin, createDemeritTemplate);
router.get('/merit-templates', verifyToken, getMeritTemplates);
router.get('/demerit-templates', verifyToken, getDemeritTemplates);

// Points routes
router.post('/award-points', verifyToken, async (req, res, next) => {
    if (req.role === 'teacher' || req.role === 'branchadmin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized' });
    }
}, awardPoints);

// Student points can be viewed by teachers, branch admins, students (their own), and parents
router.get('/student-points/:studentId', verifyToken, async (req, res, next) => {
    if (['teacher', 'branchadmin', 'student', 'parent'].includes(req.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized' });
    }
}, getStudentPoints);

module.exports = router;
