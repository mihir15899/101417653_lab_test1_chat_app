const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Ensure correct import

const router = express.Router();

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    try {
        console.log("📩 Received Request Body:", req.body); // 🐛 Debugging log

        const { username, firstname, lastname, password } = req.body;

        // ✅ Validate request body
        if (!username || !firstname || !lastname || !password) {
            console.log("❌ Missing fields in request:", req.body);
            return res.status(400).json({ message: "All fields are required." });
        }

        // ✅ Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken. Choose another." });
        }

        // ✅ Hash password securely
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Create and save new user
        const newUser = new User({
            username,
            firstname,
            lastname,
            password: hashedPassword,
            created_on: new Date() // Automatically adds timestamp
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("❌ Error in Signup:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
    try {
        console.log("📩 Received Login Request:", req.body); // 🐛 Debugging log

        const { username, password } = req.body;

        // ✅ Validate request body
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required." });
        }

        // ✅ Find user in database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // ✅ Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // ✅ Generate JWT token
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ token, username });

    } catch (error) {
        console.error("❌ Error in Login:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
