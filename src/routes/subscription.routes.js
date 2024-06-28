import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getAllChannels,
} from "../controller/subscription.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.route("/toggle-subscription/:id").post(verifyJWT, toggleSubscription);

router
  .route("/get-channel-subscribers/:id")
  .get(verifyJWT, getUserChannelSubscribers);

router
  .route("/get-subscribed-channels/:id")
  .get(verifyJWT, getSubscribedChannels);

router.route("/get-all-channels").get(verifyJWT, getAllChannels);

export default router;
