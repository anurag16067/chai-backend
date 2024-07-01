import { asyncHandler } from "../utils/asyncHander.js";

//creating methods
const registerUser = asyncHandler( async (req, res) => {
    res.status(200).json({
        message: "We are learnig backend with chai and code"
    })
})

export {
    registerUser,
}