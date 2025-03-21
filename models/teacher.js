const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cnic: {
        type: String,
        required: true,
    
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
    qualification: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    classes: [{
        type:{
            class_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Classroom'
            },
            subject_name: {
                type: String,
                required: true
            }
        }
    }],
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    contactNumber: {
        type: String,
        required: true
    },
    blocked: {
        type: Boolean,
        default: false
    }
    
});

module.exports = mongoose.model('Teacher', teacherSchema);
