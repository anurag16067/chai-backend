// require('dotenv').config({path: './env'})
import dotenv from "dotenv"

import mongoose, { connect } from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})







connectDB()








/*
//1 approch to connect database
import express from "express"
const app = express()
// approch to connect database 
// 1 approch define function and then call
// function connectDB(){}
// connectDB()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listtening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error);
        throw error

    }
})
    */