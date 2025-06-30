module.exports = (app, upload) => {
  const express = require("express");
  const router = express.Router();

  const reviewController = require("../controllers/review.controller");
  const authenticate = require("../middleware/authenticate.js");
  const { check } = require("express-validator");

  const Upload_Image = upload.fields([{ name: "image", maxCount: 10 }]);

  router.get("/getAllReviews", reviewController.getAllReviews);
  router.get("/getReviewsByProduct/:productId", reviewController.getReviewsByProduct);

  router.post(
    "/createReview",
    authenticate,
    Upload_Image,
    [
      check("properties_id").notEmpty(),
      check("name").notEmpty(),
      check("star").notEmpty(),
      check("description").notEmpty(),
      check("subtitle").notEmpty(),
    ],
    reviewController.createReview
  );

  router.put(
    "/editReview/:reviewId",
    authenticate,
    Upload_Image,
    reviewController.editReview
  );

  router.delete("/deleteReview/:reviewId", authenticate, reviewController.deleteReview);

  app.use("/api/review", router);
};
