const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define fixed questions for each category
const treatmentHistoryQuestions = [
  'What treatments have you undergone in the past?',
  'Are you currently on any medication?',
  'Do you have any allergies to medications?'
];

const socialInformationQuestions = [
  'Do you smoke?',
  'How often do you consume alcohol?',
  'What is your exercise routine?'
];

const medicalHistoryQuestions = [
  'Do you have any chronic conditions?',
  'Have you had any major surgeries?',
  'Is there a family history of any diseases?'
];

// Define the schema for patient info
const patientInfoSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  treatmentHistory: [
    {
      question: {
        type: String,
        enum: treatmentHistoryQuestions,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      description: {
        type: String,
        default: null
      },
      id: {
        type: Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId()
      }
    }
  ],
  socialInformation: [
    {
      question: {
        type: String,
        enum: socialInformationQuestions,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      description: {
        type: String,
        default: null
      },
      id: {
        type: Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId()
      }
    }
  ],
  medicalHistory: [
    {
      question: {
        type: String,
        enum: medicalHistoryQuestions,
        required: true
      },
      answer: {
        type: String,
        required: true
      },
      description: {
        type: String,
        default: null
      },
      id: {
        type: Schema.Types.ObjectId,
        default: new mongoose.Types.ObjectId()
      }
    }
  ]
});

const PatientInfo = mongoose.model('PatientInfo', patientInfoSchema);

module.exports = PatientInfo;
