const Branch = require("../models/branch");
const branchadmin = require("../models/branchadmin");
const Classroom = require("../models/classroom");
const { populate } = require("../models/logs");
const { AwardedPoints } = require("../models/merit");
const Student = require("../models/student");
const Teacher = require("../models/teacher");
const { log } = require("../utils/logger");

const createBranch = async (req, res) => {
  const { name, address, contactNumber, email, capacity } = req.body;
  if (!name || !address || !contactNumber || !email || !capacity) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const branch = new Branch({
      name,
      address,
      contactNumber,
      email,
      capacity,
    });
    await branch.save();
    log("Branch created " + branch._id, "superadmin", req.user_id);
    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const readBranches = async (req, res) => {
  try {
    // Get all branches with their teachers and students
    const branches = await Branch.find({})
      .populate("teachers")
      .populate({
        path: "students",
        populate: {
          path: "class",
        },
      });
    if (!branches.length) {
      return res.status(404).json({ message: "No branches found" });
    }

    // Get all branch IDs
    const branchIds = branches.map((branch) => branch._id);

    // Get all classrooms for all branches
    const classrooms = await Classroom.find({ branch_id: { $in: branchIds } })
      .populate("students")
      .populate({
        path: "subjects",
        populate: {
          path: "teacher",
        },
      });

    // Get all merit points for all students across branches
    const allStudentIds = branches.flatMap((branch) =>
      branch.students.map((s) => s._id)
    );
    const meritPoints = await AwardedPoints.find({
      studentId: { $in: allStudentIds },
      current: true,
    }).populate("studentId");

    // Process data for each branch
    const branchesData = await Promise.all(
      branches.map(async (branch) => {
        // Get classrooms for this branch
        const branchClassrooms = classrooms.filter(
          (c) => c.branch_id.toString() === branch._id.toString()
        );

        // Calculate monthly trends for this branch
        const monthlyTrend = await calculateMonthlyTrend(branch._id);

        // Calculate classroom performance
        const classPerformance = await Promise.all(
          branchClassrooms.map(async (classroom) => {
            const classStats = await calculateClassStats(
              classroom,
              meritPoints
            );
            return {
              class: classroom.name,
              ...classStats,
            };
          })
        );

        // Get top students for this branch
        const topStudents = await getTopStudents(branch.students, meritPoints);

        // Get recent activity for this branch
        const recentActivity = await getRecentActivity(branch._id.toString());

        // Process teacher data for this branch
        const teacherData = await Promise.all(
          branch.teachers.map(async (teacher) => {
            const stats = await calculateTeacherStats(teacher._id);
            return {
              id: teacher._id,
              name: teacher.name,
              subject: teacher.classes[0]?.subject_name || "Not assigned",
              meritsAwarded: stats.meritsAwarded,
              violations: stats.violations,
              class:
                branchClassrooms.find((c) =>
                  c.subjects.some(
                    (s) => s.teacher?.toString() === teacher._id.toString()
                  )
                )?.name || "Not assigned",
            };
          })
        );

        // Calculate branch-specific metrics
        const branchMeritPoints = meritPoints.filter((p) =>
          branch.students.some(
            (s) => s._id.toString() === p.studentId._id.toString()
          )
        );

        const totalMerits = branchMeritPoints
          .filter((p) => p.points > 0)
          .reduce((sum, p) => sum + p.points, 0);

        const totalViolations = branchMeritPoints
          .filter((p) => p.points < 0)
          .reduce((sum, p) => sum + Math.abs(p.points), 0);

        // Return formatted branch data
        return {
          branchId: branch._id,
          branchName: branch.name,
          location: branch.location,
          classes: branchClassrooms.map((c) => c.name),
          teachers: teacherData,
          students: branch.students.map((s) => s.name),
          stats: {
            totalMerits,
            totalViolations,
            activeStudents: branch.students.length,
            teacherCount: branch.teachers.length,
          },
          monthlyTrend,
          classPerformance,
          topStudents,
          recentActivity,
        };
      })
    );

    // Calculate overall statistics
    const overallStats = {
      totalBranches: branches.length,
      totalStudents: allStudentIds.length,
      totalTeachers: branches.reduce(
        (sum, branch) => sum + branch.teachers.length,
        0
      ),
      totalClasses: classrooms.length,
      totalMerits: meritPoints
        .filter((p) => p.points > 0)
        .reduce((sum, p) => sum + p.points, 0),
      totalViolations: meritPoints
        .filter((p) => p.points < 0)
        .reduce((sum, p) => sum + Math.abs(p.points), 0),
    };
    const all_branches = await Branch.find({});

    res.status(200).json({
      overallStats,
      branchData: branchesData,
      branches: all_branches,
    });
  } catch (error) {
    console.error("Error in getAllBranches:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// const readBranchbyId = async (req, res) => {
//     try {
//         const branch = await Branch.findById(req.params.id);
//         if (!branch) {
//             return res.status(404).json({ message: 'Branch not found' });
//         }
//         log('Branch read'+branch._id,'superadmin',req.user_id);
//         res.status(200).json(branch);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// }
const readBranchbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = id;

    // Get basic branch info
    const branch = await Branch.findById(branchId)
      .populate("teachers")
      .populate({
        path: "students",
        populate: "class",
      });

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    // Get all classrooms for this branch
    const classrooms = await Classroom.find({ branch_id: branchId })
      .populate("students")
      .populate({
        path: "subjects",
        populate: {
          path: "teacher",
        },
      });

    // Get merit points data
    const meritPoints = await AwardedPoints.find({
      studentId: { $in: branch.students.map((s) => s._id) },
      current: true,
    }).populate({
      path: "studentId",
      populate: {
        path: "class",
        select: "name",
      },
    });

    // Calculate monthly trends (last 5 months)
    const monthlyTrend = await calculateMonthlyTrend(branchId);

    // Format classroom performance data
    const classPerformance = await Promise.all(
      classrooms.map(async (classroom) => {
        const classStats = await calculateClassStats(classroom, meritPoints);
        return {
          class: classroom.name,
          ...classStats,
        };
      })
    );

    // Get top students
    const topStudents = await getTopStudents(branch.students, meritPoints);

    // Get recent activity
    const recentActivity = await getRecentActivity(branchId);

    // Format teacher data
    const teacherData = await Promise.all(
      branch.teachers.map(async (teacher) => {
        const stats = await calculateTeacherStats(teacher._id);
        return {
          id: teacher._id,
          name: teacher.name,
          subject: teacher.classes[0]?.subject_name || "Not assigned",
          meritsAwarded: stats.meritsAwarded,
          violations: stats.violations,
          class:
            classrooms.find((c) =>
              c.subjects.some(
                (s) => s.teacher?.toString() === teacher._id.toString()
              )
            )?.name || "Not assigned",
        };
      })
    );

    // Calculate total metrics
    const totalMerits = meritPoints
      .filter((p) => p.points > 0)
      .reduce((sum, p) => sum + p.points, 0);

    const totalViolations = meritPoints
      .filter((p) => p.points < 0)
      .reduce((sum, p) => sum + Math.abs(p.points), 0);

    // Compile response
    const response = {
      classes: classrooms.map((c) => c.name),
      teachers: teacherData,
      stats: {
        totalMerits,
        totalViolations,
        activeStudents: branch.students.length,
        teacherCount: branch.teachers.length,
      },
      monthlyTrend,
      classPerformance,
      topStudents,
      recentActivity,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getBranch:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Helper function for monthly trends
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
        current: true,
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
    console.log(student);
    return {
      id: student._id,
      name: student.name || "Unknown Student",
      class: student.class.name,
      points: totalPoints,
      merits,
      violations,
    };
  });

  return studentPoints.sort((a, b) => b.points - a.points).slice(0, 5);
}

// Helper function for recent activity
async function getRecentActivity(branchId) {
  return await AwardedPoints.find({ current: true })
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
    .then((activities) =>
      activities
        .filter(
          (activity) =>
            activity.awardedBy &&
            activity.awardedBy.branch_id &&
            activity.awardedBy.branch_id.toString() === branchId
        )
        .map((activity) => ({
          id: activity._id,
          date: activity.date.toISOString().split("T")[0],
          student: activity.studentId?.name || "Unknown Student",
          class: activity.studentId?.class.name || "Unknown Class",
          type: activity.points > 0 ? "merit" : "violation",
          points: Math.abs(activity.points),
          reason: activity.reason,
          teacher:
            activity.awardedByModel === "Teacher"
              ? activity.awardedBy.name
              : null,
          admin:
            activity.awardedByModel === "Branchadmin"
              ? activity.awardedBy.name
              : null,
        }))
    );
}

// Helper function for teacher statistics
async function calculateTeacherStats(teacherId) {
  const teacherPoints = await AwardedPoints.find({
    awardedBy: teacherId,
    awardedByModel: "Teacher",
    current: true,
  });

  const meritsAwarded = teacherPoints.filter((p) => p.points > 0).length;
  const violations = teacherPoints.filter((p) => p.points < 0).length;

  return {
    meritsAwarded,
    violations,
  };
}

const updateBranch = async (req, res) => {
  try {
    //only branchname address capacity contactnumber email can be updated
    const { name, address, capacity, contactNumber, email } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        capacity,
        contactNumber,
        email,
      },
      {
        new: true,
      }
    );
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    log(`Branch updated ${branch._id}`, "superadmin", req.user_id);
    res.status(200).json(branch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    log(`Branch deleted ${branch._id}`, "superadmin", req.user_id);
    res.status(204).json({ message: "Branch deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Add a new class
const AddClass = async (req, res) => {
  const { name, branch_id } = req.body;
  if (!name || !branch_id) {
    return res.status(400).json({ message: "Name and branch_id are required" });
  }
  try {
    const classroom = new Classroom({
      name,
      branch_id,
      students: [],
      subjects: [],
    });
    await classroom.save();

    // Update branch with new class reference if needed
    log("Class created " + classroom._id, "branchadmin", req.user_id);
    res.status(201).json(classroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Add students to a class
const addStudentsToClass = async (req, res) => {
  const { class_name, student_ids } = req.body;
  if (!class_name || !student_ids || !Array.isArray(student_ids)) {
    return res
      .status(400)
      .json({ message: "Class ID and array of student IDs are required" });
  }
  try {
    const classroom = await Classroom.findOne({ name: class_name });
    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }
    const class_id = classroom._id;
    // Update students' class reference
    await Student.updateMany(
      { _id: { $in: student_ids } },
      { class: class_id }
    );

    // Add students to class
    classroom.students.push(...student_ids);
    await classroom.save();

    const prev_points = await AwardedPoints.find({
      student_id: { $in: student_ids },
      current: true,
    });
    if (prev_points.length > 0) {
      await AwardedPoints.updateMany(
        { student_id: { $in: student_ids } },
        { current: false }
      );
    }

    log("Students added to class " + class_id, "branchadmin", req.user_id);
    res.status(200).json(classroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Change student's class
const changeStudentClass = async (req, res) => {
  const { student_id, new_class_name } = req.body;
  if (!student_id || !new_class_name) {
    return res
      .status(400)
      .json({ message: "Student ID and new class ID are required" });
  }
  try {
    const classroom = await Classroom.findOne({ name: new_class_name });
    const new_class_id = classroom._id;
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Remove from old class
    if (student.class) {
      await Classroom.findByIdAndUpdate(student.class, {
        $pull: { students: student_id },
      });
    }

    // Add to new class
    await Classroom.findByIdAndUpdate(new_class_id, {
      $push: { students: student_id },
    });

    // Update student's class reference
    student.class = new_class_id;
    student.curr_merit_points = 0;
    await student.save();
    await AwardedPoints.updateMany(
      { studentId: student_id },
      { current: false }
    );

    log("Student class changed " + student_id, "branchadmin", req.user_id);
    res.status(200).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const getClasses = async (req, res) => {
  try {
    // Get branch_id from request query or params
    const { branch_id } = req.params;

    if (!branch_id) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    // Fetch classrooms with populated subjects and teacher information
    const classrooms = await Classroom.find({ branch_id })
      .populate({
        path: "subjects.teacher",
        model: "Teacher",
        select: "name",
      })
      .populate({
        path: "students",
        select: "_id",
      });

    // Transform the data to match the required format
    const formattedClasses = await Promise.all(
      classrooms.map(async (classroom) => {
        // Extract grade and section from class name (assuming format like "10-A")
        const [grade, section] = classroom.name.split("-");

        // Get class teacher (first teacher in the subjects array)
        const classTeacher =
          classroom.subjects[0]?.teacher?.name || "Not Assigned";

        return {
          id: classroom._id,
          name: classroom.name,
          section: section || "N/A",
          grade: grade || "N/A",
          classTeacher: classTeacher,
          capacity: 30, // You might want to make this configurable
          currentStrength: classroom.students.length,
          subjects: classroom.subjects,
          schedule: "Morning", // You might want to add this to your schema
          room: "Not Assigned", // You might want to add this to your schema
          academicYear:
            new Date().getFullYear() +
            "-" +
            (new Date().getFullYear() + 1).toString().substr(-2),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: formattedClasses,
      message: "Classes retrieved successfully",
    });
  } catch (error) {
    console.error("Error in getClasses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// Add subject to class
const addSubjectToClass = async (req, res) => {
  const { class_id, subject_name } = req.body;
  if (!class_id || !subject_name) {
    return res
      .status(400)
      .json({ message: "Class ID and subject name are required" });
  }
  try {
    const classroom = await Classroom.findById(class_id);
    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }
    const subjectExists = classroom.subjects.some(
      (subject) => subject.name === subject_name
    );
    if (subjectExists) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    classroom.subjects.push({
      name: subject_name,
      teacher_id: "",
    });
    await classroom.save();

    log("Subject added to class " + class_id, "branchadmin", req.user_id);
    res.status(200).json(classroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Assign teacher to subject
const assignTeacher = async (req, res) => {
  const { class_id, subject_name, teacher_id } = req.body;

  if (!class_id || !subject_name || !teacher_id) {
    return res
      .status(400)
      .json({ message: "Class ID, subject ID and teacher ID are required" });
  }
  try {
    //use or query to find subject by name or id

    const classroom = await Classroom.findById(class_id);
    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }
    let subject;
    if (subject_name) {
      subject = classroom.subjects.find(
        (subject) => subject.name === subject_name
      );
    }

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.teacher = teacher_id;
    await classroom.save();

    // Add class to teacher's classes
    await Teacher.findByIdAndUpdate(teacher_id, {
      $addToSet: { classes: { class_id, subject_name: subject.name } },
    });

    log(
      "Teacher assigned to subject " + subject_name,
      "branchadmin",
      req.user_id
    );
    res.status(200).json(classroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Change teacher of subject
const changeSubjectTeacher = async (req, res) => {
  const { class_id, subject_id, new_teacher_id } = req.body;
  if (!class_id || !subject_id || !new_teacher_id) {
    return res.status(400).json({
      message: "Class ID, subject ID and new teacher ID are required",
    });
  }
  try {
    const classroom = await Classroom.findById(class_id);
    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }

    const subject = classroom.subjects.id(subject_id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Remove class from old teacher's classes
    if (subject.teacher) {
      await Teacher.findByIdAndUpdate(subject.teacher, {
        $pull: { classes: class_id },
      });
    }

    // Add class to new teacher's classes
    await Teacher.findByIdAndUpdate(new_teacher_id, {
      $addToSet: { classes: class_id },
    });

    subject.teacher = new_teacher_id;
    await classroom.save();

    log("Subject teacher changed " + subject_id, "branchadmin", req.user_id);
    res.status(200).json(classroom);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get student class with subjects
const getStudentClassWithSubjects = async (req, res) => {
  const { student_id } = req.params;
  try {
    const student = await Student.findById(student_id).populate({
      path: "class",
      populate: {
        path: "subjects.teacher",
        select: "name email contactNumber",
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    log("Student class details retrieved " + student_id, req.role, req.user_id);
    res.status(200).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all teacher subjects
const getTeacherSubjects = async (req, res) => {
  const { teacher_id } = req.params;
  try {
    const teacher = await Teacher.findById(teacher_id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const classes = await Classroom.find({
      "subjects.teacherId": teacher_id,
    }).select("name subjects");

    const subjects = classes.map((classroom) => ({
      class_name: classroom.name,
      subjects: classroom.subjects.filter(
        (subject) =>
          subject.teacher && subject.teacher.toString() === teacher_id
      ),
    }));

    log("Teacher subjects retrieved " + teacher_id, req.role, req.user_id);
    res.status(200).json(subjects);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getAwardedMeritsByBranch = async (req, res) => {
  const branch_id = req.params.id;
  console.log(branch_id);
  const { num_recent } = req.query;
  try {
    const awardedMerits = await AwardedPoints.find({ current: true })
      .populate({
        path: "studentId",
        match: { branch_id: branch_id },
        select: "name rollNumber",
      })
      .sort({ date: -1 });
    console.log(awardedMerits);

    // Filter out merits where studentId is null (i.e., no matching student found)
    const filteredMerits = awardedMerits.filter(
      (merit) => merit.studentId !== null
    );

    // If num_recent is provided, slice the array to get the most recent merits
    const result = num_recent
      ? filteredMerits.slice(0, parseInt(num_recent))
      : filteredMerits;

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBranchTeachers = async (req, res) => {
  const admin_id = req.user_id;
  try {
    const branch = await branchadmin.findById(admin_id);
    if (!branch) {
      return res.status(404).json({ message: "Branch admin not found" });
    }

    const teachers = await Teacher.find({ branch_id: branch.branch_id });
    if (!teachers.length) {
      return res.status(404).json({ message: "No teachers found" });
    }
    log("Teachers retrieved " + branch.branch_id, "branchadmin", req.user_id);
    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getBranchStudents = async (req, res) => {
  const admin_id = req.user_id;
  try {
    const branch = await branchadmin.findById(admin_id);
    if (!branch) {
      return res.status(404).json({ message: "Branch admin not found" });
    }
    const students = await Student.find({ branch_id: branch.branch_id });
    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }
    log("Students retrieved " + branch.branch_id, "branchadmin", req.user_id);
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getBranchTeachers = getBranchTeachers;
exports.getBranchStudents = getBranchStudents;

exports.createBranch = createBranch;
exports.readBranches = readBranches;
exports.readBranchbyId = readBranchbyId;
exports.updateBranch = updateBranch;
exports.deleteBranch = deleteBranch;
exports.AddClass = AddClass;
exports.addStudentsToClass = addStudentsToClass;
exports.changeStudentClass = changeStudentClass;
exports.addSubjectToClass = addSubjectToClass;
exports.assignTeacher = assignTeacher;
exports.changeSubjectTeacher = changeSubjectTeacher;
exports.getStudentClassWithSubjects = getStudentClassWithSubjects;
exports.getTeacherSubjects = getTeacherSubjects;
exports.getAwardedMeritsByBranch = getAwardedMeritsByBranch;
exports.getClasses = getClasses;
// exports.getAwardedMeritPoints = getAwardedMeritPoints;
