const mongoose = require('mongoose');

// Define career path schema
const careerPathSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
    default: null
  }
});

// Define address schema
const addressSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  }
});

// Main Clinisist schema
const ClinisistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
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
    default: 'yes'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
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
  }
}, { timestamps: true }); 

const Clinisist = mongoose.model('Clinisist', ClinisistSchema);

module.exports = Clinisist;
