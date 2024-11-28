const Classroom = require('../models/classroom');
const { log } = require('../utils/logger');

// ...existing code...

const addAnnouncement = async (req, res) => {
    try {
        const { classroomId, title, content, attachments, isHomework, dueDate } = req.body;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const announcement = {
            title,
            content,
            attachments: attachments || [],
            date: new Date(),
            isHomework: isHomework || false
        };

        if (isHomework && dueDate) {
            announcement.dueDate = new Date(dueDate);
            announcement.submissions = classroom.students.map(studentId => ({
                studentId,
                status: 'pending'
            }));
        }

        classroom.announcements.push(announcement);
        await classroom.save();
        await log(isHomework ? 'Added homework' : 'Added announcement', 'teacher', req.user_id);
        res.status(200).json({ message: isHomework ? 'Homework added successfully' : 'Announcement added successfully', classroom });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        await log('Retrieved announcements', 'teacher', req.user_id);
        res.status(200).json({ announcements: classroom.announcements });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { classroomId, announcementId } = req.params;
        const { title, content, attachments, isHomework, dueDate } = req.body;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const announcement = classroom.announcements.id(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        announcement.title = title || announcement.title;
        announcement.content = content || announcement.content;
        announcement.attachments = attachments || announcement.attachments;
        
        if (isHomework !== undefined) {
            announcement.isHomework = isHomework;
            if (isHomework && dueDate) {
                announcement.dueDate = new Date(dueDate);
                // Only initialize submissions if they don't exist
                if (!announcement.submissions) {
                    announcement.submissions = classroom.students.map(studentId => ({
                        studentId,
                        status: 'pending'
                    }));
                }
            }
        }

        await classroom.save();
        await log('Updated ' + (announcement.isHomework ? 'homework' : 'announcement'), 'teacher', req.user_id);
        res.status(200).json({ message: 'Updated successfully', classroom });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { classroomId, announcementId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        classroom.announcements.pull(announcementId);
        await classroom.save();
        await log('Deleted announcement', 'teacher', req.user_id);
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addEvaluation = async (req, res) => {
    try {
        const { classroomId, studentId, marks, eval_title } = req.body;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        classroom.evaluation.push({
            studentId,
            marks,
            eval_title,
            date: new Date()
        });

        await classroom.save();
        await log('Added evaluation', 'teacher', req.user_id);
        res.status(200).json({ message: 'Evaluation added successfully', classroom });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEvaluations = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        await log('Retrieved evaluations', 'teacher', req.user_id);
        res.status(200).json({ evaluations: classroom.evaluation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateEvaluation = async (req, res) => {
    try {
        const { classroomId, evaluationId } = req.params;
        const { marks, eval_title } = req.body;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const evaluation = classroom.evaluation.id(evaluationId);
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        evaluation.marks = marks || evaluation.marks;
        evaluation.eval_title = eval_title || evaluation.eval_title;

        await classroom.save();
        await log('Updated evaluation', 'teacher', req.user_id);
        res.status(200).json({ message: 'Evaluation updated successfully', classroom });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteEvaluation = async (req, res) => {
    try {
        const { classroomId, evaluationId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        classroom.evaluation.pull(evaluationId);
        await classroom.save();
        await log('Deleted evaluation', 'teacher', req.user_id);
        res.status(200).json({ message: 'Evaluation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getHomeworkSubmissions = async (req, res) => {
    try {
        const { classroomId, announcementId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const announcement = classroom.announcements.id(announcementId);
        if (!announcement || !announcement.isHomework) {
            return res.status(404).json({ message: 'Homework not found' });
        }

        await log('Retrieved homework submissions', 'teacher', req.user_id);
        res.status(200).json({ submissions: announcement.submissions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAnnouncementById = async (req, res) => {
    try {
        const { classroomId, announcementId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const announcement = classroom.announcements.id(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        await log('Retrieved announcement by ID', 'teacher', req.user_id);
        res.status(200).json({ announcement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEvaluationById = async (req, res) => {
    try {
        const { classroomId, evaluationId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const evaluation = classroom.evaluation.id(evaluationId);
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        await log('Retrieved evaluation by ID', 'teacher', req.user_id);
        res.status(200).json({ evaluation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentEvaluations = async (req, res) => {
    try {
        const { classroomId, studentId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const studentEvaluations = classroom.evaluation.filter(eval => 
            eval.studentId.toString() === studentId
        );

        await log('Retrieved student evaluations', 'teacher', req.user_id);
        res.status(200).json({ evaluations: studentEvaluations });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActiveHomework = async (req, res) => {
    try {
        const { classroomId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const currentDate = new Date();
        const activeHomework = classroom.announcements.filter(announcement => 
            announcement.isHomework && 
            announcement.dueDate && 
            new Date(announcement.dueDate) > currentDate
        );

        await log('Retrieved active homework', req.role, req.user_id);
        res.status(200).json({ 
            activeHomework,
            count: activeHomework.length 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStudentActiveHomework = async (req, res) => {
    try {
        const { classroomId, studentId } = req.params;
        const classroom = await Classroom.findById(classroomId);
        
        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        const currentDate = new Date();
        const activeHomework = classroom.announcements.filter(announcement => 
            announcement.isHomework && 
            announcement.dueDate && 
            new Date(announcement.dueDate) > currentDate &&
            announcement.submissions.some(sub => 
                sub.studentId.toString() === studentId && 
                sub.status !== 'submitted'
            )
        );

        await log('Retrieved student active homework', req.role, req.user_id);
        res.status(200).json({ 
            activeHomework,
            count: activeHomework.length,
            studentId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllClassesStudentActiveHomework = async (req, res) => {
    try {
        const { studentId } = req.params;
        const classrooms = await Classroom.find({ 
            students: studentId 
        });
        
        if (!classrooms.length) {
            return res.status(404).json({ message: 'No classrooms found for this student' });
        }

        const currentDate = new Date();
        const allActiveHomework = [];

        classrooms.forEach(classroom => {
            const activeHomework = classroom.announcements.filter(announcement => 
                announcement.isHomework && 
                announcement.dueDate && 
                new Date(announcement.dueDate) > currentDate &&
                announcement.submissions.some(sub => 
                    sub.studentId.toString() === studentId && 
                    sub.status !== 'submitted'
                )
            ).map(hw => ({
                ...hw.toObject(),
                className: classroom.name,
                classroomId: classroom._id
            }));
            
            allActiveHomework.push(...activeHomework);
        });

        await log('Retrieved all classes student active homework', req.role, req.user_id);
        res.status(200).json({ 
            activeHomework: allActiveHomework,
            count: allActiveHomework.length,
            studentId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addAnnouncement,
    getAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    addEvaluation,
    getEvaluations,
    updateEvaluation,
    deleteEvaluation,
    getHomeworkSubmissions,
    getAnnouncementById,
    getEvaluationById,
    getStudentEvaluations,
    getActiveHomework,
    getStudentActiveHomework,
    getAllClassesStudentActiveHomework
};
