import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true

}))

//accepting data from different ways like from url,json etc
app.use(express.json({limit: "16kb"})) //take data when you fiil form
//handing data which come from url
app.use(express.urlencoded({extended: true, limit: "16kb"}))
//creating public asset 
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'

//routes declaration
app.use("/api/v1/users", userRouter)
// http://localhost:8000/api/users/register

export { app }