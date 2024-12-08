const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    // classes: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Class'
    // }],
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent'
    },
    class : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom'
    },
    curr_merit_points: {
        type: Number,
        default: 0
    },
});

module.exports = mongoose.model('Student', studentSchema);
