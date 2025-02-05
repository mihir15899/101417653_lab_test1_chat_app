const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    password: { type: String, required: true },
    created_on: { type: Date, default: Date.now }
});

// ✅ Ensure unique usernames
UserSchema.path("username").validate(async (username) => {
    const count = await mongoose.models.User.countDocuments({ username });
    return count === 0;
}, "Username already exists.");

module.exports = mongoose.model("User", UserSchema);
