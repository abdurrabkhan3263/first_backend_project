import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const checkHealth = asyncHandler(async (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "Db Connected" : "db Disconnected";

  const healthCheck = {
    dbStatus,
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    hrtime: process.hrtime(),
  };

  try {
    if (dbStatus === "db Disconnected") {
      throw new Error("Database is disconnected");
    }

    healthCheck.serverStatus = `Server is running on port no ${process.env.PORT}`;
    return res
      .status(200)
      .json(new ApiResponse(200, healthCheck, "Health Check Successful"));
  } catch (error) {
    healthCheck.error = error.message;
    return res
      .status(500)
      .json(new ApiResponse(500, healthCheck, "Health Check Failed"));
  }
});

export default checkHealth;
