const mongoose = require('mongoose');

// Define career path schema
const careerPathSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  startDate: {
    type: Date,
    required: false,
  },
  endDate: {
    type: Date,
    required: false,
  },
  description: {
    type: String,
    required: false,
    default: null
  },
  specialty: {
    type: String,
    required: false,
    default: null
  },
  organizationName: {
    type: String,
    required: false,
    default: null
  }
});

// Define address schema
const addressSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  }
});

// Main Clinisist schema
const ClinisistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  image: {
    type: String,
  },
  mobileNum: {
    type: String,
  },
  dob: {
    type: Date,
  },
  password: {
    type: String,
    required: true
  },
  specializedIn: {
    type: String,
    default: null
  },
  address: addressSchema,
  about: {
    type: String,
    default: null
  },
  services: {
    type: String,
    default: null
  },
  verified: {
    type: String,
    default: 'no'
  },
  licenseImage: {
    type: String,
    default: null
  },
  front_license :{
    type: String,
    default: null
  },
  back_license :{
    type: String,
    default: null
  },
  ratings: {
    type: String,
    default: null
  },
  experience: {
    type: String,
    required: false,
    default: null
  },
  location: {
    type: String,
    required: false,
    default: null,
  },
  careerpath: [careerPathSchema],  // Array of career paths
  highlights: {
    type: String,
    required: false,
    default: null
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  Active: {
    type: String,
    default: 'no'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  degree: {
    type: String,
    required: false,
    default: null
  },
  licenseNumber: {
    type: String,
    required: false,
    default: null
  },
  licenseExpirationDate: {
    type: Date,
    required: false,
    default: null
  },
  npiNumber: {
    type: String,
    required: false,
    default: null
  },
  verificationToken: String,
  tokenExpiration: Date,
  score: {
      type: Number,
      default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  deviceToken: {
    type: String,
    required: false,
    default: null
  },
}, { timestamps: true }); 

const Clinisist = mongoose.model('Clinisist', ClinisistSchema);

module.exports = Clinisist;
