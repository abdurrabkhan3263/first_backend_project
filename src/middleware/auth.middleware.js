import { User } from "../modules/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized Request");
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid Access Token");
    req.user = user; // ONCE ALL WORK IS DONE OF THE MIDDLEWARE THAN YOU CAN ADD IN THE OBJECT OF REQ.USER
    // SO NEXT() KO CALL KAR DENGE TO ABE REQ KE PASS HOGA USER KA ACCESS
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid Access Token");
  }
});
