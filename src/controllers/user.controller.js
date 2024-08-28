import { asyncHandler } from "../utils/asyncHander.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary_service.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refereshToken = user.generateRefreshToken()

        user.refreshToken = refereshToken
        await user.save({ validateBeforeSave: false}) //.save() only not used as it required all parameter of model
        return {accessToken, refereshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


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

// login users
const loginUser = asyncHandler(async (req, res) =>{
        //1. request body se apna data le aayo(req body -> data)
        //2. login access through username or email
        // 3. find the  user
        // 4. password check
        // 5. access and refress toke if user exist or password right
        // 6. send cookie

        //1. request body se apna data le aayo(req body -> data)
        const {email, username, password} = req.body
        // console.log(email)
        // console.log(password)

        //2. login access through username or email
        if(!username && !email) {
            throw new ApiError(400, "username or password is required")
        }

        // 3. find the  user throgh email or username
        const user = await User.findOne({
            $or: [{username}, {email}]
        })

        if(!user){
            throw new ApiError(404, "User does not exist")
        }

        // 4. password check
        const isPasswordValid = await user.isPasswordCorrect(password)

        if(!isPasswordValid){
            throw new ApiError(401, "Invalid user credentials")
        }

        // 5. access and refress toke if user exist or password right
        const {accessToken, refereshToken} = await generateAccessAndRefereshTokens(user._id)

         // 6. send cookie

         const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
        //  while sending cookies we first need to design options(Object) for cookies 
        const options = {
            //httpOnly: true and secure: true means its only modify by sever not by any frontend
            httpOnly: true, 
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refereshToken, options)
        .json(
            new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refereshToken
            },
            "User logged In Success"
            )
        ) 
})

//Logout User

const logoutUser = asyncHandler(async(req, res) => {
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //this remove the field from document
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refereshToken || req.body.refereshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.ACCESS_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
     if(!user){
         throw new ApiError(401, "Invalid refresh token")
     }
 
     if(incomingRefreshToken != user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
     const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    
   }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}//it will return update information
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

//Files update
const updateUserAvatar = asyncHandler(async(req, res) => {
     const avatarLocalPath = req.file?.path

     if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
     }
     const avatar =  await uploadOnCloudinary(avatarLocalPath)

     if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
     }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            set: avatar.url
        },
        {new: true}
     ).select("-password")

     return res
     .status(200)
     .json(
        new ApiResponse(200, user,"Avatar image updated successfully")
     )
})

//cover image file controller update
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on cover image")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            coverImage: coverImage.url
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


export {
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}