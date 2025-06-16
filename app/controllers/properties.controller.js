const { check, validationResult } = require("express-validator");
const Properties = require("../models/Properties");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const he = require("he");

exports.getAllProperties = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  res.header("Access-Control-Allow-Origin", "*");

  try {
    const limit = parseInt(process.env.PAGE_LIMIT) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};

    // Optional filtering
    if (req.query.address) {
      filter.address = { $regex: req.query.address, $options: 'i' }; // case-insensitive partial match
    }

    if (req.query.Popular_Area) {
      filter.Popular_Area = { $regex: req.query.Popular_Area, $options: 'i' };
    }

    const properties = await Properties.find(filter)
      .skip(skip)
      .limit(limit);

    if (properties.length === 0) {
      return res.status(404).json({ message: "No Properties found" });
    }

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// exports.getProductsByCategory = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 100;
//     const filter = { availableCustomise: true };

//     // Cursor-based pagination
//     if (page > 1) {
//       const previousProducts = await Properties.find(filter)
//         .sort({ createdAt: -1 })
//         .limit((page - 1) * limit);

//       const lastProduct = previousProducts[previousProducts.length - 1];
//       if (lastProduct) {
//         filter.createdAt = { $lt: lastProduct.createdAt };
//       }
//     }

//     // Fetch properties with pagination
//     let properties = await Properties.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(limit);

//     if (properties.length === 0) {
//       return res.status(404).json({ message: "No Properties found" });
//     }

//     // Reviews
//     const productIds = properties.map(property => property._id);
//     const allReviews = await Review.find({ product_id: { $in: productIds } });

//     const reviewMap = {};
//     allReviews.forEach(review => {
//       const propertyId = review.product_id.toString();
//       if (!reviewMap[propertyId]) {
//         reviewMap[propertyId] = [];
//       }
//       reviewMap[propertyId].push(parseFloat(review.star));
//     });

//     const enrichedProducts = properties.map(property => {
//       const reviews = reviewMap[property._id.toString()] || [];
//       const totalStars = reviews.reduce((sum, star) => sum + star, 0);
//       const averageRating = reviews.length ? (totalStars / reviews.length).toFixed(1) : 0;

//       return {
//         ...property.toObject(),
//         rating: Number(averageRating),
//         reviews: reviews.length
//       };
//     });

//     // Group properties by category
//     const groupedByCategory = {};
//     enrichedProducts.forEach(property => {
//       const category = property.category || "Uncategorized";
//       if (!groupedByCategory[category]) {
//         groupedByCategory[category] = [];
//       }
//       groupedByCategory[category].push(property);
//     });

//     // ✅ Fetch background items from BackgroundGlass collection
//     const backgrounds = await Background.find().lean();
//     groupedByCategory["background"] = backgrounds;

//     const totalProducts = await Properties.countDocuments({ availableCustomise: true });

//     res.json({
//       status: 200,
//       currentPage: page,
//       totalPages: Math.ceil(totalProducts / limit),
//       totalItems: totalProducts,
//       data: groupedByCategory
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

exports.getProperty = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  res.header("Access-Control-Allow-Origin", "*");

  try {
    const propertyId = req.params.PropertyId;
    const property = await Properties.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Properties not found" });
    }
    res.json({
      status: 200,
      data: property
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


exports.deleteProperty = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.header("Access-Control-Allow-Origin", "*");
    try {
        const propertyId = req.params.PropertyId;
        
        const deletedProduct = await Properties.findByIdAndDelete(propertyId);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Properties not found" });
        }
 // Delete image files if they exist
 if (deletedProduct.image && Array.isArray(deletedProduct.image)) {
  deletedProduct.image.forEach((imgPath) => {
    const oldImagePath = path.join(__dirname, "../..", imgPath);
    
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath); // Delete image file
    }
  });
}
        res.json({ status: 200, message: "Properties deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.editProperty = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    res.header("Access-Control-Allow-Origin", "*");
    try {
        const propertyId = req.params.PropertyId;

        // Fetch the current property to check its existing images
        const property = await Properties.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Properties not found" });
        }

        // Initialize the array to hold updated image paths
        let imagePaths = [...property.image];  // Copy the existing images array

        // Iterate over the req.body to check each image (image0, image1, etc.)
        for (let i = 0; i < 4; i++) {
            const imageField = `image${i}`; // image0, image1, image2, image3

            // Check if there is a file in the current image slot
            if (req.files && req.files[imageField]) {
                const newImage = req.files[imageField][0]; // Get the file for the specific image

                // Delete the old image if it exists
                if (imagePaths[i]) {
                    const oldImagePath = path.join(__dirname, "../..", imagePaths[i]);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                // Process the new image
                const ext = path.extname(newImage.originalname);
                const newPath = "uploads/" + newImage.filename + ext;

                // Rename the uploaded file to the new path
                fs.renameSync("uploads/" + newImage.filename, newPath);

                // Update the image path in the array
                imagePaths[i] = newPath;
            }
        }

        // Update the property with the new image paths
        const updatedProduct = await Properties.findByIdAndUpdate(
            propertyId,
            { ...req.body, image: imagePaths },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Properties not found" });
        }

        res.json({
            status: 200,
            message: "Properties Updated Successfully",
            data: updatedProduct,
        });
    } catch (error) {
        console.error("Error in updating property:", error);
        res.status(500).json({ message: "Server error", error });
    }
};


exports.createProperties = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let imagePaths = [];

  if (req.files && req.files.image) {
    req.files.image.forEach(file => {
      const originalName = file.originalname;
      const uploadedName = file.filename;
      const ext = originalName.split(".").pop();
      const newPath = "uploads/" + uploadedName + "." + ext;

      fs.renameSync("uploads/" + uploadedName, newPath);
      imagePaths.push(newPath);
    });
  }

  try {
    const userId = req.body.userId; // make sure this is passed in req.body

    // 1. Check how many properties this user already has
    const existingCount = await Properties.countDocuments({ userId });

    // 2. Enforce limit
    if (existingCount >= 5) {
      return res.status(403).json({
        status: 403,
        message: "You can only create up to 5 properties."
      });
    }

    // 3. Proceed with creation
    req.body.image = imagePaths;

    let raw_Property_Suitable_For = req.body.Property_Suitable_For;
    let raw_Type_of_Water_Supply = req.body.Type_of_Water_Supply;
try {
  // Step 1: Decode HTML entities
  raw = he.decode(raw_Property_Suitable_For); // turns &quot; into "

  // Step 2: Parse JSON string
  const parsed = JSON.parse(raw); // now parses into ["hotel", "bank"]

  // Step 3: Assign cleaned data
  req.body.Property_Suitable_For = Array.isArray(parsed) ? parsed : [];
} catch (err) {
  console.log("Failed to decode/parse Property_Suitable_For:", err.message);
  req.body.Property_Suitable_For = [];
}
try {
  // Step 1: Decode HTML entities
  raw = he.decode(raw_Type_of_Water_Supply); // turns &quot; into "

  // Step 2: Parse JSON string
  const parsed = JSON.parse(raw); // now parses into ["hotel", "bank"]

  // Step 3: Assign cleaned data
  req.body.Type_of_Water_Supply = Array.isArray(parsed) ? parsed : [];
} catch (err) {
  console.log("Failed to decode/parse Type_of_Water_Supply:", err.message);
  req.body.Type_of_Water_Supply = [];
}
    const newProduct = new Properties(req.body);
    const savedProduct = await newProduct.save();
    
    try {
      if (typeof savedProduct.property_belongsTo === 'string') {
        savedProduct.property_belongsTo = he.decode(savedProduct.property_belongsTo);
      }
    } catch (e) {
      savedProduct.property_belongsTo = [];
    }
    

    res.status(200).json({ status: 200, data: savedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
