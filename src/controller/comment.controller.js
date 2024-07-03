import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../modules/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId))
    throw new ApiResponse(400, "Video id is not valid or not found");

  const comments = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
    {
      $project: {
        content: 1,
        video: 1,
        owner: 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  Comment.aggregatePaginate(comments, options)
    .then((result) => {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            `${result.docs.length >= 0 ? "Comment is not Found" : "Comment is fetched successfully"}`
          )
        );
    })
    .catch((error) => {
      throw new ApiError(
        500,
        `Something went wrong while fetching the comment ${error}`
      );
    });
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const { _id } = req?.user;

  if (!content) throw new ApiError(400, "Content is required");
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Video id is valid or not found");

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: _id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "comment is added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Comment id is not valid or not found");
  if (!content) throw new ApiError(400, "Content is required");

  const updatedComment = await Comment.findByIdAndUpdate(commentId, {
    content,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "comment is updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Comment id is not valid or not found");

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Comment is deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
