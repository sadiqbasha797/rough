const mongoose = require('mongoose');
const moment = require('moment');

// Define schema for individual career path entries
const careerPathSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,  // Assuming a string format like "2020-2022"
    required: true,
  },
  description: {
    type: String,
    required: false,
    default: null
  }
});

// Address schema remains the same
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
    set: (value) => {
      return moment(value, 'DD/MM/YYYY').toDate();
    }
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
  careerpath: [careerPathSchema],  // Use an array of careerPathSchema to store multiple entries
  highlights: {
    type: String,
    required: false,
    default: null
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default : null
  }
});

const Clinisist = mongoose.model('Clinisist', ClinisistSchema);

module.exports = Clinisist;
