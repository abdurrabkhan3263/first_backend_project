import { Tweet } from "../modules/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteOnCloudinary,
  uploadOnCloundinary,
} from "../utils/cloudinary.js";
import fs from "fs";
import { isValidObjectId } from "mongoose";

function removeUnwantedImages(images) {
  images &&
    images.forEach((data) => {
      fs.unlinkSync(data?.path);
    });
}

const createTweet = asyncHandler(async (req, res) => {
  const { tweet } = req.body;
  const image = req.files["images"];
  if (!image && !tweet) throw new ApiError(400, "Tweet or Image is required");

  const uploadImages =
    image &&
    (await Promise.all(
      image.map(async (imageData) => {
        const response = await uploadOnCloundinary(imageData?.path);
        return { url: response?.url, public_id: response.public_id };
      })
    ));
  if (!uploadImages && image)
    throw new ApiError(500, "Something went wrong while uploading the image");
  const uploadTweet = await Tweet.create({
    owner: req?.user._id,
    content: tweet || "",
    images: uploadImages,
  });
  return res
    .status(200)
    .json(new ApiResponse(201, uploadTweet, "Tweet created successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Id is required");

  const tweetData = await Tweet.findOne({ _id: id, owner: req?.user._id });
  if (!tweetData) throw new ApiError(401, "Unauthorize to do this");

  tweetData.images.length > 0 &&
    (await Promise.all(
      tweetData.images.map(async (imageData) => {
        return await deleteOnCloudinary(imageData?.public_id, "image");
      })
    ));

  await Tweet.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, "", "tweet deleted successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { images } = req.files;
  const { tweet } = req.body;

  if (!isValidObjectId(id)) {
    removeUnwantedImages(images);
    throw new ApiError(400, "Tweet id is required or invalid id");
  }

  if (!(tweet || images))
    throw new ApiError(400, "Image or tweet are required");

  const tweetData = await Tweet.findOne({ _id: id, owner: req?.user._id });
  const imageCount = tweetData?.images.length;

  if (!tweetData) {
    removeUnwantedImages(images);
    throw new ApiError(401, "Tweet not Found");
  }

  if (images && imageCount + images.length > 4) {
    removeUnwantedImages(images);
    throw new ApiError(
      400,
      "Max Limit Accessed: You have permission to add only four images."
    );
  }

  const uploadImage = images
    ? await Promise.all(
        images.map(async (imageData) => {
          const response = await uploadOnCloundinary(imageData?.path);
          return { url: response?.url, public_id: response?.public_id };
        })
      )
    : undefined;

  const updatedTweet = await Tweet.findByIdAndUpdate(
    { _id: id },
    {
      content: tweet && tweet,
      $push: { images: uploadImage && { $each: uploadImage } },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet is update successfully"));
});

const deleteTweetImage = asyncHandler(async (req, res) => {
  const { tweetId, imageId } = req.body;

  const userId = req?.user._id;

  if (!isValidObjectId(tweetId))
    throw new ApiError(400, "Correct id is required");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId, owner: userId },
    { $pull: { images: { public_id: imageId } } },
    { new: true }
  );

  await deleteOnCloudinary(imageId, "image");

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedTweet, "tweet image deleted successfully")
    );
});

const gettingAllTweet = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const tweets = await Tweet.aggregate([
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
              username: 1,
              coverImage: 1,
              email: 1,
              subscriber: 1,
            },
          },
        ],
      },
    },
    // {
    //   $match: { "owner.subscriber": _id },
    // },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Fetched all tweets"));
});

export {
  createTweet,
  deleteTweet,
  updateTweet,
  gettingAllTweet,
  deleteTweetImage,
};
