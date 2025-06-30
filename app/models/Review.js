const mongoose = require("mongoose");

const ReviewSchema = mongoose.Schema({
  // properties_id: {
  //   type: String,
  //   required: true,
  // },
  // user_id: {
  //   type: String,
  //   required: true,
  // },
  name: {
    type: String,
    required: true,
  },
  star: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model("Reviews", ReviewSchema);
