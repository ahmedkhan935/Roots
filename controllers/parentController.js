const Parent = require('../models/parent');
const Student = require('../models/student');

// Get student details by parent
const getChildren = async (req, res) => {
    try {
        const parent = await Parent.findById(req.user_id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        const children = await Student.find({ parent: parent._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const addChildren = async (req, res) => {
    const { parent_id,student_ids } = req.body;
    try {
        const parent = await Parent.findById(parent_id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        console.log(student_ids);

        const updatedStudents = await Promise.all(student_ids.map(async (student_id) => {
            const student = await Student.findById(student_id);
            if (!student) {
                throw new Error(`Student not found for ID: ${student_id}`);
            }
            //find the old parent and remove the student from their children
            const oldParent = await Parent.findById(student.parent);
            if(oldParent){
                oldParent.children = oldParent.children.filter(child => child.toString() !== student._id.toString());
                await oldParent.save();
            }

            student.parent = parent._id;
            await student.save();
            return student;
        }));
        //check if the student alr has a parent
        console.log(student_ids);

        parent.children.push(...student_ids);
        await parent.save();

        res.status(200).json({ parent, updatedStudents });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const AssignParent = async (req, res) => {
    const { parent_id,student_id } = req.body;
    try {
        const parent = await Parent.findById
        (parent_id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        const student = await Student
        .findById(student_id);
        if(student.parent){
            const oldParent = await Parent.findById(student.parent);
            if(oldParent){
                oldParent.children = oldParent.children.filter(child => child.toString() !== student._id.toString());
                await oldParent.save();
            }
        }
        student.parent = parent._id;
        await student.save();
        parent.children.push(student_id);
        await parent.save();
        res.status(200).json({ parent, student });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
const deAssignParent = async (req, res) => {
    const { parent_id,student_id } = req.body;
    try {
        const parent = await    
        Parent.findById(parent_id);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }
        const student = await Student
        .findById(student_id);
        if(!student)
        {
            return res.status(404).json({ message: 'Student not found' });
        }
        student.parent = null;
        await student.save();
        parent.children = parent.children.filter(child => child.toString() !== student_id.toString());
        await parent.save();
        res.status(200).json({ parent, student });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = {
    addChildren,
    getChildren,
    AssignParent,
    deAssignParent

};
