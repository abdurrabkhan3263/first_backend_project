import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
// jaise yahan per router.route("/login").post(loginUser)

router.route("/login").post(loginUser);

// Secured Routes

router.route("/logout").post(verifyJWT, logoutUser); // FOR THIS KIND OF SITUATION WE ARE GOING TO ADD NEXT() BCZ ROUTER GOING TO CONFUSE --> AGER KAAM HUA TO NEXT PER CHALE JAO MEANS LOGOUTUSER --> THROW ERROR LIKH HI HOGA

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails); // only single or two user update so we have to use patch not post
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile); // when you try to get the data from params you have to user :andName also you have to use exact name to inside the {username} = req.params
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;

// upload is the middleware
// upload.fields  iss se ham multiple file ko get kar sakte hai
// upload.fileds --> accept a array and inside the array we create object jitna bhi file hamein chahiye
// upload.fields([{name:"avatar" --> filename kise naam se janna hai , maxCount:1 --> kitni file accept karna hai}, {}]);
