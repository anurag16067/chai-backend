import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"

import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

// http://localhost:8000/users/register
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
// http://localhost:8000/users/login
// router.route("/login").post(login)

export default router