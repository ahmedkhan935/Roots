const Superadmin = require("../models/superadmin");
const Branchadmin = require("../models/branchadmin");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const Parent = require("../models/parent");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Branch = require("../models/branch");
const log = require("../utils/logger").log;
const {
  verifyAdmin,
  verifyBranchAdmin,
  verifyTeacher,
  verifyStudent,
} = require("../middlewares/auth");
const student = require("../models/student");
const { default: mongoose } = require("mongoose");
dotenv.config();

const loginUser = async (Model, req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Model.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    var role = "";
    if (Model === Superadmin) role = "superadmin";
    else if (Model === Branchadmin) role = "branchadmin";
    else if (Model === Teacher) role = "teacher";
    else if (Model === Student) role = "student";
    else if (Model === Parent) role = "parent";
    if (Model === Student || Model == Teacher) {
      if (user.blocked) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
    }

    const token = jwt.sign(
      { user_id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    log("login", role, user._id);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginSuperadmin = (req, res) => loginUser(Superadmin, req, res);
exports.loginBranchadmin = (req, res) => loginUser(Branchadmin, req, res);
exports.loginTeacher = (req, res) => loginUser(Teacher, req, res);
exports.loginStudent = (req, res) => loginUser(Student, req, res);
exports.loginParent = (req, res) => loginUser(Parent, req, res);

exports.createSuperadmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await Superadmin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newSuperadmin = new Superadmin({
      name,
      email,
      password: hashedPassword,
    });
    await newSuperadmin.save();
    log("create", "superadmin", newSuperadmin._id);
    res.status(201).json({ message: "Superadmin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const createBranchadmin = async (req, res) => {
  const { name, email, password, cnic, branch_id, address, contactNumber } =
    req.body;
  try {
    const existingUser = await Branchadmin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newBranchadmin = new Branchadmin({
      name,
      email,
      password: hashedPassword,
      cnic,
      branch_id,
      address,
      contactNumber,
    });
    await newBranchadmin.save();
    const branch = await Branch.findById(branch_id);
    branch.branchAdmin = newBranchadmin._id;
    await branch.save();
    log("create branchadmin", "superadmin", req.user_id);
    res.status(201).json({ message: "Branchadmin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
exports.createBranchadmin = createBranchadmin;
const createTeacher = async (req, res) => {
  const {
    name,
    email,
    password,
    qualification,
    branch_id,
    cnic,
    address,
    contactNumber,
  } = req.body;
  try {
    const existingUser = await Teacher.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(400).json({ message: "Branch not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      qualification,
      branch_id,
      cnic,
      address,
    });
    await newTeacher.save();
    branch.teachers.push(newTeacher._id);
    await branch.save();
    log("create Teacher", "branchadmin", req.user_id);
    res.status(201).json({ message: "Teacher created successfully" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
exports.createTeacher = createTeacher;

const createStudent = async (req, res) => {
  const {
    name,
    email,
    password,
    rollNumber,
    dateOfBirth,
    grade,
    branch_id,
    cnic,
    address,
    contactNumber,
    age,
    class_name,
  } = req.body;
  try {
    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return res.status(400).json({ message: "Branch not found" });
    }
    const classroom = await Classroom.findOne({ name: class_name });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      dateOfBirth,
      grade,
      branch_id,
      cnic,
      address,
      contactNumber,
      age,
      class: "675b2c68b0a7b664b9a397a5",
    });
    await newStudent.save();
    branch.students.push(newStudent._id);
    await branch.save();
    log("create Student", "branchadmin", req.user_id);
    res.status(201).json({ message: "Student created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.createStudent = createStudent;

const createParent = async (req, res) => {
  const { name, email, password, contactNumber, children, cnic } = req.body;
  console.log(req.body);
  try {
    const existingUser = await Parent.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newParent = new Parent({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      cnic,
      children,
    });
    //validate the children array to have valid mongoose ids

    children.map(async (child) => {
      const student = await Student.findById(child);
      if (!student) {
        return res.status(400).json({ message: "Student not found" });
      }
      student.parent = newParent._id;
      await student.save();
    });

    await newParent.save();
    log("create Parent", "branchadmin", req.user_id);
    res.status(201).json({ message: "Parent created successfully" });
  } catch (err) {
    console.log(err);
    console.log(err.message);
    res.status(500).json({ message: err });
  }
};
exports.createParent = createParent;
const selectMiddleware = (req, res, next) => {
  const { role } = req.params;
  console.log(role);

  switch (role) {
    case "superadmin":
      return verifyAdmin(req, res, next);
    case "branchadmin":
      return verifyAdmin(req, res, next);
    case "teacher":
      return verifyBranchAdmin(req, res, next);
    case "student":
      return verifyBranchAdmin(req, res, next);
    case "parent":
      return verifyBranchAdmin(req, res, next);
    default:
      return res.status(400).json({ message: "Invalid role" });
  }
};
exports.selectMiddleware = selectMiddleware;
// Get a user by ID
const getAllUsers = async (req, res) => {
  const { role } = req.params;
  try {
    let users;
    switch (role) {
      case "superadmin":
        users = await Superadmin.find();
        break;
      case "branchadmin":
        users = await Branchadmin.find();
        break;
      case "teacher":
        users = await Teacher.find();
        break;
      case "student":
        users = await Student.find();
        break;
      case "parent":
        users = await Parent.find();
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }
    log("fetched all users", req.body.role, req.user_id);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.getAllUsers = getAllUsers;
const getUser = async (req, res) => {
  const { role, id } = req.params;
  try {
    let user;
    switch (role) {
      case "superadmin":
        user = await Superadmin.findById(id);
        break;
      case "branchadmin":
        user = await Branchadmin.findById(id);
        break;
      case "teacher":
        user = await Teacher.findById(id);
        break;
      case "student":
        user = await Student.findById(id);
        break;
      case "parent":
        user = await Parent.findById(id);
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    log("fetched user", req.role, req.user_id);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.getUserById = getUser;

// Update a user by ID
const updateUser = async (req, res) => {
  const { role, id } = req.params;
  const updates = req.body;
  console.log(updates);
  console.log(role);
  try {
    let user;
    switch (role) {
      case "superadmin":
        user = await Superadmin.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
        break;
      case "branchadmin":
        user = await Branchadmin.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
        break;
      case "teacher":
        user = await Teacher.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
        break;
      case "student":
        user = await Student.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
        break;
      case "parent":
        user = await Parent.findByIdAndUpdate(id, updates, {
          new: true,
          runValidators: true,
        });
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    log("updated user", req.role, req.user_id);
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    console.log(err.message);
    res.status(500).json({ message: err });
  }
};
exports.updateUser = updateUser;

// Delete a user by ID
const deleteUser = async (req, res) => {
  const { role, id } = req.params;
  try {
    let user;
    switch (role) {
      case "superadmin":
        user = await Superadmin.findByIdAndDelete(id);
        break;
      case "branchadmin":
        user = await Branchadmin.findByIdAndDelete(id);
        break;
      case "teacher":
        user = await Teacher.findByIdAndDelete(id);
        break;
      case "student":
        user = await Student.findByIdAndDelete(id);
        break;
      case "parent":
        user = await Parent.findByIdAndDelete(id);
        break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    log("deleted user", req.role, req.user_id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
const calculateAttendance = async (studentId) => {
  // Placeholder - implement your attendance calculation logic
  return "95%";
};

// Helper function to calculate rank based on merit points
const calculateRank = (students) => {
  const sortedStudents = [...students].sort(
    (a, b) => b.curr_merit_points - a.curr_merit_points
  );
  return sortedStudents.reduce((ranks, student, index) => {
    ranks[student._id.toString()] = index + 1;
    return ranks;
  }, {});
};

// Helper function to get demerits (negative merit points)
const getDemerits = async (studentId) => {
  const demerits = await AwardedPoints.countDocuments({
    studentId,
    points: { $lt: 0 },
    current: true,
  });
  return demerits;
};
const AwardedPoints = require("../models/merit").AwardedPoints;
const Classroom = require("../models/classroom");
const { sendPasswordEmail } = require("../utils/email");
// Get all students with their current classes

const getAllStudents = async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate("students");
    const result = {};
    const allStudents = await Student.find().populate("class").lean();

    for (const classroom of classrooms) {
      const className = classroom.name;
      result[className] = [];

      const classStudents = allStudents.filter(
        (student) => student.class && student.class._id.equals(classroom._id)
      );

      const rankMap = calculateRank(classStudents);

      // Process each student
      for (const student of classStudents) {
        const attendance = await calculateAttendance(student._id);

        // Calculate merit points for THIS student only
        const meritPoints = await AwardedPoints.find({
          studentId: student._id,
          current: true,
          points: { $gt: 0 }, // Add this to get only positive points
        });
        const totalMeritPoints = meritPoints.reduce(
          (sum, record) => sum + record.points,
          0
        );

        // Calculate demerits for THIS student only
        const demerits = await AwardedPoints.find({
          studentId: student._id,
          current: true,
          points: { $lt: 0 },
        });
        const totalDemerits = demerits.reduce(
          (sum, record) => sum + record.points,
          0
        );

        result[className].push({
          id: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
          class: className,
          meritPoints: totalMeritPoints,
          demerits: totalDemerits,
          attendance: attendance,
          rank: rankMap[student._id.toString()],
          lastUpdated:
            student.updatedAt || new Date().toISOString().split("T")[0],
          cnic: student.cnic,
          contactNumber: student.contactNumber,
          email: student.email,
          address: student.address,
          blocked: student.blocked,
          dateOfBirth: student.dateOfBirth.toISOString().split("T")[0],
          classId: student.class._id,
        });
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching students data",
      error: error.message,
    });
  }
};
const getAdminBranch = async (req, res) => {
  const id = req.user_id;

  try {
    const user = await Branchadmin.findById(id);
    if (!user) return res.status(403).json({ message: "Not authorized" });
    console.log(user);
    const branch = await Branch.findById(user.branch_id);
    console.log(branch);
    if (!branch) return res.status(403).json({ message: "Not authorized" });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
const getMeritReport = async (req, res) => {
  try {
    const studentId = req.user_id;

    // Validate studentId format
    // if (!mongoose.Types.ObjectId.isValid(studentId)) {
    //     return res.status(400).json({ message: 'Invalid student ID format' });
    // }

    // Get basic student info
    const student = await Student.findById(studentId)
      .select("name rollNumber class curr_merit_points")
      .populate("class", "name");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get all awarded points for the student
    const allPoints = await AwardedPoints.find({
      studentId: studentId,
      current: true,
    })
      .populate("awardedBy", "name")
      .sort("-date");

    // Calculate total merits and demerits
    const totalMerits = allPoints.reduce(
      (sum, record) => (record.points > 0 ? sum + record.points : sum),
      0
    );
    const totalDemerits = Math.abs(
      allPoints.reduce(
        (sum, record) => (record.points < 0 ? sum + record.points : sum),
        0
      )
    );

    // Group points by month for history
    const monthlyHistory = allPoints.reduce((acc, record) => {
      const month = new Date(record.date).toLocaleString("en-US", {
        month: "short",
      });
      if (!acc[month]) {
        acc[month] = { month, merits: 0, demerits: 0, net: 0 };
      }
      if (record.points > 0) {
        acc[month].merits += record.points;
      } else {
        acc[month].demerits += Math.abs(record.points);
      }
      acc[month].net = acc[month].merits - acc[month].demerits;
      return acc;
    }, {});

    // Convert monthly history to array and sort by recent months
    const meritHistory = Object.values(monthlyHistory).sort((a, b) => {
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
      return months.indexOf(b.month) - months.indexOf(a.month);
    });

    // Format detailed records
    const meritRecords = allPoints.map((record) => ({
      id: record._id,
      date: record.date.toISOString().split("T")[0],
      type: record.points > 0 ? "merit" : "violation",
      points: record.points,
      category: record.reason,
      description: record.reason,
      issuedBy: record.awardedBy.name,
    }));

    // Group points by category
    const meritCategories = allPoints.reduce((acc, record) => {
      const category = record.reason;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(record.points);
      return acc;
    }, {});

    // Format response
    const response = {
      student: {
        id: student._id,
        name: student.name,
        class: student.class.name,
        rollNumber: student.rollNumber,
        totalMeritPoints: totalMerits,
        totalDemerits: totalDemerits,
        netPoints: student.curr_merit_points,
      },
      meritHistory,
      meritRecords,
      meritCategories: Object.entries(meritCategories).map(
        ([category, points]) => ({
          category,
          points,
        })
      ),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getMeritReport:", error);
    res.status(500).json({
      message: "Error retrieving merit report",
      error: error.message,
    });
  }
};
async function calculateMonthlyTrend(studentId) {
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

  studentId = studentId.toString();
  return await Promise.all(
    months.map(async (month, index) => {
      // Set date range for the entire month
      const startDate = new Date(currentYear, index, 1);
      const endDate = new Date(currentYear, index + 1, 0); // Last day of the month

      // Get all awarded points for this student in this period
      const monthData = await AwardedPoints.find({
        studentId: studentId,
        date: { $gte: startDate, $lte: endDate },
        current: true,
      });

      // Calculate merits and violations
      const merits = monthData
        .filter((d) => d.points > 0)
        .reduce((sum, d) => sum + d.points, 0);

      const violations = monthData
        .filter((d) => d.points < 0)
        .reduce((sum, d) => sum + Math.abs(d.points), 0);

      return {
        month,
        merits,
        violations,
        netPoints: merits - violations,
      };
    })
  );
}

const getMeritPointsData = async (req, res) => {
  try {
    const studentId = req.user_id;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Get awarded points history from database
    const pointsHistory = await AwardedPoints.find({
      studentId: studentId,
      current: true,
    })
      .populate("awardedBy", "name")
      .sort({ date: -1 })
      .lean();

    // Transform the database records to match the required format
    const formattedHistory = pointsHistory.map((record) => ({
      id: record._id,
      date: record.date.toISOString().split("T")[0],
      type: record.points > 0 ? "Merit" : "Demerit",
      points: record.points,
      reason: record.reason,
      awardedBy: record.awardedBy.name,
      category: record.category || "Academic", // Default category if not specified
    }));

    // Get monthly trend data
    const trendData = await calculateMonthlyTrend(studentId);

    // Return all required data
    return res.status(200).json({
      success: true,
      data: {
        currentPoints: student.curr_merit_points,
        pointsHistory: formattedHistory,
        trendData: trendData,
        categories: ["All", "Academic", "Discipline", "Extra Curricular"],
        pointTypes: ["All", "Merit", "Demerit"],
      },
    });
  } catch (error) {
    console.error("Error in getMeritPointsData:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const updateStudentPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const student = await Student.findById(req.user_id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    student.password = hashedPassword;
    await student.save();

    log("updated password", "student", req.user_id);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
const forgotStudentPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const curr_student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const password = `default${curr_student.rollNumber}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    curr_student.password = hashedPassword;
    await curr_student.save();
    //send email using nodemailer
    await sendPasswordEmail(curr_student.email, password);

    log("updated password", "student", student._id);
    //send email
    res.status(200).json({ success: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.updateStudentPassword = updateStudentPassword;
exports.getFilteredPointsHistory = getMeritPointsData;
exports.getMeritReport = getMeritReport;
exports.getAdminBranch = getAdminBranch;
exports.getAllStudents = getAllStudents;

exports.deleteUser = deleteUser;
exports.getAllUsers = getAllUsers;
exports.getUserById = getUser;
exports.updateUser = updateUser;
exports.selectMiddleware = selectMiddleware;
exports.forgotStudentPassword = forgotStudentPassword;
