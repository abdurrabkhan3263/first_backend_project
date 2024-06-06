import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // IF YOU WANT TO ENABLE THE SEARCHING FIELD YOU HAVE TO ENABLE INDEX TRUE THE MAKE MORE OPTIMIZE
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // using COLOUDINARY URL
      required: true,
    },
    coverImage: {
      type: String, // using COLOUDINARY URL
    },
    watchHistory: {
      type: [
        {
          type: mongoose.Schema.type.ObjectId,
          ref: "Video",
        },
      ],
    },
    password: {
      type: String, // challenge
      required: [true, "Password is Required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // in mongodb we have isModified field that want what value want to check as a parameter
  this.password = bcrypt.hash(this.password, 10); // bcrypt.hash(what to encrypt,number of round)
  next();
}); // userSchema.pre("eventName",callback this we want to use this so we does not use arrow function)
// if our work is done so we always call next which means flag pass another

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
