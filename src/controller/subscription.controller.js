import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../modules/user.model.js";
import { Subscription } from "../modules/subscription.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  const { id: userId } = req?.user;

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "channel id is required");

  const findUser = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  let response = findUser
    ? await Subscription.deleteOne({ channel: channelId, subscriber: userId })
    : await Subscription.create({
        subscriber: userId,
        channel: channelId,
      });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        response,
        findUser ? "Unsubscribed successfully" : "Subscribe successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { id: channelId } = req.params;
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "channel id must required");

  const response = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              coverImage: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $arrayElemAt: ["$subscriber", 0],
        },
      },
    },
  ]);

  const subscriberList = response.map((items) => items.subscriber);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberList,
        "channel subscribers list fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { id: subscriberId } = req.params;
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "subscriber id is must required");

  const response = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              coverImage: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribedTo: {
          $first: "$channel",
        },
      },
    },
  ]);

  const channelSubscribedTo = response.map((items) => items.subscribedTo);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribedTo,
        "subscribed channels list fetch successfully"
      )
    );
});

const getAllChannels = asyncHandler(async (req, res) => {
  const allChannel = await User.find(
    {},
    { fullName: 1, coverImage: 1, username: 1 }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, allChannel, "getting all channel"));
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getAllChannels,
};
