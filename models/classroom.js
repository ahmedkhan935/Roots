const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// const AnnouncementSchema = new Schema({
//     attachments: [String],
//     date: { type: Date, default: Date.now },
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     isHomework: { type: Boolean, default: false },
//     dueDate: { type: Date },
//     submissions: [{
//         studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
//         submissionDate: { type: Date },
//         attachments: [String],
//         status: { type: String, enum: ['pending', 'submitted', 'late'], default: 'pending' }
//     }]
// });
const SubjectSchema = new Schema({
    name: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    // assignments: [{
    //     title: { type: String, required: true },
    //     content: { type: String, required: true },
    //     attachments: [String],
    //     dueDate: { type: Date, required: true },
    //     submissions: [{
    //         studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    //         submissionDate: { type: Date },
    //         attachments: [String],
    //         status: { type: String, enum: ['pending', 'submitted', 'late'], default: 'pending' }
    //     }]
    // }]
});

const ClassroomSchema = new Schema({
    name: { type: String, required: true },
    
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    // announcements: [AnnouncementSchema],
    // evaluation: [{
    //     studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    //     marks: { type: Number },
    //     date: { type: Date, default: Date.now },
    //     eval_title: { type: String },
    // }],
    subjects: [SubjectSchema],
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
});

const Classroom = mongoose.model('Classroom', ClassroomSchema);

module.exports = Classroom;