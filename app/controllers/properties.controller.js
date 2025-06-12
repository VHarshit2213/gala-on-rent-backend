const { check, validationResult } = require("express-validator");
const Properties = require("../models/Properties");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');

exports.getAllProducts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  res.header("Access-Control-Allow-Origin", "*");

  try {
    const limit = process.env.PAGE_LIMIT;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Fetch paginated products
    const products = await Properties.find(filter)
      // .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No Products found" });
    }

    // Fetch and map reviews
    const productIds = products.map(p => p._id);
    const allReviews = await Review.find({ product_id: { $in: productIds } });

    const reviewMap = {};
    allReviews.forEach(review => {
      const pid = review.product_id.toString();
      if (!reviewMap[pid]) reviewMap[pid] = [];
      reviewMap[pid].push(parseFloat(review.star));
    });

    const enrichedProducts = products.map(product => {
      const reviews = reviewMap[product._id.toString()] || [];
      const totalStars = reviews.reduce((sum, star) => sum + star, 0);
      const averageRating = reviews.length ? (totalStars / reviews.length).toFixed(1) : 0;
      return {
        ...product.toObject(),
        rating: Number(averageRating),
        reviews: reviews.length
      };
    });

    const totalProducts = await Properties.countDocuments(filter);

    res.json({
      status: 200,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalItems: totalProducts,
      data: enrichedProducts
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// exports.getProductsByCategory = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = process.env.PAGE_LIMIT;
//     const filter = { availableCustomise: true };

//     // Cursor-based pagination using createdAt
//     if (page > 1) {
//       const previousProducts = await Properties.find(filter)
//         .sort({ createdAt: -1 })
//         .limit((page - 1) * limit);

//       const lastProduct = previousProducts[previousProducts.length - 1];
//       if (lastProduct) {
//         filter.createdAt = { $lt: lastProduct.createdAt };
//       }
//     }

//     // Fetch products with pagination filter
//     let products = await Properties.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(limit);

//     if (products.length === 0) {
//       return res.status(404).json({ message: "No Products found" });
//     }

//     // Get reviews for all products
//     const productIds = products.map(product => product._id);
//     const allReviews = await Review.find({ product_id: { $in: productIds } });

//     // Create a map for reviews
//     const reviewMap = {};
//     allReviews.forEach(review => {
//       const productId = review.product_id.toString();
//       if (!reviewMap[productId]) {
//         reviewMap[productId] = [];
//       }
//       reviewMap[productId].push(parseFloat(review.star));
//     });

//     // Enrich products with rating and review count
//     const enrichedProducts = products.map(product => {
//       const reviews = reviewMap[product._id.toString()] || [];
//       const totalStars = reviews.reduce((sum, star) => sum + star, 0);
//       const averageRating = reviews.length ? (totalStars / reviews.length).toFixed(1) : 0;

//       return {
//         ...product.toObject(),
//         rating: Number(averageRating),
//         reviews: reviews.length
//       };
//     });

//     // Group by category
//     const groupedByCategory = {};
//     enrichedProducts.forEach(product => {
//       const category = product.category || "Uncategorized";
//       if (!groupedByCategory[category]) {
//         groupedByCategory[category] = [];
//       }
//       groupedByCategory[category].push(product);
//     });

//     const totalProducts = await Properties.countDocuments({ availableCustomise: true });

//     // Send response
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

  
exports.getProductsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const filter = { availableCustomise: true };

    // Cursor-based pagination
    if (page > 1) {
      const previousProducts = await Properties.find(filter)
        .sort({ createdAt: -1 })
        .limit((page - 1) * limit);

      const lastProduct = previousProducts[previousProducts.length - 1];
      if (lastProduct) {
        filter.createdAt = { $lt: lastProduct.createdAt };
      }
    }

    // Fetch products with pagination
    let products = await Properties.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    if (products.length === 0) {
      return res.status(404).json({ message: "No Products found" });
    }

    // Reviews
    const productIds = products.map(product => product._id);
    const allReviews = await Review.find({ product_id: { $in: productIds } });

    const reviewMap = {};
    allReviews.forEach(review => {
      const productId = review.product_id.toString();
      if (!reviewMap[productId]) {
        reviewMap[productId] = [];
      }
      reviewMap[productId].push(parseFloat(review.star));
    });

    const enrichedProducts = products.map(product => {
      const reviews = reviewMap[product._id.toString()] || [];
      const totalStars = reviews.reduce((sum, star) => sum + star, 0);
      const averageRating = reviews.length ? (totalStars / reviews.length).toFixed(1) : 0;

      return {
        ...product.toObject(),
        rating: Number(averageRating),
        reviews: reviews.length
      };
    });

    // Group products by category
    const groupedByCategory = {};
    enrichedProducts.forEach(product => {
      const category = product.category || "Uncategorized";
      if (!groupedByCategory[category]) {
        groupedByCategory[category] = [];
      }
      groupedByCategory[category].push(product);
    });

    // ✅ Fetch background items from BackgroundGlass collection
    const backgrounds = await Background.find().lean();
    groupedByCategory["background"] = backgrounds;

    const totalProducts = await Properties.countDocuments({ availableCustomise: true });

    res.json({
      status: 200,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalItems: totalProducts,
      data: groupedByCategory
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  res.header("Access-Control-Allow-Origin", "*");

  try {
    const productId = req.params.productId;
    const product = await Properties.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Properties not found" });
    }

    // Fetch reviews for the product
    const reviews = await Review.find({ product_id: productId });

    // Calculate total count and average rating
    const totalReviews = reviews.length;
    const totalStars = reviews.reduce((sum, review) => sum + parseFloat(review.star), 0);
    const averageRating = totalReviews ? (totalStars / totalReviews).toFixed(1) : 0;

    res.json({
      status: 200,
      data: {
        ...product.toObject(),
        rating: Number(averageRating),
        reviews: totalReviews,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


exports.deleteProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.header("Access-Control-Allow-Origin", "*");
    try {
        const productId = req.params.productId;
        const deletedProduct = await Properties.findByIdAndDelete(productId);

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

exports.editProduct = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    res.header("Access-Control-Allow-Origin", "*");
    try {
        const productId = req.params.productId;

        // Fetch the current product to check its existing images
        const product = await Properties.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Properties not found" });
        }

        // Initialize the array to hold updated image paths
        let imagePaths = [...product.image];  // Copy the existing images array

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

        // Update the product with the new image paths
        const updatedProduct = await Properties.findByIdAndUpdate(
            productId,
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
        console.error("Error in updating product:", error);
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

    // 1. Check how many products this user already has
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
    const newProduct = new Properties(req.body);
    const savedProduct = await newProduct.save();

    res.status(200).json({ status: 200, data: savedProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// exports.createCustomProduct = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   let imagePaths = [];

//   try {
//         const { user_id, quantity } = req.body;
//     // Check if base64 image is sent
//     if (req.body.screenshot && req.body.screenshot.startsWith('data:image')) {
//       const matches = req.body.screenshot.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

//       if (!matches || matches.length !== 3) {
//         return res.status(400).json({ message: 'Invalid base64 image format' });
//       }

//       const ext = matches[1]; // e.g., png, jpg
//       const base64Data = matches[2];
//       const randomName = uuidv4(); // mimic uploadedName
//       const fileName = `${randomName}.${ext}`;
//       // const uploadDir = path.join(__dirname, '../uploads');
//       // const uploadPath = path.join(uploadDir, fileName);
// const uploadDir = path.resolve(__dirname, '../uploads');
// const uploadPath = path.resolve(uploadDir, fileName);

//       // Ensure uploads/ folder exists
//       if (!fs.existsSync(uploadDir)) {
//         fs.mkdirSync(uploadDir);
//       }

//       // Save image
//       fs.writeFileSync(uploadPath, Buffer.from(base64Data, 'base64'));

//       // Store path like your original code
//       imagePaths.push(`uploads/${fileName}`);
//     }

//     // Set image field like your original logic
//     req.body.image = imagePaths;
//     req.body.name = req.body.tank_name;
//     req.body.measurements = req.body.dimensions;
//     req.body.new_price = req.body.TotalPrice;

//     const newProduct = new Properties(req.body);
//     const savedProduct = await newProduct.save();

//        // Add product to cart
//     const qty = parseInt(quantity || 1);
//     let userCart = await Cart.findOne({ user_id });

//     if (!userCart) {
//       const newCart = new Cart({
//         user_id,
//         products: [{ product_id: savedProduct._id, quantity: qty, is_active: true }]
//       });
//       const savedCart = await newCart.save();

//       return res.status(200).json({
//         message: "Custom product created and added to cart",
//         status: 200,
//         product: savedProduct,
//         cart: savedCart,
//       });
//     }

//     const existingProductIndex = userCart.products.findIndex(
//       (item) => item.product_id.toString() === savedProduct._id.toString()
//     );

//     if (existingProductIndex !== -1) {
//       userCart.products[existingProductIndex].quantity += qty;
//     } else {
//       userCart.products.push({ product_id: savedProduct._id, quantity: qty, is_active: true });
//     }

//     userCart.updated_at = new Date();
//     const updatedCart = await userCart.save();

//     return res.status(200).json({
//       message: "Custom product created and added to existing cart",
//       status: 200,
//       product: savedProduct,
//       cart: updatedCart,
//     });
//   } catch (error) {
//     console.error("Custom Properties Error:", error);
//     res.status(500).json({ message: "Server error", error });
//   }
// };


exports.createCustomProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let imagePaths = [];

  try {
    const { user_id, quantity } = req.body;

    // Handle base64 screenshot image
    if (req.body.screenshot && req.body.screenshot.startsWith('data:image')) {
      const matches = req.body.screenshot.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        return res.status(400).json({ message: 'Invalid base64 image format' });
      }

      const ext = matches[1]; // png, jpg, etc.
      const base64Data = matches[2];
      const randomName = uuidv4();
      const fileName = `${randomName}.${ext}`;
      const uploadDir = path.resolve(__dirname, '../../uploads');
      const uploadPath = path.resolve(uploadDir, fileName);

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      try {
        fs.writeFileSync(uploadPath, Buffer.from(base64Data, 'base64'));
        console.log("Image saved at:", uploadPath);
        imagePaths.push(`uploads/${fileName}`);
      } catch (err) {
        console.error("Error writing image:", err);
        return res.status(500).json({ message: 'Failed to save image', error: err });
      }
    }

    // Prepare product data
    req.body.image = imagePaths;
    req.body.name = req.body.tank_name;
    req.body.measurements = req.body.dimensions;
    req.body.new_price = req.body.TotalPrice;

    // Save product
    const newProduct = new Properties(req.body);
    const savedProduct = await newProduct.save();

    // Add product to user's cart
    const qty = parseInt(quantity || 1);
    let userCart = await Cart.findOne({ user_id });

    if (!userCart) {
      const newCart = new Cart({
        user_id,
        products: [{ product_id: savedProduct._id, quantity: qty, is_active: true }]
      });
      const savedCart = await newCart.save();

      return res.status(200).json({
        message: "Custom product created and added to cart",
        status: 200,
        product: savedProduct,
        cart: savedCart
      });
    }

    const existingProductIndex = userCart.products.findIndex(
      item => item.product_id.toString() === savedProduct._id.toString()
    );

    if (existingProductIndex !== -1) {
      userCart.products[existingProductIndex].quantity += qty;
    } else {
      userCart.products.push({ product_id: savedProduct._id, quantity: qty, is_active: true });
    }

    userCart.updated_at = new Date();
    const updatedCart = await userCart.save();

    return res.status(200).json({
      message: "Custom product created and added to existing cart",
      status: 200,
      product: savedProduct,
      cart: updatedCart
    });
  } catch (error) {
    console.error("Custom Properties Error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
