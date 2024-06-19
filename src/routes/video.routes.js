import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { videoUpload } from "../controller/video.controller.js";

const router = Router();

router.route("/upload").post(
  verifyJWT,
  upload.fields(
    [
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ],
    videoUpload
  )
);

export default router;
