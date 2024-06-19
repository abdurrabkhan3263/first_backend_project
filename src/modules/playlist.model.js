import mongoose, { Schema } from "mongoose";

const playlistSchema = Schema(
  {
    name: {
      type: String,
      required: [true, "Playlist Name is Required"],
    },
    description: {
      type: String,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
