import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";

// ! unlike video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Extract the videoId from the request parameters

    // Check if the videoId is a valid ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId"); // Throw a 400 error if the videoId is invalid
    }

    // Check if the video is already liked by the current user
    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    // If the video is already liked, remove the like
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "unlike video successfully")); // Return a success response for unliking the video
    }

    // If the video is not liked yet, create a new like
    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    // Return a success response for liking the video
    return res
        .status(200)
        .json(new ApiResponse(200, "liked video successfully"));
});

// ! unlike comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Extract the commentId from the request parameters

    // Check if the commentId is a valid ObjectId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId"); // Throw a 400 error if the commentId is invalid
    }

    // Check if the comment is already liked by the current user
    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    // If the comment is already liked, remove the like
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "unlike comment successfully")); // Return a success response for unliking the comment
    }

    // If the comment is not liked yet, create a new like
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    // Return a success response for liking the comment
    return res
        .status(200)
        .json(new ApiResponse(200, "liked comment successfully"));
});

// ! unlike tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params; // Extract the tweetId from the request parameters

    // Check if the tweetId is a valid ObjectId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId"); // Throw a 400 error if the tweetId is invalid
    }

    // Check if the tweet is already liked by the current user
    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    // If the tweet is already liked, remove the like
    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "unlike tweet successfully")); // Return a success response for unliking the tweet
    }

    // If the tweet is not liked yet, create a new like
    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    // Return a success response for liking the tweet
    return res
        .status(200)
        .json(new ApiResponse(200, "liked tweet successfully"));
});

// ! get likes Videos
const getLikedVideos = asyncHandler(async (req, res) => {
    // Aggregate pipeline to find liked videos
    const likedVideosAggegate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id), // Match likes by the current user
            },
        },
        {
            $lookup: {
                from: "videos", // Lookup the liked videos from the 'videos' collection
                localField: "video", // The field in 'Like' collection that refers to the video
                foreignField: "_id", // The field in 'videos' collection that refers to the video
                as: "likedVideo", // The alias for the joined data
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // Lookup the video owners from the 'users' collection
                            localField: "owner", // The field in 'videos' collection that refers to the user
                            foreignField: "_id", // The field in 'users' collection that refers to the user
                            as: "ownerDetails", // The alias for the joined data
                        },
                    },
                    {
                        $unwind: "$ownerDetails", // Unwind the owner details to deconstruct the array
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo", // Unwind the liked videos to deconstruct the array
        },
        {
            $sort: {
                createdAt: -1, // Sort the liked videos by creation date in descending order
            },
        },
        {
            $project: {
                _id: 0, // Exclude the root _id field from the result
                likedVideo: {
                    _id: 1, // Include the video _id
                    "videoFile.url": 1, // Include the video file URL
                    "thumbnail.url": 1, // Include the thumbnail URL
                    owner: 1, // Include the owner reference
                    title: 1, // Include the video title
                    description: 1, // Include the video description
                    views: 1, // Include the view count
                    duration: 1, // Include the video duration
                    createdAt: 1, // Include the creation date
                    isPublished: 1, // Include the publish status
                    ownerDetails: {
                        username: 1, // Include the owner's username
                        fullName: 1, // Include the owner's full name
                        "avatar.url": 1, // Include the owner's avatar URL
                    },
                },
            },
        },
    ]);

    // Return the response with the liked videos
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideosAggegate,
                "liked videos fetched successfully"
            )
        );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
