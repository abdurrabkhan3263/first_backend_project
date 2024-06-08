import { Router } from "express";
import { registerUser } from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

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

export default router;

// upload is the middleware
// upload.fields  iss se ham multiple file ko get kar sakte hai
// upload.fileds --> accept a array and inside the array we create object jitna bhi file hamein chahiye
// upload.fields([{name:"avatar" --> filename kise naam se janna hai , maxCount:1 --> kitni file accept karna hai}, {}]);
