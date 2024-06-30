import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
  getPlaylistById,
} from "../controller/playlist.controller.js";

const router = Router();

router.use(verifyJWT); // this will add verifyJWT in the all below router

router.route("/").post(createPlaylist);

router.route("/:userId").get(getUserPlaylists);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/delete/:playlistId").delete(deletePlaylist);

router.route("/update/:playlistId").patch(updatePlaylist);

router.route("/get/:playlistId").get(getPlaylistById);

export default router;
