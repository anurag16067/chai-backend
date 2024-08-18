import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        //mongoose will return a javascript object we can store in variable

         // Construct the full MongoDB URI
         const uri = process.env.MONGODB_URI;
        
         console.log(`Connecting to MongoDB with URI: ${uri}`);
 
         // Connection option
         
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection FAILED", error);
        process.exit(1)
    }
}
//NOTE: When async function is completed then it will retur a promise


export default connectDB