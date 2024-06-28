import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const limit = "16kb";

// if you want to add middleware & configuration ( use ---> app.use() )

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// express.json ---> means json accept is accepted in this app and inside the we add limit only add json in 16kb
app.use(express.json({ limit: limit }));
// express.urlencoded ---> urlencoded encoded the code value into some especial symbol or anything else like space can covert into %20
// -----> extended is used to send the value into nested object like object into object or also we can set the limit
app.use(express.urlencoded({ extended: true, limit: limit }));
//  express.static ---> anything is get like pdf,png and we want to store in or server for this we use this and also add in the public folder
app.use(express.static("public"));
// cookieParse ---> it is used to set the cookie in the user brower like perform crude operation
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscription from "./routes/subscription.routes.js";

// routes declaration
// app.get        YAHAN PER HAM GET KO NAHI USE KARENGE BECAUSE HAM ROUTES KO ALAGA SE IMPORT KARA RAHE HAIN YAHAN per ROUTER KO LANE KE LIYE HAMEIN MIDDLEWARE KO LANA JARURI HAI
// ISS KE LIYE HAM app.use ko use karenge app.use()
app.use("/api/v1/users", userRouter);
// ⏫ abe route kuch iss tarah se hoga https://localhost:8000/api/v1/users/register
// iss se fayda ye hua ki ager hamein /users/register && /users/login to hamein baar baar likhna nahi hoga route mein ham /register laga denge

// Video Section

app.use("/api/v1/video", videoRouter);

app.use("/api/v1/tweet", tweetRouter);

app.use("/api/v1/channel", subscription);

export { app };
