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
            awardedByModel='Branchadmin'
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
const Student = require('../models/student');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const mongoose = require('mongoose');
async function calculateMonthlyTrend(branchId) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    branchId = branchId.toString();
    return await Promise.all(months.map(async (month, index) => {
        // Set date range for the entire month
        const startDate = new Date(currentYear, index, 1);
        const endDate = new Date(currentYear, index + 1, 0); // Last day of the month

        // Get all awarded points for this period
        const monthData = await AwardedPoints.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate({
            path: 'awardedBy',
            select: 'branch_id'
        });
        

        // Filter for specific branch
        const branchData = monthData.filter(d => 
            d.awardedBy && d.awardedBy.branch_id && 
            d.awardedBy.branch_id.toString() === branchId
        );

        
        // Calculate merits and violations
        const merits = branchData
            .filter(d => d.points > 0)
            .reduce((sum, d) => sum + d.points, 0);

        const violations = branchData
            .filter(d => d.points < 0)
            .reduce((sum, d) => sum + Math.abs(d.points), 0);

        return {
            month,
            merits,
            violations
        };
    }));
}

// Helper function for class statistics
async function calculateClassStats(classroom, meritPoints) {
    // Get all student IDs for the classroom
    const classStudentIds = classroom.students.map(s => s._id.toString());
   
    
    // Filter merit points for this class's students
    const classPoints = meritPoints.filter(p => 
        classStudentIds.includes(p.studentId._id.toString())
    );
    
    // Calculate metrics
    const totalMerits = classPoints
        .filter(p => p.points > 0)
        .reduce((sum, p) => sum + p.points, 0);
   
    const totalViolations = classPoints
        .filter(p => p.points < 0)
        .reduce((sum, p) => sum + Math.abs(p.points), 0);
    
    const totalPoints = classPoints.reduce((sum, p) => sum + p.points, 0);
    
    return {
        merits: totalMerits,
        violations: totalViolations,
        totalStudents: classroom.students.length,
        averagePoints: classroom.students.length > 0 ? 
            (totalPoints / classroom.students.length).toFixed(1) : '0'
    };
}

// Helper function for top students
async function getTopStudents(students, meritPoints) {
    const studentPoints = students.map(student => {
        const studentMerits = meritPoints.filter(p => 
            p.studentId._id.toString() === student._id.toString()
        );

        const totalPoints = studentMerits.reduce((sum, p) => sum + p.points, 0);
        const merits = studentMerits
            .filter(p => p.points > 0)
            .reduce((sum, p) => sum + p.points, 0);
        const violations = studentMerits
            .filter(p => p.points < 0)
            .reduce((sum, p) => sum + Math.abs(p.points), 0);

        return {
            id: student._id,
            name: student.name,
            class: student.class,
            points: totalPoints,
            merits,
            violations
        };
    });

    return studentPoints
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
}

// Helper function for recent activity
async function getRecentActivity(branchId) {
    return await AwardedPoints.find()
        .populate({
            path: 'awardedBy',
            select: 'name branch_id'
        })
        .populate({
            path: 'studentId',
            select: 'name class'
        })
        .sort({ date: -1 })
        .limit(5)
        .then(activities => activities
            .filter(activity => 
                activity.awardedBy && 
                activity.awardedBy.branch_id && 
                activity.awardedBy.branch_id.toString() === branchId
            )
            .map(activity => ({
                id: activity._id,
                date: activity.date.toISOString().split('T')[0],
                student: activity.studentId?.name || 'Unknown Student',
                class: activity.studentId?.class || 'Unknown Class',
                type: activity.points > 0 ? 'merit' : 'violation',
                points: Math.abs(activity.points),
                reason: activity.reason,
                teacher: activity.awardedByModel === 'Teacher' ? activity.awardedBy.name : null,
                admin: activity.awardedByModel === 'Branchadmin' ? activity.awardedBy.name : null
            })));
}

// Helper function for teacher statistics
async function calculateTeacherStats(teacherId) {
    const teacherPoints = await AwardedPoints.find({
        awardedBy: teacherId,
        awardedByModel: 'Teacher'
    });

    const meritsAwarded = teacherPoints.filter(p => p.points > 0).length;
    const violations = teacherPoints.filter(p => p.points < 0).length;

    return {
        meritsAwarded,
        violations
    };
}


async function calculateOverallStats(branchId, meritPoints) {
    const activeStudents = await Student.countDocuments({ 
        branch_id: branchId 
    });

    const uniqueTeachers = new Set(
        meritPoints
            .filter(p => p.awardedByModel === 'Teacher')
            .map(p => p.awardedBy?._id.toString())
    );

    return {
        totalMerits: meritPoints.filter(p => p.points > 0)
            .reduce((sum, p) => sum + p.points, 0),
        totalViolations: meritPoints.filter(p => p.points < 0)
            .reduce((sum, p) => sum + Math.abs(p.points), 0),
        activeStudents,
        teacherParticipation: uniqueTeachers.size
    };
}

async function calculateViolationTypes(meritPoints) {
    const violationTypesMap = meritPoints
        .filter(p => p.points < 0)
        .reduce((acc, point) => {
            if (!acc[point.reason]) {
                acc[point.reason] = {
                    type: point.reason,
                    count: 0,
                    totalPoints: 0
                };
            }
            acc[point.reason].count += 1;
            acc[point.reason].totalPoints += Math.abs(point.points);
            return acc;
        }, {});

    return Object.values(violationTypesMap);
}

// Main controller function
const getMeritStats = async (branchId) => {
    try {
        // Get all necessary base data
        const [classrooms, students, allMeritPoints] = await Promise.all([
            Classroom.find({ branch_id: branchId }).populate('students'),
            Student.find({ branch_id: branchId }).populate('class'),
            AwardedPoints.find()
                .populate('studentId')
                .populate({
                    path: 'awardedBy',
                    select: 'name branch_id'
                })
        ]);
        console.log(allMeritPoints);
        console.log(students);
        console.log(classrooms);

        // Filter merit points for this branch
        const branchMeritPoints = allMeritPoints.filter(point => 
            point.awardedBy && 
            point.awardedBy.branch_id && 
            point.awardedBy.branch_id.toString() === branchId.toString()
        );

        // Get all statistics using helper functions
        const [
            overallStats,
            trendData,
            recentRecords,
            violationTypes
        ] = await Promise.all([
            calculateOverallStats(branchId, branchMeritPoints),
            calculateMonthlyTrend(branchId),
            getRecentActivity(branchId),
            calculateViolationTypes(branchMeritPoints)
        ]);

        // Get class-wise statistics
        const classWiseStats = await Promise.all(
            classrooms.map(async classroom => {
                const stats = await calculateClassStats(classroom, branchMeritPoints);
                return {
                    class: classroom.name,
                    ...stats
                };
            })
        );

        // Get top students
        const topStudents = await getTopStudents(students, branchMeritPoints);

        // Get teacher statistics
        const teachers = await Teacher.find({ branch_id: branchId });
        const teacherStats = await Promise.all(
            teachers.map(async teacher => {
                const stats = await calculateTeacherStats(teacher._id);
                return {
                    name: teacher.name,
                    class: teacher.classes[0]?.subject_name || 'N/A',
                    ...stats
                };
            })
        );

        return {
            overallStats,
            classWiseStats,
            trendData,
            topStudents,
            recentRecords,
            teacherStats,
            violationTypes
        };
    } catch (error) {
        console.error('Error in getMeritStats:', error);
        throw error;
    }
};



module.exports = {
    createMeritTemplate,
    createDemeritTemplate,
    awardPoints,
    getMeritTemplates,
    getDemeritTemplates,
    getStudentPoints,
    getMeritStats
};