import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../modules/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../modules/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req?.user._id;

  if (!name.trim()) throw new ApiError(400, "Playlist name is require");

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id ");
  const playlistOwner = await User.findById(userId);
  if (!playlistOwner) throw new ApiError(400, "Invalid user Id");

  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "playlist_owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        playlist_owner: {
          $arrayElemAt: ["$playlist_owner", 0],
        },
        videosCount: {
          $size: "$videos",
        },
      },
    },
    {
      $unset: "owner",
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist data fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist id");

  const hasPlaylist = await Playlist.findById(playlistId);
  if (!hasPlaylist) throw new ApiError(400, "Playlist is not found");

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
                  },
                },
              ],
            },
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              views: 1,
              duration: 1,
              owner: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        playlistOwner: {
          $first: "$owner",
        },
      },
    },
    {
      $unset: "owner",
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "data fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req?.user._id;

  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId)))
    throw new ApiError(400, "Invalid Playlist and video Id");

  const owner = await Playlist.findOne({ _id: playlistId, owner: userId });
  if (!owner)
    throw new ApiError(401, "Unauthorize to add video into the playlist");

  let updatedPlaylist;
  if (owner.videos.some((item) => item.toString() === videoId.toString())) {
    updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: videoId },
      },
      { new: true }
    );
  } else {
    updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: videoId },
      },
      { new: true }
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "video pushed successfully on the playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req?.user._id;

  if (!(isValidObjectId(playlistId) && isValidObjectId(videoId)))
    throw new ApiError(400, "Playlist and Video Id is require");

  const owner = await Playlist.findOne({ _id: playlistId, owner: userId });
  if (!owner)
    throw new ApiError(
      401,
      "Unauthorize to delete the video from the playlist"
    );

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req?.user._id;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlist id");

  const owner = await Playlist.findOne({ _id: playlistId, owner: userId });
  if (!owner) throw new ApiError(401, "Unauthorize to delete the playlist");

  await Playlist.deleteOne({ _id: playlistId, owner: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req?.user._id;
  console.log(req.body);

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Playlist id is require");

  if (!(name.trim() || description.trim()))
    throw new ApiError(400, "Name or Description is require");

  const owner = await Playlist.findOne({ _id: playlistId, owner: userId });
  if (!owner) throw new ApiError(401, "Unauthorize to update the playlist");

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name: name.trim() || undefined,
      description: description.trim() || undefined,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successful"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
