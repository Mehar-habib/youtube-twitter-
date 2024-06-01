import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// ! get all comments for video
const getVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Extract the videoId from the request parameters
    const { page = 1, limit = 10 } = req.query; // Extract the page and limit from the query parameters, with default values

    // Find the video by its ID
    const video = await Video.findById(videoId);
    if (!video) {
        // If the video is not found, throw a 404 error
        throw new ApiError(404, "Video not found");
    }

    // Aggregate the comments related to the video
    const commentsAggregate = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId), // Match comments to the video ID
            },
        },
        {
            $lookup: {
                from: "users", // Join with the users collection
                localField: "owner", // Match owner field in comments with _id field in users
                foreignField: "_id",
                as: "owner", // Alias the result as owner
            },
        },
        {
            $lookup: {
                from: "likes", // Join with the likes collection
                localField: "_id", // Match comment _id with the comment field in likes
                foreignField: "comment",
                as: "likes", // Alias the result as likes
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes", // Add a field likesCount with the size of the likes array
                },
                owner: {
                    $first: "$owner", // Add a field owner with the first element of the owner array
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] }, // Check if the current user's ID is in the likedBy array
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                content: 1, // Include the content field
                createdAt: 1, // Include the createdAt field
                likesCount: 1, // Include the likesCount field
                owner: {
                    username: 1, // Include the username field of the owner
                    fullName: 1, // Include the fullName field of the owner
                    "avatar.url": 1, // Include the avatar URL of the owner
                },
                isLiked: 1, // Include the isLiked field
            },
        },
    ]);

    // Define pagination options
    const options = {
        page: parseInt(page, 10), // Parse the page number as an integer
        limit: parseInt(limit, 10), // Parse the limit number as an integer
    };

    // Paginate the aggregated comments
    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    // Send the response with a success message and the paginated comments
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// ! get a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params; // Extract the videoId from the request parameters
    const { content } = req.body; // Extract the content from the request body

    // Check if the content is provided
    if (!content) {
        throw new ApiError(400, "content is required"); // Throw a 400 error if content is missing
    }

    // Find the video by its ID
    const video = await Video.findById(videoId);
    if (!video) {
        // If the video is not found, throw a 404 error
        throw new ApiError(404, "video not found");
    }

    // Create a new comment with the provided content, video ID, and owner ID
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    // Check if the comment creation was successful
    if (!comment) {
        // If comment creation failed, throw a 500 error
        throw new ApiError(500, "something went wrong");
    }

    // Send the response with a success message and the created comment
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "comment created successfully"));
});

// ! update Comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Extract the commentId from the request parameters
    const { content } = req.body; // Extract the content from the request body

    // Check if the content is provided
    if (!content) {
        throw new ApiError(400, "Content is required"); // Throw a 400 error if content is missing
    }

    // Find the comment by its ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        // If the comment is not found, throw a 400 error
        throw new ApiError(400, "Comment is required");
    }

    // Check if the current user is the owner of the comment
    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only comment owner can edit their comment"); // Throw a 400 error if the user is not the owner
    }

    // Update the comment with the new content
    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content,
            },
        },
        { new: true } // Return the updated comment
    );

    // Check if the comment update was successful
    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment, please try again"); // Throw a 500 error if the update failed
    }

    // Send the response with a success message and the updated comment
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment edited successfully!!"
            )
        );
});

// ! delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params; // Extract the commentId from the request parameters

    // Find the comment by its ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        // If the comment is not found, throw a 404 error
        throw new ApiError(404, "Comment not found");
    }

    // Check if the current user is the owner of the comment
    if (comment?.owner.toString() !== req.user?._id.toString()) {
        // If the user is not the owner, throw a 400 error
        throw new ApiError(400, "Only comment owner can delete their comment");
    }

    // Delete the comment by its ID
    await Comment.findByIdAndDelete(commentId);

    // Send the response with a success message
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComment, addComment, updateComment, deleteComment };
