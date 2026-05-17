const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const sendMail = require("../utils/mailer.js").sendMail;
const {
  registrationEmailTemplate,
  sellerRegistrationEmailTemplate,
} = require("../utils/emailTemplates.js");

const STATE_CODES = {
  gujarat: "GJ",
};

function isSeller(userType) {
  return String(userType || "").toLowerCase() === "seller";
}

function getStateCode(state) {
  const normalizedState = String(state || "").trim().toLowerCase();
  if (STATE_CODES[normalizedState]) {
    return STATE_CODES[normalizedState];
  }

  return String(state || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
}

function getCityCode(city) {
  return String(city || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

function generateSellerCode({ state, city }) {
  const prefix = `${getStateCode(state)}${getCityCode(city)}` || "GJSELLER";
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${randomDigits}`;
}

async function generateUniqueSellerCode(user) {
  let sellerCode;

  do {
    sellerCode = generateSellerCode(user);
  } while (await User.exists({ uniqueCode: sellerCode }));

  return sellerCode;
}

exports.Signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  res.header("Access-Control-Allow-Origin", "*");
  User.findOne({ phone_number: req.body.phone_number }).then(async (user) => {
    if (user) {
      res.json({
        message: "this Phone_number is Already used",
        status: 400,
      });
    } else {
      const user = new User(
        req.body
      );
      user.phone_number = req.body.phone_number

      try {
        if (isSeller(user.user_type)) {
          user.uniqueCode = await generateUniqueSellerCode(user);
        }

        const savedUsers = await user.save();
        const isSellerUser = isSeller(savedUsers.user_type);

        await sendMail({
          to: savedUsers.email, 
          subject: isSellerUser ? "Your Gala On Rent Seller Code" : "Welcome to Gala On Rent",
          html: isSellerUser
            ? sellerRegistrationEmailTemplate(savedUsers.person_name || "Seller", savedUsers.uniqueCode)
            : registrationEmailTemplate(savedUsers.person_name || "User"),
        });
        res.json({
          message: "User Created Successfully",
          status: 200,
          data: savedUsers,
          token: jwt.sign({ id: savedUsers._id }, "dont_be_oversmart"),
        });
      } catch (err) {
        console.log(err);
        res.json({ message: err, status: 400 });
      }
    }
  });
};

exports.Signin = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  try {
    const { person_name, password } = req.body;
    console.log({ person_name, password })

    // Find user by phone number
    const user = await User.findOne({ $or: [{ person_name: person_name }, { user_name: person_name }, { email: person_name }] });

    console.log(user);
    if (!user) {
      return res.json({
        message: "User not found",
        status: 400,
      });
    }

    // Check if provided OTP matches the one in DB
    if (!password || password !== user.password) {
      return res.json({
        message: "Invalid password",
        status: 400,
      });
    }

    // Success: return token and user data
    return res.json({
      message: "User logged in successfully",
      status: 200,
      token: jwt.sign({ id: user._id }, "dont_be_oversmart"),
      data: user,
    });

  } catch (err) {
    console.error(err);
    return res.json({
      message: "Server error",
      status: 500,
    });
  }
};


exports.Edituser = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    const userId = req.params.userId;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      req.body, // Updated data from request body
      { new: true, runValidators: true } // Return updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from request params
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.params.userId; // Get user ID from request params
    const user = await User.findById(userId).lean(); // Convert Mongoose document to plain object

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the password field
    delete user.password;

    res.json({
      status: 200,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = process.env.PAGE_LIMIT;
    const filter = {};

    if (page > 1) {
      // Find previous users to get last _id for cursor pagination
      const previousUsers = await User.find()
        .sort({ _id: -1 })
        .limit((page - 1) * limit);

      const lastUser = previousUsers[previousUsers.length - 1];
      if (lastUser) {
        filter._id = { $lt: lastUser._id };
      }
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ _id: -1 })
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    const totalUsers = await User.countDocuments();

    res.json({
      status: 200,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalItems: totalUsers,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAllAgentUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(process.env.PAGE_LIMIT) || 10;

    // Base filter for agents
    const filter = { Property_belongsto: "I Am Agent" };

    // Optional city filter
    if (req.query.city) {
      filter.city = req.query.city;
    }

    if (page > 1) {
      const previousUsers = await User.find(filter)
        .sort({ _id: -1 })
        .limit((page - 1) * limit);

      const lastUser = previousUsers[previousUsers.length - 1];
      if (lastUser) {
        filter._id = { $lt: lastUser._id };
      }
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ _id: -1 })
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No agent users found" });
    }

    const totalUsers = await User.countDocuments(filter);

    res.json({
      status: 200,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalItems: totalUsers,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

