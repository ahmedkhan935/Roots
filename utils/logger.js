const logs = require('../models/logs');
const log = async (action,role,userId) => {
    
    try {
        const log = new logs({
            action,
            role,
            userId
        });
        await log.save();
    } catch (err) {
        console.log(err);
    }
}
exports.log = log;  

