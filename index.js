const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
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
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store io instance globally
global.io = io;

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle joining a room (using userId as room name)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(cors());

// Increase payload size limits
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

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

app.set('view engine', 'ejs');
app.set('views', './views');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };

const cron = require('node-cron');
const { checkAndUpdateExpiredSubscriptions } = require('./controllers/orgSubscription');

// Schedule the task to run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily check for expired subscriptions');
    await checkAndUpdateExpiredSubscriptions();
});