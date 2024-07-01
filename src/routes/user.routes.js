import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"

const router = Router()

// http://localhost:8000/users/register
router.route("/register").post(registerUser)
// http://localhost:8000/users/login
// router.route("/login").post(login)

export default router