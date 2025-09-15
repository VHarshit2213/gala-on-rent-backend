const mongoose = require("mongoose");

const PropertiesSchema = mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  image: {
    type: Array,
    required: true,
  },
  property_belongsTo: {
    type: String,
    required: true,
    },
  looking_to: {
    type: String,
    required: true,
  },
  Carpet_Area: {
    type: String,
    required: true,
  },
  Other_Area: {
    type: String,
    required: false,
  },
  User_id: {
    type: String,
    required: true,
  },
  Popular_Area: {
    type: String,
    required: true,
  },
  type_of_property : {
    type: String,
    required: true,
  },
  available_From : {
    type: String,
    required: true,
  },
  About_the_property : {
    type: String,
    required: false,
  },
  Property_Suitable_For: {
    type: Array,
    required: true,
  },
  Type_of_Power: {
    type: String,
    required: true,
  },
  Type_of_Water_Supply: {
    type: Array,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  Number_of_Washroom: {
    type: Number,
    required: true,
  },

  Financials: {
    type: Number,
    required: true,
  },
  Amenities: {
    type: Array,
    // required: true,
  },
  date: {
    type: Date,
    default: Date.now
    // required: true,
  },
  isAcceptTermsCondition:{
    type: Boolean,
    required: true,
  },
  registeredBy:{
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Properties", PropertiesSchema);
