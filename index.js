const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const bodyParser = require('body-parser');
const clinisistRoutes = require('./routes/clinisistRoutes');
const adminRoutes = require('./routes/adminRoutes');
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
const body = require('./routes/bodyRoutes');
const bodyassessments = require('./routes/bodyAssessmentRoutes');
const cors = require('cors');
const orgSubscriptionRoutes = require('./routes/orgSubscriptionRoutes');
const mood = require('./routes/moodAssessmentRoutes');
const clinicianSubRoutes = require('./routes/clinisistSubRoutes');
const clinicistPlanRoutes = require('./routes/clinicistPlanRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const faqRoutes = require('./routes/faqRoutes');
const announcementRoutes = require('./routes/announcementRoutes');     
const paymentRoutes = require('./routes/paymentRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const patientAuthRoutes = require('./routes/patientAuthRoutes');
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
app.use('/api/admin/', body);
app.use('/api',bodyassessments);
app.use('/api/orgSubscription', orgSubscriptionRoutes);
app.use('/api/sub', mood);
app.use('/api/doctorSub', clinicianSubRoutes);
app.use('/api/clinicistPlan', clinicistPlanRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/googleAuth', googleAuthRoutes);
app.use('/api/patientAuth', patientAuthRoutes);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`app running on ${PORT}`);
});



const cron = require('node-cron');
const { checkAndUpdateExpiredSubscriptions } = require('./controllers/orgSubscription');

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily check for expired subscriptions');
    await checkAndUpdateExpiredSubscriptions();
});