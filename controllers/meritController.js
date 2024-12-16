const {
  MeritTemplate,
  DemeritTemplate,
  AwardedPoints,
} = require("../models/merit");
const { sendPointsEmail } = require("../utils/email");
const student = require("../models/student");
// Award points to a student
const awardPoints = async (req, res) => {
  try {
    const { studentId, points, reason, comments } = req.body;
    
    if (!studentId || !points || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingStudent = await student.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }


    const awardedBy = req.user_id;
    const awardedByModel = req.role === "teacher" ? "Teacher" : "Branchadmin";

    // Get awarder details
    const awarder = await (awardedByModel === "Teacher" 
      ? Teacher.findById(awardedBy) 
      : Branchadmin.findById(awardedBy));

    const classOfStudent = await Classroom.findById(existingStudent.class);
    console.log(classOfStudent);
    if (!classOfStudent) {
      return res.status(404).json({ message: "Class not found" });
    }

    //class is a combination of grade-section e.g. 1-A, 2-B
    //get grade and section from class
    const classArray = classOfStudent.name.split("-");
    const grade = classArray[0];
    const section = classArray[1];

    console.log(grade, section);


    const awardedPoints = new AwardedPoints({
      studentId,
      points,
      reason,
      awardedBy,
      awardedByModel,
      comments,
      className: classOfStudent.name,
    });
    
    existingStudent.curr_merit_points += points;
    await existingStudent.save();
    await awardedPoints.save();
    
    // Send email notification
    await sendPointsEmail(
      existingStudent.email,
      `${existingStudent.name}`,
      points,
      reason,
      `${awarder.name}`,
      awardedByModel,
      comments,
      grade
    );

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
      return res.status(400).json({ message: "All fields are required" });
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
      return res.status(400).json({ message: "All fields are required" });
    }
    const demeritTemplate = new DemeritTemplate({ points, reason });
    await demeritTemplate.save();
    res.status(201).json(demeritTemplate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//delete merit template
const deleteMeritTemplate = async (req, res) => {
  try {
    const meritTemplate = await MeritTemplate.findByIdAndDelete(req.params.id);
    if (!meritTemplate) {
      return res.status(404).json({ message: "Merit template not found" });
    }
    res.json({ message: "Merit template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//delete demerit template
const deleteDemeritTemplate = async (req, res) => {
  try {
    const demeritTemplate = await DemeritTemplate.findByIdAndDelete(
      req.params.id
    );
    if (!demeritTemplate) {
      return res.status(404).json({ message: "Demerit template not found" });
    }
    res.json({ message: "Demerit template deleted" });
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
      return res.status(404).json({ message: "Student not found" });
    }

    const { period, type } = req.query;
    let filter = { studentId: req.params.studentId };

    // Filter by type (merit or demerit)
    if (type === "merit") {
      filter.points = { $gt: 0 };
    } else if (type === "demerit") {
      filter.points = { $lt: 0 };
    }

    // Filter by time period (weekly or monthly)
    const now = new Date();
    if (period === "weekly") {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      filter.date = { $gte: oneWeekAgo };
    } else if (period === "monthly") {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filter.date = { $gte: oneMonthAgo };
    }

    const studentPoints = await AwardedPoints.find(filter);
    res.json({
      studentPoints,
      curr_merit_points: existingStudent.curr_merit_points,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Student = require("../models/student");
const Classroom = require("../models/classroom");
const Teacher = require("../models/teacher");
const mongoose = require("mongoose");
async function calculateMonthlyTrend(branchId) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  branchId = branchId.toString();
  return await Promise.all(
    months.map(async (month, index) => {
      // Set date range for the entire month
      const startDate = new Date(currentYear, index, 1);
      const endDate = new Date(currentYear, index + 1, 0); // Last day of the month

      // Get all awarded points for this period
      const monthData = await AwardedPoints.find({
        date: { $gte: startDate, $lte: endDate },
        current:true
      }).populate({
        path: "awardedBy",
        select: "branch_id",
      });

      // Filter for specific branch
      const branchData = monthData.filter(
        (d) =>
          d.awardedBy &&
          d.awardedBy.branch_id &&
          d.awardedBy.branch_id.toString() === branchId
      );

      // Calculate merits and violations
      const merits = branchData
        .filter((d) => d.points > 0)
        .reduce((sum, d) => sum + d.points, 0);

      const violations = branchData
        .filter((d) => d.points < 0)
        .reduce((sum, d) => sum + Math.abs(d.points), 0);

      return {
        month,
        merits,
        violations,
      };
    })
  );
}

// Helper function for class statistics
async function calculateClassStats(classroom, meritPoints) {
  // Get all student IDs for the classroom
  const classStudentIds = classroom.students.map((s) => s._id.toString());

  // Filter merit points for this class's students
  const classPoints = meritPoints.filter((p) =>
    classStudentIds.includes(p.studentId._id.toString())
  );

  // Calculate metrics
  const totalMerits = classPoints
    .filter((p) => p.points > 0)
    .reduce((sum, p) => sum + p.points, 0);

  const totalViolations = classPoints
    .filter((p) => p.points < 0)
    .reduce((sum, p) => sum + Math.abs(p.points), 0);

  const totalPoints = classPoints.reduce((sum, p) => sum + p.points, 0);

  return {
    merits: totalMerits,
    violations: totalViolations,
    totalStudents: classroom.students.length,
    averagePoints:
      classroom.students.length > 0
        ? (totalPoints / classroom.students.length).toFixed(1)
        : "0",
  };
}

// Helper function for top students
async function getTopStudents(students, meritPoints) {
  const studentPoints = students.map((student) => {
    const studentMerits = meritPoints.filter(
      (p) => p.studentId._id.toString() === student._id.toString()
    );

    const totalPoints = studentMerits.reduce((sum, p) => sum + p.points, 0);
    const merits = studentMerits
      .filter((p) => p.points > 0)
      .reduce((sum, p) => sum + p.points, 0);
    const violations = studentMerits
      .filter((p) => p.points < 0)
      .reduce((sum, p) => sum + Math.abs(p.points), 0);

    return {
      id: student._id,
      name: student.name,
      class: student.class,
      points: totalPoints,
      merits,
      violations,
    };
  });

  return studentPoints.sort((a, b) => b.points - a.points).slice(0, 5);
}

// Helper function for recent activity
// async function getRecentActivity(branchId) {
//   return await AwardedPoints.find({current:true})
//     .populate({
//       path: "awardedBy",
//       select: "name branch_id",
//     })
//     .populate({
//       path: "studentId",
//       select: "name class",
//       populate: {
//         path: "class",
//         select: "name",
//       }
//     })
//     .sort({ date: -1 })
//     .limit(5)
//     .then((activities) =>
//       activities
//         .filter(
//           (activity) =>
//             activity.awardedBy &&
//             activity.awardedBy.branch_id &&
//             activity.awardedBy.branch_id.toString() === branchId
//         )
//         .map((activity) => ({
//           id: activity._id,
//           date: activity.date.toISOString().split("T")[0],
//           student: activity.studentId?.name || "Unknown Student",
//           class: activity.studentId?.class.name || "Unknown Class",
//           type: activity.points > 0 ? "merit" : "violation",
//           points: Math.abs(activity.points),
//           reason: activity.reason,
//           teacher:
//             activity.awardedByModel === "Teacher"
//               ? activity.awardedBy.name
//               : null,
//           admin:
//             activity.awardedByModel === "Branchadmin"
//               ? activity.awardedBy.name
//               : null,
//         }))
//     );
// }
async function getRecentActivity(branchId) {
  try {
    const activities = await AwardedPoints.find({ current: true })
      .populate({
        path: "awardedBy",
        select: "name branch_id",
      })
      .populate({
        path: "studentId",
        select: "name class",
        populate: {
          path: "class",
          select: "name",
        },
      })
      .sort({ date: -1 })
      .limit(5)
      .lean()
      .exec();
      console.log(activities);

    const filteredActivities = filterActivitiesByBranch(activities, branchId);
    console.log(filteredActivities);
    const formattedActivities = formatActivities(filteredActivities);
    console.log(formattedActivities);

    return formattedActivities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
}

function filterActivitiesByBranch(activities, branchId) {
  return activities.filter(
    (activity) =>
      activity.awardedBy &&
      activity.awardedBy.branch_id &&
      activity.awardedBy.branch_id.toString() === branchId.toString()
  );
}

function formatActivities(activities) {
  return activities.map((activity) => ({
    id: activity._id,
    date: activity.date.toISOString().split("T")[0],
    student: activity.studentId?.name || "Unknown Student",
    class: activity.studentId?.class?.name || "Unknown Class",
    type: activity.points > 0 ? "merit" : "violation",
    points: Math.abs(activity.points),
    reason: activity.reason,
    teacher: activity.awardedByModel === "Teacher" ? activity.awardedBy.name : null,
    admin: activity.awardedByModel === "Branchadmin" ? activity.awardedBy.name : null,
  }));
}

// Helper function for teacher statistics
async function calculateTeacherStats(teacherId) {
  const teacherPoints = await AwardedPoints.find({
    awardedBy: teacherId,
    awardedByModel: "Teacher",
    current:true
  });

  const meritsAwarded = teacherPoints.filter((p) => p.points > 0).length;
  const violations = teacherPoints.filter((p) => p.points < 0).length;

  return {
    meritsAwarded,
    violations,
  };
}

async function calculateOverallStats(branchId, meritPoints) {
  const activeStudents = await Student.countDocuments({
    branch_id: branchId,
  });

  const uniqueTeachers = new Set(
    meritPoints
      .filter((p) => p.awardedByModel === "Teacher")
      .map((p) => p.awardedBy?._id.toString())
  );

  return {
    totalMerits: meritPoints
      .filter((p) => p.points > 0)
      .reduce((sum, p) => sum + p.points, 0),
    totalViolations: meritPoints
      .filter((p) => p.points < 0)
      .reduce((sum, p) => sum + Math.abs(p.points), 0),
    activeStudents,
    teacherParticipation: uniqueTeachers.size,
  };
}

async function calculateViolationTypes(meritPoints) {
  const violationTypesMap = meritPoints
    .filter((p) => p.points < 0)
    .reduce((acc, point) => {
      if (!acc[point.reason]) {
        acc[point.reason] = {
          type: point.reason,
          count: 0,
          totalPoints: 0,
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
      Classroom.find({ branch_id: branchId }).populate("students"),
      Student.find({ branch_id: branchId }).populate("class"),
      AwardedPoints.find({current:true}).populate("studentId").populate({
        path: "awardedBy",
        select: "name branch_id",
      }),
    ]);
    console.log(allMeritPoints);
    console.log(students);
    console.log(classrooms);

    // Filter merit points for this branch
    const branchMeritPoints = allMeritPoints.filter(
      (point) =>
        point.awardedBy &&
        point.awardedBy.branch_id &&
        point.awardedBy.branch_id.toString() === branchId.toString()
    );

    // Get all statistics using helper functions
    const [overallStats, trendData, recentRecords, violationTypes] =
      await Promise.all([
        calculateOverallStats(branchId, branchMeritPoints),
        calculateMonthlyTrend(branchId),
        getRecentActivity(branchId),
        calculateViolationTypes(branchMeritPoints),
      ]);
      console.log(recentRecords);

    // Get class-wise statistics
    const classWiseStats = await Promise.all(
      classrooms.map(async (classroom) => {
        const stats = await calculateClassStats(classroom, branchMeritPoints);
        return {
          class: classroom.name,
          ...stats,
        };
      })
    );

    // Get top students
    const topStudents = await getTopStudents(students, branchMeritPoints);

    // Get teacher statistics
    const teachers = await Teacher.find({ branch_id: branchId });
    const teacherStats = await Promise.all(
      teachers.map(async (teacher) => {
        const stats = await calculateTeacherStats(teacher._id);
        return {
          name: teacher.name,
          class: teacher.classes[0]?.subject_name || "N/A",
          ...stats,
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
      violationTypes,
    };
  } catch (error) {
    console.error("Error in getMeritStats:", error);
    throw error;
  }
};

const getMeritSystemData = async (req, res) => {
  try {
      // Get teacher's classes and branch
      const teacherId = req.user_id; // Assuming you have the authenticated teacher's ID
      const teacher = await Teacher.findById(teacherId);
      
      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }

      // Get all classes taught by the teacher
      const classesData = await Promise.all(teacher.classes.map(async (teacherClass) => {
          const classroom = await Classroom.findById(teacherClass.class_id)
              .populate('students', 'name rollNumber curr_merit_points');
          
          if (!classroom) return null;

          // Get merit/demerit data for each student
          const studentsData = await Promise.all(classroom.students.map(async (student) => {
              // Get awarded points for the student
              const meritPoints = await AwardedPoints.find({
                  studentId: student._id,
                  current: true,
                  points: { $gt: 0 }
              });

              const totalMeritPoints = meritPoints.reduce((sum, p) => sum + p.points, 0);

              const demerits = await AwardedPoints.find({
                  studentId: student._id,
                  current: true,
                  points: { $lt: 0 }
              });

              const totalDemerits = demerits.reduce((sum, p) => sum + Math.abs(p.points), 0);

              console.log(meritPoints, demerits);

              return {
                  id: student._id,
                  rollNo: student.rollNumber,
                  name: student.name,
                  meritPoints: totalMeritPoints,
                  demerits: totalDemerits
              };
          }));

          return {
              id: classroom._id,
              name: classroom.name,
              subject: teacherClass.subject_name,
              students: studentsData.filter(s => s !== null)
          };
      }));

      // Get merit/demerit templates
      const meritTemplates = await MeritTemplate.find();
      const demeritTemplates = await DemeritTemplate.find();

      // Format merit categories
      const meritCategories = [
          ...meritTemplates.map(template => ({
              id: template._id,
              type: 'merit',
              points: template.points,
              category: 'Academic Excellence', // You might want to add a category field to your schema
              reason: template.reason
          })),
          ...demeritTemplates.map(template => ({
              id: template._id,
              type: 'demerit',
              points: -Math.abs(template.points), // Ensure demerit points are negative
              category: 'Discipline', // You might want to add a category field to your schema
              reason: template.reason
          }))
      ];

      // Format final response
      const response = {
          CLASSES: classesData.filter(c => c !== null),
          STUDENTS: classesData.reduce((acc, classData) => {
              if (classData) {
                  acc[classData.name] = classData.students;
              }
              return acc;
          }, {}),
          MERIT_CATEGORIES: meritCategories
      };

      return res.status(200).json(response);

  } catch (error) {
      console.error('Error in getMeritSystemData:', error);
      return res.status(500).json({ 
          message: 'Error fetching merit system data',
          error: error.message 
      });
  }
};
const getMeritAnalytics=async (req, res) => {
  try {
      const { classId } = req.query;
      const result = {};

      // If classId is provided, get data for specific class, otherwise get for all classes
      const classrooms = classId 
          ? [await Classroom.findById(classId)] 
          : await Classroom.find();

      for (const classroom of classrooms) {
          const classData = {
              totalMerits: 0,
              totalViolations: 0,
              monthlyStats: [],
              meritsByType: [],
              violationsByType: [],
              recentRecords: []
          };

          // Get all students in the class
          const students = await Student.find({ class: classroom._id });
          const studentIds = students.map(student => student._id);

          // Get all awarded points for students in this class
          const awardedPoints = await AwardedPoints.find({
              studentId: { $in: studentIds },
              current: true
          }).populate('studentId', 'name')
              .sort({ date: -1 });

          // Process monthly statistics
          const monthlyData = new Map();
          const meritTypes = new Map();
          const violationTypes = new Map();

          for (const point of awardedPoints) {
              const month = point.date.toLocaleString('default', { month: 'short' });
              const monthKey = `${month}`;
              
              if (!monthlyData.has(monthKey)) {
                  monthlyData.set(monthKey, { merits: 0, violations: 0 });
              }

              if (point.points > 0) {
                  monthlyData.get(monthKey).merits += point.points;
                  classData.totalMerits += point.points;
                  
                  // Track merit types
                  if (!meritTypes.has(point.reason)) {
                      meritTypes.set(point.reason, 0);
                  }
                  meritTypes.set(point.reason, meritTypes.get(point.reason) + 1);
              } else {
                  monthlyData.get(monthKey).violations += Math.abs(point.points);
                  classData.totalViolations += Math.abs(point.points);
                  
                  // Track violation types
                  if (!violationTypes.has(point.reason)) {
                      violationTypes.set(point.reason, 0);
                  }
                  violationTypes.set(point.reason, violationTypes.get(point.reason) + 1);
              }

              // Add to recent records if within last 5
              if (classData.recentRecords.length < 5) {
                  classData.recentRecords.push({
                      id: point._id,
                      studentName: point.studentId.name,
                      type: point.points > 0 ? 'merit' : 'violation',
                      category: point.reason,
                      points: point.points,
                      date: point.date.toISOString().split('T')[0],
                      comment: point.reason
                  });
              }
          }

          // Format monthly stats
          classData.monthlyStats = Array.from(monthlyData.entries())
              .map(([month, data]) => ({
                  month,
                  merits: data.merits,
                  violations: data.violations
              }))
              .sort((a, b) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months.indexOf(a.month) - months.indexOf(b.month);
              });

          // Format merit types
          classData.meritsByType = Array.from(meritTypes.entries())
              .map(([type, count]) => ({
                  type,
                  count
              }));

          // Format violation types
          classData.violationsByType = Array.from(violationTypes.entries())
              .map(([type, count]) => ({
                  type,
                  count
              }));

          result[classroom.name] = classData;
      }

      return res.status(200).json(result);
  } catch (error) {
      console.error('Error in getMeritAnalytics:', error);
      return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
const Parent = require('../models/parent');
const getChildrenMeritData=async (req, res)=> {
  try {
      // Find parent and populate children
      const parentId = req.user_id;
      const parent = await Parent.findById(parentId)
          .populate('children');

      if (!parent) {
          return res.status(404).json({ message: 'Parent not found' });
      }

      const formattedData = {};

      // Process each child's data
      for (const child of parent.children) {
          // Get classroom info
          const classroom = await Classroom.findById(child.class);
          
          // Get merit/demerit records
          const meritRecords = await AwardedPoints.find({
              studentId: child._id,
              current: true
          }).populate({
              path: 'awardedBy',
              select: 'name'
          });

          // Format student info
          const studentInfo = {
              id: child._id,
              name: child.name,
              grade: classroom ? classroom.name : '',
              section: '', // Add section if available in your schema
              rollNumber: child.rollNumber
          };

          // Format merit records
          const records = meritRecords.map(record => ({
              id: record._id,
              date: record.date.toISOString().split('T')[0],
              type: record.points > 0 ? 'merit' : 'violation',
              points: record.points,
              class: classroom.name, // Add class info if available
              reason: record.reason,
              issuedBy: record.awardedBy ? record.awardedBy.name : ''
          }));

          // Add to formatted data
          formattedData[child._id] = {
              studentInfo,
              records
          };
      }

      res.json(formattedData);

  } catch (error) {
      console.error('Error fetching parent data:', error);
      res.status(500).json({ 
          message: 'Error fetching parent data',
          error: error.message 
      });
  }
};
const getLatestMeritData = async (req, res) => {
  try {
    const user_id = req.user_id;
    const user = await Student.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }
    const latestData = await AwardedPoints.find({
      studentId: user_id,
      current: true,
      points: { $gt: 0 },
    })
      .populate("awardedBy")
      .sort({ date: -1 })
      .limit(1);
    //get the last awarded points
    const lastAwardedPoints = latestData[0];
    res.json(lastAwardedPoints);
  }

  catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getLatestMeritData,
  createMeritTemplate,
  createDemeritTemplate,
  awardPoints,
  getMeritTemplates,
  getDemeritTemplates,
  getStudentPoints,
  getMeritStats,
  deleteMeritTemplate,
  deleteDemeritTemplate,
  getMeritSystemData,
  getMeritAnalytics,
  getChildrenMeritData
};
