// require("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.listen( 8000, () => {
      console.log(`Server is Running on Port ${process.env.PORT}`);
    });
    app.on("error", (error) => {
      console.error("ERROR :: ", error);
    });
  })
  .catch((error) => {
    console.log("MONGODB :: CONNECTION FAILED :: ", error);
  });

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