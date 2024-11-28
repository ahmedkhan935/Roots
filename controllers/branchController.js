const Branch = require('../models/branch');
const Classroom = require('../models/classroom');
const student = require('../models/student');
const teacher = require('../models/teacher');
const { log } = require('../utils/logger');


const createBranch = async (req, res) => {
    const {name,address,contactNumber,email,capacity} = req.body;
    if(!name || !address || !contactNumber || !email || !capacity){
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const branch = new Branch({
            name,
            address,
            contactNumber,
            email,
            capacity
        });
        await branch.save();
        log('Branch created '+ branch._id,'superadmin',req.user_id);
        res.status(201).json(branch);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}
const readBranches = async (req, res) => {
    try {
        const branches = await Branch.find();
        log('Branches read','superadmin',req.user_id);
        res.status(200).json(branches);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const readBranchbyId = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        log('Branch read'+branch._id,'superadmin',req.user_id);
        res.status(200).json(branch);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate
        (req.params.id, req.body, { new: true });
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        log(`Branch updated ${branch
            ._id
        }`,'superadmin',req.user_id);
        res.status(200).json(branch);
    }

    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        log(`Branch deleted ${branch._id}`,'superadmin',req.user_id);
        res.status(204).json();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const AddClass = async (req, res) => {
    try {
        const {name,teacherId,students,branch_id} = req.body;
        const branch = await Branch.findById(branch_id);

        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        const teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        students.map(async element => {
            const student = await student.findById(element);
            if (!student) {
                return res.status(404).json({ message: 'Invalid Student',error:element });
            }
            
        });
        const new_class = new Classroom({
            name,
            teacherId,
            students,
            branch_id
        });
        await new_class.save();
        branch.classes.push(new_class._id);
        await branch.save();
        log(`Class added ${new_class._id}`,'branchadmin',req.user_id);
        res.status(200).json(branch);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const updateClass = async (req, res) => {   
    try {
        const classroom = await Classroom.findByIdAndUpdate
        (req.params.id, req.body, { new: true });
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        log(`Class updated ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
}
const deleteClass = async (req, res) => {
    try {
        const classroom = await Classroom.findByIdAndDelete(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }

        log(`Class deleted ${classroom._id}`,'branchadmin',req.user_id);
        res.status(204).json();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getClass = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        log(`Class read ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const getClassbyId = async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        log(`Class read ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getStudentClasses = async (req, res) => {
    try {
        const student = await student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const classes = await Classroom.find({ students: student._id });
        log(`Student classes read ${student._id}`,'student',req.user_id);
        res.status(200).json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getTeacherClasses = async (req, res) => {
    try {
        const teacher = await teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const classes = await Classroom.find({ teacherId: teacher._id });
        log(`Teacher classes read ${teacher._id}`,'teacher',req.user_id);
        res.status(200).json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getBranchClasses = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        const classes = await Classroom.find({ branch_id: branch._id });
        log(`Branch classes read ${branch._id}`,'branchadmin',req.user_id);
        res.status(200).json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getBranchTeachers = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        const teachers = await teacher.find({ branch_id: branch._id });
        log(`Branch teachers read ${branch._id}`,'branchadmin',req.user_id);
        res.status(200).json(teachers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const getBranchStudents = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id);    
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        const students = await student.find({ branch_id: branch._id });

        log(`Branch students read ${branch._id}`,'branchadmin',req.user_id);
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const addStudentsToClass = async (req, res) => {
    try {
        const {students,classId} = req.body;
        students.map(async element => {
            const student = await student.findById(element);
            if (!student) {
                return res.status(404).json({ message: 'Invalid Student',error:element });
            }
            
            
        }
        );

        const classroom = await Classroom.findById(classId);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        classroom.students.push(...students);
        await classroom.save();
        //add class to student
        students.map(async element => {
            const student = await student.findById(element);
            student.classes.push(classroom._id);

            await student.save();
        });

        log(`Student added to class ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const removeStudentsFromClass = async (req, res) => {
    try {
        const {students,classId} = req.body;
        const classroom = await Classroom.findById(classId);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        students.map(async element => {
            const student = await student.findById(element);
            if (!student) {
                return res.status(404).json({ message: 'Invalid Student',error:element });
            }
            if (!classroom.students.includes(element)) {
                return res.status(404).json({ message: 'Student not in class',error:element });
            }
            
        }
        );
        classroom.students = classroom.students.filter(element => !students.includes(element));
        await classroom.save();
        //remove class from student
        students.map(async element => {
            const student = await student.findById(element);
            student.classes = student.classes.filter(classId => classId !== classroom._id);
            await student.save();
        });
        log(`Student removed from class ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const assignTeacher= async (req, res) => {
    try {
        const {teacherId,classId} = req.body;
        const classroom = await Classroom.findById(classId);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        if(classroom.teacherId){    
            return res.status(400).json({ message: 'Teacher already assigned' });
        }
        const teacher = await teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        if(classroom)
        classroom.teacherId = teacherId;
        await classroom.save();
        teacher.classes.push(classroom._id);
        log(`Teacher assigned to class ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const removeClassFromTeacher = async (req, res) => {
    try {
        const {teacherId,classId} = req.body;
        const classroom = await Classroom.findById(classId);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const teacher = await teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        classroom.teacherId = null;
        await classroom.save();
        teacher.classes = teacher.classes.filter(classId => classId !== classroom._id);
        await teacher.save();
        log(`Teacher removed from class ${classroom._id}`,'branchadmin',req.user_id);
        res.status(200).json(classroom);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.removeClassFromTeacher = removeClassFromTeacher;
exports.removeStudentsFromClass = removeStudentsFromClass;
exports.addStudentsToClass = addStudentsToClass;
exports.createBranch = createBranch;
exports.readBranches = readBranches;
exports.readBranchbyId = readBranchbyId;
exports.updateBranch = updateBranch;
exports.deleteBranch = deleteBranch;
exports.AddClass = AddClass;
exports.assignTeacher = assignTeacher;
exports.updateClass = updateClass;
exports.deleteClass = deleteClass;
exports.getClass = getClass;

exports.getClassbyId = getClassbyId;
exports.getStudentClasses = getStudentClasses;
exports.getTeacherClasses = getTeacherClasses;
exports.getBranchClasses = getBranchClasses;
exports.getBranchTeachers = getBranchTeachers;
exports.getBranchStudents = getBranchStudents;
