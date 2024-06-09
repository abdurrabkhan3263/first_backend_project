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
          type: mongoose.Schema.Types.ObjectId,
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
  this.password = await bcrypt.hash(this.password, 10); // bcrypt.hash(what to encrypt,number of round)
  next();
}); // userSchema.pre("eventName",callback this we want to use this so we does not use arrow function)
// if our work is done so we always call next which means flag pass another

userSchema.methods.isPasswordCorrect = async function (password) {
  // WE CAN ADD OUR OWN METHOD USING schemaName --> schema.methods
  return await bcrypt.compare(password, this.password); // we can compare the user enter password and the database password using BCRYPT.COMPARE
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id, // jwt ke ander database ki sari value ki access hai in THIS
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);
