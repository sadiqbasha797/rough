const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const bodyParser = require('body-parser');
const clinisistRoutes = require('./routes/clinisistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const passport = require('passport');
const ass = require('./routes/assessmentRoutes');
const recommendation = require('./routes/recommendationRoutes');
const privacy = require('./routes/privacyPolicyRoutes');
const patientMedia = require('./routes/mediaRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const orgAdmin = require('./routes/orgAdminRoutes');
const manager = require('./routes/managerRoutes');
const forgot = require('./routes/forgotPassword');
const orgClinisist = require('./routes/orgClinisistRoutes');
const color = require('./routes/colorRoutes');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/media', patientMedia);
app.use('/api/doctor', clinisistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', ass);
app.use('/api/rec', recommendation);
app.use('/api/privacy', privacy);
app.use('/api/organization', organizationRoutes);
app.use('/api/orgadmin', orgAdmin);
app.use('/api/manager', manager);
app.use('/api', forgot);
app.use('/api', orgClinisist);
app.use('/api/admin',color);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`app running on ${PORT}`);
});
