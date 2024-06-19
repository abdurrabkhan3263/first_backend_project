import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloundinary } from "../utils/cloudinary.js";
import { Video } from "../modules/video.model.js";

const videoUpload = asyncHandler(async (req, res) => {
  // we have to check if user logged-in or not --> verifyJWT
  //req.files is file is there or not i not throw error video is required
  // then check thumbnail , title , is there or not it is required and description is not required
  const { title, description, isPublished } = req.body;
  if (!title.trim()) throw new ApiError(400, "Title is Required");
  const videoFile = req.files["video"]?.path;
  const thumbnailFile = req.files["thumbnail"]?.path;
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
    videoFile: cloudinaryVideoUpload,
    thumbnail: cloudinaryThumbnailUpload,
    duration: cloudinaryVideoUpload?.duration,
    owner: req.user?._id,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video is Uploaded Successfully"));
});

export { videoUpload };
