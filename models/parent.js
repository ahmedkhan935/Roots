const mongoose = require('mongoose');
const notificationsSchema = new mongoose.Schema({
    message: { type: String },
    date: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

const parentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cnic: {
        type: String,
        required: true,
        unique: true
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
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    notifications: {
        type: [notificationsSchema],
        required: true
    }
});

module.exports = mongoose.model('Parent', parentSchema);
