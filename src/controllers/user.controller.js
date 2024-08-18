import { asyncHandler } from "../utils/asyncHander.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary_service.js"
import { ApiResponse } from "../utils/ApiResponse.js";


//creating methods
const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "We are learnig backend with chai and code"
    // })

    //steps to register a user
    //get user details from frontend
    //validation -(not empty)
    //check if user already exits: isername, email
    //check for images, check for avatar
    // upload them cloudinary, avatar
    // create user object- create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    //Extracting data from body
    const { fullName, email, username, password } = req.body
    console.log("FullName: ", fullName);
    console.log("email: ", email);
    console.log("username: ", username);
    console.log("req.body: ", req.body)


    //we can use if condition for validation for all but we can use single if
    // if(fullName === ""){
    //     throw new ApiError(400, "full name is required")
    // }

    //validation -(not empty)
    //checking if someone send empty
    if(
        [fullName, email, username, password].some((field) => 
        field?.trim() === "")
    ){
        throw new ApiError(400, "All field are required")
    }

    //checking if already user exist with username or email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new ApiError(400, "User with email or username already exist")
    } 

//check for images, check for avatar
    //file handling from multer
    const avatarLocalPath = req.files?.avatar[0]?.path; //this on server not on cloudinary
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //check if cover image come or not
    /*let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImage = req.files.coverImage[0].path
    }*/


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object- create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",//agar cover image hai to sahi nhi to empty kyuki ye maine check nhi kia ki cover image aaya hai ya nhi
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //ye do field select hokar nhi aayge
    )

    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res (ApiResponse)
    return res.status(200).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )





})

export {
    registerUser, 
}