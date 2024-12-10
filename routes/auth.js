// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // Register
// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     const newUser = new User({ username, email, password: hashedPassword });
//     const saveUser = await newUser.save();
//     res.status(200).json(saveUser);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// // LOGIN
// router.post("/login", async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(404).json("user not found");
//     }
//     const match = await bcrypt.compare(req.body.password, user.password);
//     if (!match) {
//       return res.status(401).json("Wrong Credentials");
//     }
//     const token = jwt.sign(
//       { _id: user._id, username: user.username, email: user.email },
//       process.env.SECRET,
//       {
//         expiresIn: "3d",
//       }
//     );
//     const { password, ...info } = user._doc;
//     res.cookie("token", token).status(200).json(info);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// // LOGOUT
// router.get("/logout", async (req, res) => {
//   try {
//     res
//       .clearCookie("token", { sameSite: "none", secure: true })
//       .status(200)
//       .send("User logged out successfully ");
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// // REFETCH USER
// router.get("/refetch", async (req, res) => {
//   const token = req.cookies.token;
//   jwt.verify(token, process.env.SECRET, {}, async (err, data) => {
//     if (err) {
//       return res.status(404).json(err);
//     }
//     return res.status(200).json(data);
//   });
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    const savedUser = await newUser.save();

    res.status(201).json(savedUser); // User created successfully
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email },
      process.env.SECRET,
      {
        expiresIn: "3d",
      }
    );

    // Remove the password field from the user document before sending it back
    const { password: _, ...userData } = user._doc;

    // Set token in cookie
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json(userData);
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// Logout
router.get("/logout", (req, res) => {
  try {
    res
      .clearCookie("token", {
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .send("User logged out successfully.");
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error logging out. Please try again later." });
  }
});

// Refetch User
router.get("/refetch", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided. Please login again." });
  }

  jwt.verify(token, process.env.SECRET, {}, (err, data) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    return res.status(200).json(data);
  });
});

module.exports = router;
