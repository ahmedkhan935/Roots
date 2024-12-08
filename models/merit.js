const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// MeritTemplate Schema
const MeritTemplateSchema = new Schema({
    points: { type: Number, required: true },
    reason: { type: String, required: true }
});

const MeritTemplate = mongoose.model('MeritTemplate', MeritTemplateSchema);

// DemeritTemplate Schema
const DemeritTemplateSchema = new Schema({
    points: { type: Number, required: true },
    reason: { type: String, required: true }
});

const DemeritTemplate = mongoose.model('DemeritTemplate', DemeritTemplateSchema);

// AwardedPoints Schema
const AwardedPointsSchema = new Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    awardedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'awardedByModel'
    },
    awardedByModel: {
        type: String,
        required: true,
        enum: ['Teacher', 'BranchAdmin']
    },
    date: { type: Date, default: Date.now },
    current : {type: Boolean, default: true}
});

const AwardedPoints = mongoose.model('AwardedPoints', AwardedPointsSchema);

module.exports = {
    MeritTemplate,
    DemeritTemplate,
    AwardedPoints
};