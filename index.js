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
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
app.use('/api/admin', color);
app.use('/api/admin/', body);
app.use('/api', bodyassessments);
app.use('/api/orgSubscription', orgSubscriptionRoutes);
app.use('/api/sub', mood);
app.use('/api/doctorSub', clinicianSubRoutes);
app.use('/api/clinicistPlan', clinicistPlanRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`app running on ${PORT}`);
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const cron = require('node-cron');
const { checkAndUpdateExpiredSubscriptions } = require('./controllers/orgSubscription');

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily check for expired subscriptions');
    await checkAndUpdateExpiredSubscriptions();
});