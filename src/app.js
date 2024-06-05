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

export { app };
