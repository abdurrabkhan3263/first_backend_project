// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({ path: "./env" });

connectDB();

// HAM AAISA BHI KAR SAKTE HAIN
// HAM ALAG SE EK FILE LE IN THE DB AUR WAHAN SE IMPORT KAR LENGE INDEX.JS KE ANDER

/*
import express from "express";
const app = express();
(async () => {
  try {
    const response = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    app.on("error", (error) => {
      console.error("Errr: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is Listening on port on ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error Database Connect ", error);
  }
})();
*/
