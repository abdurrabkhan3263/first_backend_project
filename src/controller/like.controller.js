import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../modules/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video id");

  const likeDocs = await Like.findOne({ likedBy: userId, video: videoId });

  if (likeDocs) {
    await Like.findByIdAndDelete(likeDocs?._id);
  } else {
    await Like.create({ likedBy: userId, video: videoId });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        `${likeDocs ? "Unlike successfully" : "Like successfully"}`
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid comment id");

  const likeDocs = await Like.findOne({ likedBy: userId, comment: commentId });

  if (likeDocs) {
    await Like.findByIdAndDelete(likeDocs?._id);
  } else {
    await Like.create({ likedBy: userId, comment: commentId });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        `${likeDocs ? "Unlike successfully" : "Like successfully"}`
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id");

  const likeDocs = await Like.findOne({ likedBy: userId, tweet: tweetId });

  if (likeDocs) {
    await Like.findByIdAndDelete(likeDocs?._id);
  } else {
    await Like.create({ likedBy: userId, tweet: tweetId });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "",
        `${likeDocs ? "Unlike successfully" : "Like successfully"}`
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req?.user._id;

  const listLikedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
          {
            $project: {
              title: 1,
              videoFile: 1,
              thumbnail: 1,
              duration: 1,
              views: 1,
              owner: 1,
              videoFile: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, listLikedVideos, "Like videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
