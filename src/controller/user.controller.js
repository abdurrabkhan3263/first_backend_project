import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/user.model.js"; // if can be direct contact with the database bcz is the made by mongoose
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // --> save method is used to save the data in the mongodb database --> jo kuch bhi ham ne change kiya hai
    // --> while saving the data MONGOOSE METHOD WILL KICK IN WHICH MEAN --> jo ham se password ko require kiya hai uss ke liye error aayega bole ga password is require iss ke liye ham use karte hai ye user.save({validateBeforeSave:false})

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const options = {
  httpsOnly: true,
  secure: true,
};

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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].length > 0
  ) {
    coverImageLocalPath = req.file.coverImage[0].path;
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

const loginUser = asyncHandler(async (req, res) => {
  // req-body --> data
  // email/username && pass is there or not if not throw error
  // find the user
  // if not throw erorr
  // password check throw error --> else access and refresh token
  // then send cookie
  const { username, email, password } = await req.body;
  // if (!password) throw new ApiError(400, "Password is Required");

  if (!(username || email))
    throw new ApiError(400, "User or Email is Required");

  const isUserExist = await User.findOne({ $or: [{ username }, { email }] });

  if (!isUserExist) throw new ApiError(404, "User Does Not Exist");

  const isPasswordCorrect = await isUserExist.isPasswordCorrect(password); // User ke pass isPasswordCorrect Nahi Hoga Jo User Hamne Banaya Hai Uss ke Ander Hoga Hamara User

  if (!isPasswordCorrect) throw new ApiError(401, "Invalid user credentials");
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    isUserExist._id
  );
  const loggedInUser = await User.findById(isUserExist._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // through cookie parser     WE WILL BE ABLE TO ADD THE COOKIE
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In SuccessFully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user._id; // this is done in the middleware --> kyunki next() call karne se pahle  ham ne daal diya tha
  await User.findByIdAndUpdate(
    user,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true, // ISS SE JAB HEMIN RETURN MEIN VALUE MILEGI WOH UPDATED WALI HOGI AGER  HAMNE ISS KO KISE VARIBLE MEIN DAALTE HAI AUR CONSOLE KARATE HAIN TO
    }
  );
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "", "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookie.refreshAccessToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user) throw new ApiError(401, "Invalid Refresh Token");

    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, "Refresh Token is Used or Expired");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
