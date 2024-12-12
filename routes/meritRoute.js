const express = require('express');
const router = express.Router();
const { 
    createMeritTemplate, 
    createDemeritTemplate, 
    awardPoints,
    getMeritTemplates,
    getDemeritTemplates,
    getStudentPoints,
    getMeritStats
} = require('../controllers/meritController');
const { 
    verifyToken, 
    verifyBranchAdmin, 
    verifyTeacher,
    verifyStudent,
    verifyParent
} = require('../middlewares/auth');
const BranchAdmin = require('../models/branchadmin');
const branchadmin = require('../models/branchadmin');

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
router.get('/merit-stats',verifyToken, async (req, res) => {
    try {
        const userId = req.user_id;
        console.log(userId);
        const user   = await branchadmin.findById(userId
        );
        if(!user)
            return res.status(403).json({ message: 'Not authorized' });


        const stats = await getMeritStats(user.branch_id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
