import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
      trim: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Define a pre-save hook for the userSchema
userSchema.pre("save", async function (next) {
  // Check if the password field has been modified
  if (!this.isModified("password")) {
    // If not modified, skip the hashing and move to the next middleware
    return next();
  }
  // If the password has been modified, hash it using bcrypt
  this.password = await bcrypt.hash(this.password, 10);

  // Call the next middleware or complete the save operation
  next();
});

export const User = mongoose.model("User", userSchema);
