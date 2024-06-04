import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstace = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`\n MongoDb connected !! DB HOST: ${connectionInstace}`);
  } catch (error) {
    console.error("MONGODB CONNECT ERROR:- ", error);
    process.exit(1); // this app in running on the process in the process that current running process ref is there on the process
    // process.exit take code [ 1:-  means overload exit , 0:-  ]
  }
};

export default connectDB;
