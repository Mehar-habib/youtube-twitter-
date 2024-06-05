import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

// ! create Tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body; // Extract content from the request body

    if (!content) {
        throw new ApiError(400, "Content is required"); // Throw a 400 error if content is missing
    }

    // Create a new tweet with the provided content and the current user's ID
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet"); // Throw a 500 error if tweet creation fails
    }

    // Return the created tweet with a success message
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

//! update Tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body; // Extract content from the request body
    const { tweetId } = req.params; // Extract tweetId from the request parameters

    if (!content) {
        throw new ApiError(400, "Content is required"); // Throw a 400 error if content is missing
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id"); // Throw a 400 error if tweetId is invalid
    }

    // Find the tweet by its ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found"); // Throw a 404 error if the tweet is not found
    }

    // Check if the current user is the owner of the tweet
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only owner can update tweet"); // Throw a 401 error if the user is not the owner
    }

    // Update the tweet content and return the new tweet
    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    );
    if (!newTweet) {
        throw new ApiError(500, "Failed to update tweet"); // Throw a 500 error if the tweet update fails
    }

    // Return the updated tweet with a success message
    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Tweet updated successfully"));
});

// ! delete Tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params; // Extract tweetId from the request parameters

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id"); // Throw a 400 error if tweetId is invalid
    }

    // Find the tweet by its ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found"); // Throw a 404 error if the tweet is not found
    }

    // Check if the current user is the owner of the tweet
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only owner can delete tweet"); // Throw a 401 error if the user is not the owner
    }

    // Delete the tweet by its ID
    await Tweet.findByIdAndDelete(tweetId);

    // Return a success message with a status of 200
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

// ! get user Tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params; // Extract userId from the request parameters

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId"); // Throw a 400 error if userId is invalid
    }

    // Aggregate pipeline to get the tweets of the user
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId), // Match tweets for the given userId
            },
        },
        {
            $lookup: {
                from: "users", // Join with the users collection
                localField: "owner", // Field in Tweet collection
                foreignField: "_id", // Field in Users collection
                as: "ownerDetails", // Alias for joined data
                pipeline: [
                    {
                        $project: {
                            username: 1, // Include the username field
                            "avatar.url": 1, // Include the avatar URL field
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes", // Join with the likes collection
                localField: "_id", // Field in Tweet collection
                foreignField: "tweet", // Field in Likes collection
                as: "likeDetails", // Alias for joined data
                pipeline: [
                    {
                        $project: {
                            likedBy: 1, // Include the likedBy field
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails", // Count the number of likes
                },
                ownerDetails: {
                    $first: "$ownerDetails", // Get the first (and only) owner detail
                },
            },
        },
        {
            $project: {
                content: 1, // Include the content field
                ownerDetails: 1, // Include the owner details
                likesCount: 1, // Include the likes count
                createdAt: 1, // Include the createdAt field
            },
        },
    ]);

    // Return the tweets with a success message
    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };
