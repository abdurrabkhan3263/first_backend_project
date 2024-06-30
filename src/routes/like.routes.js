import { Router } from "express";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
} from "../controller/like.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/video/:videoId").post(toggleVideoLike);

router.route("/comment/:commentId").post(toggleCommentLike);

router.route("/tweet/:tweetId").post(toggleTweetLike);

router.route("/video").get(getLikedVideos);

export default router;
