import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../modules/video.model.js";
import { User } from "../modules/user.model.js";
import { Subscription } from "../modules/subscription.model.js";
import { Like } from "../modules/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid channel id");

  const channelStats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    // all videos
    {
      // get the all videos from the Video model
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          // get the likes from videos from Like model
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "videoLikes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "totalComments",
            },
          },
        ],
      },
    },
    // all subscriber
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    // all subscribed to
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    // all tweets
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "tweet",
              as: "tweetLikes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "tweet",
              as: "tweetComments",
            },
          },
        ],
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        fullName: 1,
        totalViews: { $sum: "$videos.views" },
        totalComments: {
          $sum: ["$videos.totalComments", "$tweets.tweetComments"],
        },
        totalVideos: { $size: "$videos" },
        totalSubscriber: { $size: "$subscriber" },
        totalSubscribedTo: { $size: "$subscribedTo" },
        totalTweets: { $size: "$tweets" },
        totalLikes: {
          videoLikes: { $size: "$videos.videoLikes" },
          tweetLikes: { $size: "$tweets.tweetLikes" },
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelStats,
        "Channel stats data fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid channel id");

  const channelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
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
              avatar: "$avatar.avatar_url",
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
        duration: 1,
        thumbnail: "$thumbnail.url",
        videoFile: "$videoFile.url",
        views: 1,
        owner: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelVideos,
        "Channel all videos fetched successfully"
      )
    );
});

export { getChannelStats, getChannelVideos };
