const { MeritTemplate, DemeritTemplate, AwardedPoints } = require('../models/merit'); 
const student = require('../models/student');
// Award points to a student
const awardPoints = async (req, res) => {
    try {
        const { studentId, points, reason } = req.body;
        if (!studentId || !points || !reason ) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const existingStudent = await student.findById(studentId);
        if (!existingStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }


        awardedBy = req.user_id;
        var awardedByModel
    
        if(req.role==='teacher'){
            awardedByModel='Teacher'
        }
        if(req.role==='branchadmin'){
            awardedByModel='BranchAdmin'
        }
        const awardedPoints = new AwardedPoints({ studentId, points, reason, awardedBy,awardedByModel

         });
         existingStudent.curr_merit_points+=points;
        await existingStudent.save();
        
        await awardedPoints.save();
        res.status(201).json(awardedPoints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a merit template
const createMeritTemplate = async (req, res) => {
    try {
        const { points, reason } = req.body;
        if (!points || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const meritTemplate = new MeritTemplate({ points, reason });
        await meritTemplate.save();
        res.status(201).json(meritTemplate);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a demerit template
const createDemeritTemplate = async (req, res) => {
    try {
        const { points, reason } = req.body;
        if (!points || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const demeritTemplate = new DemeritTemplate({ points, reason });
        await demeritTemplate.save();
        res.status(201).json(demeritTemplate);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMeritTemplates = async (req, res) => {
    try {
        const meritTemplates = await MeritTemplate.find();
        res.json(meritTemplates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const getDemeritTemplates = async (req, res) => {
    try {
        const demeritTemplates = await DemeritTemplate.find();
        res.json(demeritTemplates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getStudentPoints = async (req, res) => {
    try {
        const existingStudent = await student.findById(req.params.studentId);
        if (!existingStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const { period, type } = req.query;
        let filter = { studentId: req.params.studentId };

        // Filter by type (merit or demerit)
        if (type === 'merit') {
            
            filter.points = { $gt: 0 };
        } else if (type === 'demerit') {
            filter.points = { $lt: 0 };
        }

        // Filter by time period (weekly or monthly)
        const now = new Date();
        if (period === 'weekly') {
            const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
            filter.date = { $gte: oneWeekAgo };
        } else if (period === 'monthly') {
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filter.date = { $gte: oneMonthAgo };
        }

        const studentPoints = await AwardedPoints.find(filter);
        res.json({studentPoints,curr_merit_points:existingStudent.curr_merit_points});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = {
    createMeritTemplate,
    createDemeritTemplate,
    awardPoints,
    getMeritTemplates,
    getDemeritTemplates,
    getStudentPoints
};