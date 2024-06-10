import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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

export default router;

// upload is the middleware
// upload.fields  iss se ham multiple file ko get kar sakte hai
// upload.fileds --> accept a array and inside the array we create object jitna bhi file hamein chahiye
// upload.fields([{name:"avatar" --> filename kise naam se janna hai , maxCount:1 --> kitni file accept karna hai}, {}]);
