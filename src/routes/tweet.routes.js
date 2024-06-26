import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  deleteTweetImage,
  gettingAllTweet,
  updateTweet,
} from "../controller/tweet.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router
  .route("/create-tweet")
  .post(
    verifyJWT,
    upload.fields([{ name: "images", maxCount: 4 }]),
    createTweet
  );

router.route("/delete-tweet/:id").delete(verifyJWT, deleteTweet);

router
  .route("/update-tweet/:id")
  .patch(
    verifyJWT,
    upload.fields([{ name: "images", maxCount: 4 }]),
    updateTweet
  );

router.route("/getting-tweet").get(verifyJWT, gettingAllTweet);

router.route("/delete-tweet-images").patch(verifyJWT, deleteTweetImage);

export default router;
