const Branch = require('../models/branch');
const Classroom = require('../models/classroom');
const { AwardedPoints } = require('../models/merit');
const Student = require('../models/student');
const Teacher = require('../models/teacher');
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
        res.status(204).json({message: 'Branch deleted'});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// Add a new class
const AddClass = async (req, res) => {
    const { name, branch_id } = req.body;
    if (!name || !branch_id) {
        return res.status(400).json({ message: 'Name and branch_id are required' });
    }
    try {
        const classroom = new Classroom({
            name,
            branch_id,
            students: [],
            subjects: []
        });
        await classroom.save();
        
        // Update branch with new class reference if needed
        log('Class created ' + classroom._id, 'branchadmin', req.user_id);
        res.status(201).json(classroom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Add students to a class
const addStudentsToClass = async (req, res) => {
    const { class_id, student_ids } = req.body;
    if (!class_id || !student_ids || !Array.isArray(student_ids)) {
        return res.status(400).json({ message: 'Class ID and array of student IDs are required' });
    }
    try {
        const classroom = await Classroom.findById(class_id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Update students' class reference
        await Student.updateMany(
            { _id: { $in: student_ids } },
            { class: class_id }
        );

        // Add students to class
        classroom.students.push(...student_ids);
        await classroom.save();

        const prev_points=await AwardedPoints.find({ student_id: { $in: student_ids } })
        if(prev_points.length>0){
            await AwardedPoints.updateMany(
                { student_id: { $in: student_ids } },
                { current:false }
            );
        }




        log('Students added to class ' + class_id, 'branchadmin', req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Change student's class
const changeStudentClass = async (req, res) => {
    const { student_id, new_class_id } = req.body;
    if (!student_id || !new_class_id) {
        return res.status(400).json({ message: 'Student ID and new class ID are required' });
    }
    try {
        const student = await Student.findById(student_id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Remove from old class
        if (student.class) {
            await Classroom.findByIdAndUpdate(
                student.class,
                { $pull: { students: student_id } }
            );
        }

        // Add to new class
        await Classroom.findByIdAndUpdate(
            new_class_id,
            { $push: { students: student_id } }
        );

        // Update student's class reference
        student.class = new_class_id;
        student.curr_merit_points=0;
        await student.save();
        await AwardedPoints.updateMany(
            { student_id: student_id },
            { current:false }
        );
        

        log('Student class changed ' + student_id, 'branchadmin', req.user_id);
        res.status(200).json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Add subject to class
const addSubjectToClass = async (req, res) => {
    const { class_id, subject_name } = req.body;
    if (!class_id || !subject_name) {
        return res.status(400).json({ message: 'Class ID and subject name are required' });
    }
    try {
        const classroom = await Classroom.findById(class_id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const subjectExists = classroom.subjects.some(subject => subject.name === subject_name);
        if (subjectExists) {
            return res.status(400).json({ message: 'Subject already exists' });
        }


        classroom.subjects.push({
            name: subject_name
        });
        await classroom.save();

        log('Subject added to class ' + class_id, 'branchadmin', req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Assign teacher to subject
const assignTeacher = async (req, res) => {
    const { class_id, subject_id, teacher_id } = req.body;
    
    if (!class_id || (!subject_id ) || !teacher_id) {
        return res.status(400).json({ message: 'Class ID, subject ID and teacher ID are required' });
    }
    try {
        //use or query to find subject by name or id
       
            
        const classroom = await Classroom.findById(class_id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }
        let subject;
        if(subject_id){
            subject = classroom.subjects.id(subject_id);
            if (!subject) {
                return res.status(404).json({ message: 'Subject not found' });
            }
        }
       
        subject.teacher = teacher_id;
        await classroom.save();

        // Add class to teacher's classes
        await Teacher.findByIdAndUpdate(
            teacher_id,
            { $addToSet: { classes: {class_id,"subject_name":subject.name} } }
        );

        log('Teacher assigned to subject ' + subject_id, 'branchadmin', req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Change teacher of subject
const changeSubjectTeacher = async (req, res) => {
    const { class_id, subject_id, new_teacher_id } = req.body;
    if (!class_id || !subject_id || !new_teacher_id) {
        return res.status(400).json({ message: 'Class ID, subject ID and new teacher ID are required' });
    }
    try {
        const classroom = await Classroom.findById(class_id);
        if (!classroom) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const subject = classroom.subjects.id(subject_id);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Remove class from old teacher's classes
        if (subject.teacher) {
            await Teacher.findByIdAndUpdate(
                subject.teacher,
                { $pull: { classes: class_id } }
            );
        }

        // Add class to new teacher's classes
        await Teacher.findByIdAndUpdate(
            new_teacher_id,
            { $addToSet: { classes: class_id } }
        );

        subject.teacher = new_teacher_id;
        await classroom.save();

        log('Subject teacher changed ' + subject_id, 'branchadmin', req.user_id);
        res.status(200).json(classroom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Get student class with subjects
const getStudentClassWithSubjects = async (req, res) => {
    const { student_id } = req.params;
    try {
        const student = await Student.findById(student_id)
            .populate({
                path: 'class',
                populate: {
                    path: 'subjects.teacher',
                    select: 'name email contactNumber'
                }
            });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        log('Student class details retrieved ' + student_id, req.role, req.user_id);
        res.status(200).json(student);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// Get all teacher subjects
const getTeacherSubjects = async (req, res) => {
    const { teacher_id } = req.params;
    try {
        const teacher = await Teacher.findById(teacher_id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const classes = await Classroom.find({
            'subjects.teacherId': teacher_id
        }).select('name subjects');

        const subjects = classes.map(classroom => ({
            class_name: classroom.name,
            subjects: classroom.subjects.filter(subject => 
                subject.teacherId && subject.teacherId.toString() === teacher_id
            )
        }));

        log('Teacher subjects retrieved ' + teacher_id, req.role, req.user_id);
        res.status(200).json(subjects);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

const getAwardedMeritsByBranch = async (req, res) => {
    const branch_id = req.params.id;
    console.log(branch_id); 
    const { num_recent } = req.query;
    try {
        const awardedMerits = await AwardedPoints.find()
            .populate({
                path: 'studentId',
                match: { branch_id: branch_id },
                select: 'name rollNumber'
            })
            .sort({ date: -1 })
            console.log(awardedMerits);

            

        // Filter out merits where studentId is null (i.e., no matching student found)
        const filteredMerits = awardedMerits.filter(merit => merit.studentId !== null);

        // If num_recent is provided, slice the array to get the most recent merits
        const result = num_recent ? filteredMerits.slice(0, parseInt(num_recent)) : filteredMerits;

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


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
// exports.getAwardedMeritPoints = getAwardedMeritPoints;

