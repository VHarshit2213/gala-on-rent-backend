const fs = require("fs");
const { validationResult } = require("express-validator");
const Review = require("../models/Review");

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.status(200).json({ status: 200, data: reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ properties_id: req.params.productId }).sort({ date: -1 });
    res.status(200).json({ status: 200, data: reviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.createReview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  let imagePath = "";

  try {
    const files = req.files?.image || [];

    if (files.length > 0) {
      const file = files[0];
      const ext = file.originalname.split(".").pop();
      const newPath = "uploads/" + file.filename + "." + ext;

      fs.renameSync("uploads/" + file.filename, newPath);
      imagePath = newPath;
    } else {
      return res.status(400).json({ message: "Image is required" });
    }
  } catch (err) {
    return res.status(500).json({ message: "Image processing error", error: err });
  }

  try {
    // const userId = req.user?._id || req.body.user_id;
    // const propertyId = req.body.properties_id;

    // ✅ Check if the user already reviewed this property
    // const existingReview = await Review.findOne({
    //   user_id: userId,
    //   properties_id: propertyId,
    // });

    // if (existingReview) {
    //   return res.status(409).json({
    //     status: 409,
    //     message: "You have already submitted a review for this property.",
    //     data: existingReview,
    //   });
    // }

    // ✅ Create and save new review
    const newReview = new Review({
      ...req.body,
      image: imagePath,
      // user_id: userId,
    });

    const savedReview = await newReview.save();
    res.status(200).json({ status: 200, data: savedReview });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.editReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    let imagePath = review.image;

    if (req.files?.image?.length > 0) {
      const file = req.files.image[0];
      const ext = file.originalname.split(".").pop();
      const newPath = "uploads/" + file.filename + "." + ext;

      fs.renameSync("uploads/" + file.filename, newPath);
      imagePath = newPath;
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.reviewId,
      {
        ...req.body,
        image: imagePath,
      },
      { new: true }
    );

    res.status(200).json({ status: 200, data: updatedReview });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.reviewId);
    if (!deletedReview) return res.status(404).json({ message: "Review not found" });

    // Optionally delete image from filesystem
    try {
      if (deletedReview.image && fs.existsSync(deletedReview.image)) {
        fs.unlinkSync(deletedReview.image);
      }
    } catch (imgErr) {
      console.warn("Image deletion failed:", imgErr.message);
    }

    res.status(200).json({ status: 200, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
