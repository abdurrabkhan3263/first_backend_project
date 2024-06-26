import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../modules/user.model.js"; // if can be direct contact with the database bcz is the made by mongoose
import {
  deleteOnCloudinary,
  uploadOnCloundinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
  console.log("COVER IMAGE ::     ", req.files?.coverImage);
  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
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
    avatar: { avatar_url: avatar?.url, public_id: avatar?.public_id },
    coverImage:
      (coverImage?.url && {
        avatar_url: coverImage.url,
        public_id: avatar.public_id,
      }) ||
      "",
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
      $unset: { refreshToken: 1 },
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
    req.cookies.refreshToken || req.body.refreshToken;

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

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          { user, accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, "Invalid old Password");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Password Change SuccessFully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Current User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) throw new ApiError(400, "All Fields are Required");
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // const avatarLocalPath = req.files?.avatar[0]?.path. files tab lagayenge to ek se jeyada file ko upload karna ho aur wahan per bhi ham array mein se files le kar aa rahe the
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar is Missing");

  const avatar = await uploadOnCloundinary(avatarLocalPath);

  if (!avatar.url) throw new ApiError(500, "Error while uploading on avatar");
  const avatarDeleteFile = (await User.findById(req.user?._id))?.avatar;
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: { avatar_url: avatar?.url, public_id: avatar?.public_id },
      },
    },
    { new: true }
  ).select("-password");

  if (avatarDeleteFile?.public_id.trim()) {
    await deleteOnCloudinary(avatarDeleteFile?.public_id, "image");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, user, "Avatar is Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) throw new ApiError(400, "CoverImage is Missing");
  const coverImage = await uploadOnCloundinary(coverImageLocalPath);
  if (!coverImage.url)
    throw new ApiError(
      401,
      "Something Went wrong while uploading the cover image"
    );
  const userDetails = await User.findById(req.user?.id);
  const oldCoverImage = userDetails?.coverImage;
  if (oldCoverImage && oldCoverImage?.public_id.trim()) {
    await deleteOnCloudinary(oldCoverImage?.public_id, "image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          coverImage_url: coverImage?.url,
          public_id: coverImage?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Updated SuccessFully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "username is missing");
  const channel = await User.aggregate([
    {
      $match: {
        // ham User mein se username ko match kar rahe hain apne username se
        username: username?.toLowerCase(),
      },
    },
    // HERE ONLY ONE DOCUMENT IS THERE AND THE BELOW CODE TO SEE LIKE WE ADD ON THE ONE DOCUMENT
    {
      $lookup: {
        // Insert Value
        from: "subscriptions",
        localField: "_id", // In the match section we get the _id from that document
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    // * WE ALWAYS HAVE TO ADD THE FIELDS FOR BOTH JOINED VALUE IF NOT DATA IS NOT SHOWING
    {
      $addFields: {
        // use to add the additional field on the match section user
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"],
            } /* $in :[issKoDekho , "issMeinSe"] Hai Ya Phir Nahi */,
            then: true, // if IF CONDITION IS TRUE then We Use THEN
            else: false, //if IF CONDITION IS FALSE then we Use ELSE
          },
        },
      },
    },
    {
      $project: {
        // that that data we what to return --> jise return karna hai uss 1 to wahi data jayega
        fullName: 1,
        username: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) throw new ApiError(404, "Channel does not Exists");
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Channel fetched Successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const id = req.user?._id;
  if (!id) throw new ApiError(400, "Username is Missing");
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id), // HERE WE CAN NOT DIRECTLY SEND THE ID BECAUSE WE NEED OBJECTID(ID) --> BUT WHEN WE USE MONGOOSE BEHIND THE SENSE IT CONVERT INTO THIS TYPE
      },
    },
    {
      $lookup: {
        // also we can directly add the array which inside the array have id
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //HERE WE HAVE BUNCH OF DOCUMENT OF VIDEO --> BUT WE DOES NOT HAVING OWNER ID SO WE NEED ONE MORE PIPE LINE TO GET THE USER
        pipeline: [
          // HERE WE ADD ADDITIONAL PIPELINE THROUGH THIS CAN ADD ADD MORE THAN ONE PIPELINE
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              //HERE WE HAVE THE VALUE OF USER SO IF WE ADD THE  PIPELINE HERE SO ONLY EFFECT ON users
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        watchHistory[0].watchHistory,
        "Watch History Fetch Successfully"
      )
    );
});

const getCertainData = asyncHandler(async (req, res) => {
  const user = req?.user._id;
  if (!user) throw new ApiError(401, "user is not authorize to do this");
  const data = await User.findById(user, { fullName: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, data, "Fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  getCertainData,
};
