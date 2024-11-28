const connectDB = require('./utils/db').connectDB;
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const authroutes = require('./routes/authRoute');
const branchRoutes = require('./routes/branchRoute');
app.use(express.json());
app.use('/api/auth', authroutes);
app.use('/api/branch', branchRoutes);
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

