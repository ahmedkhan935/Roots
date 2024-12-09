const connectDB = require('./utils/db').connectDB;
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const authroutes = require('./routes/authRoute');
const branchRoutes = require('./routes/branchRoute');
const meritRoutes = require('./routes/meritRoute');
const parentRoutes = require('./routes/parentRoute');
const teacherRoutes = require('./routes/TeacherRoute');
app.use(express.json());
app.use('/api/auth', authroutes);
app.use('/api/branch', branchRoutes);
app.use('/api/merit', meritRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/teacher',teacherRoutes);
app.use(cors());
dotenv.config();
connectDB().then(() => {
    console.log('Connected to MongoDB');
});
app.get('/', (req, res) => {
    res.send('API is running');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log(`Server running on port ${PORT}`));

