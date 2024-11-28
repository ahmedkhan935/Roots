const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;