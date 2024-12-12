const Superadmin = require('../models/superadmin');
const Branchadmin = require('../models/branchadmin');
const Teacher = require('../models/teacher');
const Student = require('../models/student');
const Parent = require('../models/parent');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Branch = require('../models/branch');
const log = require('../utils/logger').log;
const { verifyAdmin, verifyBranchAdmin, verifyTeacher, verifyStudent } = require('../middlewares/auth');
const student = require('../models/student');
const { default: mongoose } = require('mongoose');
dotenv.config();



const loginUser = async (Model, req, res) => {
    const { email, password } = req.body;
    try {
        const user = await Model.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        var role="";
        if(Model === Superadmin ) 
            role = "superadmin";
        else if(Model === Branchadmin)
            role = "branchadmin";
        else if(Model === Teacher)
            role = "teacher";
        else if(Model === Student)
            role = "student";
        else if(Model === Parent)
            role = "parent";



        const token = jwt.sign({ user_id: user._id,role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        log('login',role,user._id);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
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
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newSuperadmin = new Superadmin({ name, email, password: hashedPassword });
        await newSuperadmin.save();
        log('create','superadmin',newSuperadmin._id);
        res.status(201).json({ message: 'Superadmin created successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
const createBranchadmin = async (req, res) => {
    const { name, email, password,cnic,branch_id,address,contactNumber } = req.body;
    try {
        const existingUser = await Branchadmin.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newBranchadmin = new Branchadmin({ name, email, password: hashedPassword, cnic,branch_id,address,contactNumber });
        await newBranchadmin.save();
        const branch = await Branch.findById(branch_id);
        branch.branchAdmin = newBranchadmin._id;
        await branch.save();
        log('create branchadmin','superadmin',req.user_id);
        res.status(201).json({ message: 'Branchadmin created successfully' });
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
}
exports.createBranchadmin = createBranchadmin;
const createTeacher = async (req, res) => {
    const { name, email, password, qualification, branch_id ,cnic,address,contactNumber } = req.body;
    try {
        const existingUser = await Teacher
            .findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const branch = await Branch.findById(branch_id);
        if(!branch) {
            return res.status(400).json({ message: 'Branch not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newTeacher = new Teacher({ name, email, password: hashedPassword, contactNumber,qualification, branch_id,cnic,address });
        await newTeacher.save();
        branch.teachers.push(newTeacher._id);
        await branch.save();
        log('create Teacher','branchadmin',req.user_id);
        res.status(201).json({ message: 'Teacher created successfully' });
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
}
exports.createTeacher = createTeacher;

const createStudent = async (req, res) => {
    const { name, email, password, rollNumber, dateOfBirth, grade, branch_id,cnic,address,contactNumber,age,class_name} = req.body;
    try {
        const existingUser = await Student
            .findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const branch = await Branch.findById(branch_id);
        if(!branch) {
            return res.status(400).json({ message: 'Branch not found' });
        }
        const classroom = await Classroom.findOne({name:class_name});
        

        const hashedPassword = await bcrypt.hash(password, 10);
        const newStudent = new Student({ name, email, password: hashedPassword, rollNumber, dateOfBirth, grade, branch_id,cnic,address,contactNumber,age,class:classroom._id });
        await newStudent.save();
        branch.students.push(newStudent._id);
        await branch.save();
        log('create Student','branchadmin',req.user_id);
        res.status(201).json({ message: 'Student created successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
}
exports.createStudent = createStudent;

const createParent = async (req, res) => {
    
    const { name, email, password, contactNumber, children,cnic } = req.body;
    try {
        const existingUser = await Parent
            .findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newParent = new Parent({ name, email, password: hashedPassword, contactNumber,cnic,children });
        //validate the children array to have valid mongoose ids    

        
        children.map ( async (child) => {
           

            const student = await Student.findById
            (child);
            if(!student) {
                return res.status(400).json({ message: 'Student not found' });
            }
            student.parent = newParent._id; ;
            await student.save();
        });

        await newParent.save();
        log('create Parent','branchadmin',req.user_id);
        res.status(201).json({ message: 'Parent created successfully' });
    }
    catch (err) {
        res.status(500).json({ message: err });
    }
}
exports.createParent = createParent;
const selectMiddleware = (req, res, next) => {
    const { role } = req.params;
    console.log(role);

    switch (role) {
        case 'superadmin':
            return verifyAdmin(req, res, next);
        case 'branchadmin':
            return verifyAdmin(req, res, next);
        case 'teacher':
            return verifyBranchAdmin(req, res, next);
        case 'student':
            return verifyBranchAdmin(req, res, next);
        case 'parent':
            return verifyBranchAdmin(req, res, next);
        default:
            return res.status(400).json({ message: 'Invalid role' });
    }
};
exports.selectMiddleware = selectMiddleware;
// Get a user by ID
const getAllUsers = async (req, res) => {
    const { role } = req.params;
    try {
        let users;
        switch (role) {
            case 'superadmin':
                users = await Superadmin.find();
                break;
            case 'branchadmin': 

                users = await Branchadmin.find();
                break;
            case 'teacher':
                users = await Teacher.find();
                break;
            case 'student':
                users = await Student.find();
                break;
            case 'parent':
                users = await Parent.find();
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }
        log('fetched all users',req.body.role,req.user_id);
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUser = async (req, res) => {
    const { role, id } = req.params;
    try {
        let user;
        switch (role) {
            case 'superadmin':
                user = await Superadmin.findById(id);
                break;
            case 'branchadmin':
                user = await Branchadmin.findById(id);
                break;
            case 'teacher':
                user = await Teacher.findById(id);
                break;
            case 'student':
                user = await Student.findById(id);
                break;
            case 'parent':
                user = await Parent.findById(id);
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        log('fetched user',req.role,req.user_id);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserById = getUser;

// Update a user by ID
const updateUser = async (req, res) => {
    const { role, id } = req.params;
    const updates = req.body;
    try {
        let user;
        switch (role) {
            case 'superadmin':
                user = await Superadmin.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                break;
            case 'branchadmin':
                user = await Branchadmin.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                break;
            case 'teacher':
                user = await Teacher.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                break;
            case 'student':
                user = await Student.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                break;
            case 'parent':
                user = await Parent.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user);
        log('updated user',req.role,req.user_id);
        res.status(200).json(user);
    } catch (err) {
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
            case 'superadmin':
                user = await Superadmin.findByIdAndDelete(id);
                break;
            case 'branchadmin':
                user = await Branchadmin.findByIdAndDelete(id);
                break;
            case 'teacher':
                user = await Teacher.findByIdAndDelete(id);
                break;
            case 'student':
                user = await Student.findByIdAndDelete(id);
                break;
            case 'parent':
                user = await Parent.findByIdAndDelete(id);
                break;
            default:
                return res.status(400).json({ message: 'Invalid role' });
        }
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        log('deleted user',req.role,req.user_id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
const calculateAttendance = async (studentId) => {
    // Placeholder - implement your attendance calculation logic
    return '95%';
};

// Helper function to calculate rank based on merit points
const calculateRank = (students) => {
    const sortedStudents = [...students].sort((a, b) => b.curr_merit_points - a.curr_merit_points);
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
        current: true
    });
    return demerits;
};
const AwardedPoints = require('../models/merit').AwardedPoints;
const Classroom = require('../models/classroom');
// Get all students with their current classes

const getAllStudents = async (req, res) => {
    try {
        // Get all classrooms
        const classrooms = await Classroom.find().populate('students');
        
        // Initialize result object
        const result = {};
        
        // Get all students with their current classes
        const allStudents = await Student.find()
            .populate('class')
            .lean();

        // Process students by class
        for (const classroom of classrooms) {
            const className = classroom.name;
            result[className] = [];
            
            // Filter students for this classroom
            const classStudents = allStudents.filter(
                student => student.class && student.class._id.equals(classroom._id)
            );
            
            // Calculate ranks for this class
            const rankMap = calculateRank(classStudents);
            
            // Process each student
            for (const student of classStudents) {
                const attendance = await calculateAttendance(student._id);
                const demerits = await getDemerits(student._id);
                
                result[className].push({
                    id: student._id,
                    rollNo: student.rollNumber,
                    name: student.name,
                    class: className,
                    meritPoints: student.curr_merit_points || 0,
                    demerits: demerits,
                    attendance: attendance,
                    rank: rankMap[student._id.toString()],
                    lastUpdated: student.updatedAt || new Date().toISOString().split('T')[0]
                });
            }
        }
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in getAllStudents:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students data',
            error: error.message
        });
    }
};
const getAdminBranch = async (req, res) => {
    const id = req.user_id;
    
    try{
        const user  = await Branchadmin.findById(id);
        if(!user)
            return res.status(403).json({ message: 'Not authorized' });
        console.log(user);
        const branch = await Branch.findById(user.branch_id
            );
        console.log(branch);
        if(!branch)
            return res.status(403).json({ message: 'Not authorized' });
        res.json(branch);

    }
    catch(err) {
        res.status(500).json({ message: err });
    }
}
exports.getAdminBranch = getAdminBranch;
exports.getAllStudents = getAllStudents;

exports.deleteUser = deleteUser;