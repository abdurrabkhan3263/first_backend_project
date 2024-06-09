import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/user.model.js"; // if can be direct contact with the database bcz is the made by mongoose
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1 get user Details from frontend
  // 2 validation - not empty
  // 3 check if user already exits :: username , email
  // check from images , check for avatar is is required
  // if there upload them to cloudinay , avatar
  // if all thing is done then make a object --> create entry in the db
  // if create then response to the frontend && remove password && refresh token from response
  // check for user creation is successfully
  // return res
  // step 1
  // get userDetails from frontend
  // req.body --> all the data from body means form , json aise data res.body mein aate hain
  const { username, email, fullName, password } = req.body;
  // step 2 validation
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Required");
  }
  const existedUser = await User.findOne({ $or: [{ username }, { email }] }); // using {$or:[{},{}]} --> we can find many value
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }
  // req.files --> req.body KA ACCESS EXPRESS DETA HAI WAISE HI --> req.files KA ACCESS MULTER JO KI MIDDLEWARE HAI WOH DETA HAI
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path ?? "";
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].length > 0){
    coverImageLocalPath = req.file.coverImage[0].path
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is Required");
  }
  const avatar = await uploadOnCloundinary(avatarLocalPath);
  const coverImage = await uploadOnCloundinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avatar File is Required");
  }
  // entry on the database
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // this method is used to find the user using by his id , by default all values are selected and using "-password -refreshToken" we can get the all value expect password,refreshToken
  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered Successfully"));
});
export { registerUser };
