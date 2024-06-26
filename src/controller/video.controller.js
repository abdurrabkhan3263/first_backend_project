import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../modules/video.model.js";
import { User } from "../modules/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  uploadOnCloundinary,
} from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  if (!title.trim()) throw new ApiError(400, "Title is Required");
  console.log(req.files["thumbnail"]);
  const videoFile = req.files["video"][0]?.path;
  const thumbnailFile = req.files["thumbnail"][0]?.path;

  if (!thumbnailFile) throw new ApiError(400, "Thumbnail is Required");
  if (!videoFile) throw new ApiError(400, "Video File is Required");

  const cloudinaryVideoUpload = await uploadOnCloundinary(videoFile);
  const cloudinaryThumbnailUpload = await uploadOnCloundinary(thumbnailFile);
  if (!cloudinaryThumbnailUpload?.url.trim())
    throw new ApiError(
      500,
      "Something went wrong while uploading the thumbnail"
    );
  if (!cloudinaryVideoUpload?.url.trim())
    throw new ApiError(500, "Something went wrong while uploading the video");

  const video = await Video.create({
    title,
    description: description || "",
    isPublished: isPublished || true,
    videoFile: {
      url: cloudinaryVideoUpload?.url,
      public_id: cloudinaryVideoUpload?.public_id,
    },
    thumbnail: {
      url: cloudinaryThumbnailUpload?.url,
      public_id: cloudinaryThumbnailUpload?.public_id,
    },
    duration: cloudinaryVideoUpload?.duration,
    owner: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video is Published Successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    userId,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!isValidObjectId(req?.user?._id)) throw new ApiError(401, "Invalid User");

  const matchCondition = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  };

  if (userId) {
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  } else {
    matchCondition.isPublished = true;
  }

  const sortDirection = sortType === "desc" ? -1 : 1;

  const videosAggregation = Video.aggregate([
    {
      $match: matchCondition,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              coverImage: 1,
              avatar: 1,
              username: 1,
              email: 1,
            },
          },
        ],
      },
    },
    {
      $sort: { [sortBy]: sortDirection }, // Issue 1: Corrected sort usage
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  Video.aggregatePaginate(videosAggregation, options)
    .then((result) => {
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Video Fetched Success"));
    })
    .catch((error) => {
      throw new ApiError(500, `Something went wrong ${error.message}`);
    });
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");
  const videoFile = await Video.findById(videoId);
  if (!videoFile) throw new ApiError(400, "Video is not found");

  // increase view count by 1
  const currentUser = await User.findById(req?.user._id, { watchHistory: 1 });
  if (!currentUser.watchHistory.includes(videoId)) {
    await Video.findByIdAndUpdate(videoId, {
      $inc: {
        views: 1,
      },
    });
  }
  // set the watchHistory of the current user that watch the video
  await User.findByIdAndUpdate(req?.user._id, {
    $addToSet: { watchHistory: videoId },
  });

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
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
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video Fetched Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;
  const { videoId } = req.params;
  const id = req?.user._id;
  const oldVideoData = await Video.findOne({ _id: videoId, owner: id });
  if (!oldVideoData)
    throw new ApiError(400, "Invalid Video Id or User credentials");
  if (!(title || description || thumbnailLocalPath))
    throw new ApiError(400, "title or description or thumbnail are Required");
  let uploadThumbnail = await uploadOnCloundinary(thumbnailLocalPath);
  if (!uploadThumbnail && thumbnailLocalPath)
    throw new ApiError(
      500,
      "Something went wrong while uploading the thumbnail"
    );
  if (uploadThumbnail) {
    uploadThumbnail = {
      url: uploadThumbnail?.url,
      public_id: uploadThumbnail?.public_id,
    };
  }
  try {
    const video = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: { title, description, thumbnail: uploadThumbnail },
      },
      { new: true }
    );
    const { thumbnail: { public_id } = "" } = oldVideoData;
    if (public_id && video?.thumbnail.public_id !== public_id)
      await deleteOnCloudinary(public_id, "image");
    return res
      .status(201)
      .json(new ApiResponse(201, video, "video is updated Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something Went Wrong While Updating the Video"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId))
    throw new ApiError(400, "Invalid Video Id");
  const user = req?.user._id;
  const video = await Video.findOne({ _id: videoId, owner: user });
  if (!video) throw new ApiError(401, "Unauthorized User");
  const deletedRes = await Video.findByIdAndDelete(videoId);
  const {
    videoFile: { public_id } = "",
    thumbnail: { public_id: image_public_id } = "",
  } = video;
  await deleteOnCloudinary(public_id, "video");
  await deleteOnCloudinary(image_public_id, "image");
  return res
    .status(200)
    .json(new ApiResponse(200, "", "Video Deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video id is not valid");
  const user = req?.user?._id;
  const isAuthorizeUser = await Video.findOne({ _id: videoId, owner: user });
  if (!isAuthorizeUser)
    throw new ApiError(401, "User is not authorize to do this");
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { isPublished: !isAuthorizeUser?.isPublished },
    },
    { new: true, select: "isPublished" }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

export {
  publishAVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
