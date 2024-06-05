import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ! toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // Extract the channelId from the request parameters

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId"); // Throw a 400 error if the channelId is invalid
    }

    // Check if the user is already subscribed to the channel
    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id, // Current user's ID
        channel: channelId, // Channel ID
    });

    if (isSubscribed) {
        // If already subscribed, delete the subscription
        await Subscription.findByIdAndDelete(isSubscribed?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "unsubscribed successfully")); // Return a success message
    }

    // If not subscribed, create a new subscription
    await Subscription.create({
        subscriber: req.user?._id, // Current user's ID
        channel: channelId, // Channel ID
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "subscribed successfully"
            )
        ); // Return a success message with subscribed status
});

//! Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // Extract the channelId from the request parameters

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId"); // Throw a 400 error if the channelId is invalid
    }

    // Convert channelId to a mongoose ObjectId
    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    // Aggregate pipeline to get the subscribers of the channel
    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: channelObjectId, // Match subscriptions for the given channelId
            },
        },
        {
            $lookup: {
                from: "users", // Join with the users collection
                localField: "subscriber", // Field in Subscription collection
                foreignField: "_id", // Field in Users collection
                as: "subscriber", // Alias for joined data
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions", // Join with the subscriptions collection
                            localField: "_id", // Field in Users collection
                            foreignField: "channel", // Field in Subscriptions collection
                            as: "subscribedToSubscriber", // Alias for joined data
                        },
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [
                                            channelObjectId, // Check if the user is subscribed to the channel
                                            "$subscribedToSubscriber.subscriber",
                                        ],
                                    },
                                    then: true, // If true, the user is subscribed
                                    else: false, // If false, the user is not subscribed
                                },
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubscriber", // Count of subscriptions
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber", // Unwind the subscriber array
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
    ]);

    // Return the subscriber list with a success message
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscriber,
                "Subscriber list fetched successfully"
            )
        );
});

// ! controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params; // Extract the subscriberId from the request parameters

    // Aggregate pipeline to get the channels the user has subscribed to
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId), // Match subscriptions for the given subscriberId
            },
        },
        {
            $lookup: {
                from: "users", // Join with the users collection
                localField: "channel", // Field in Subscription collection
                foreignField: "_id", // Field in Users collection
                as: "channelDetails", // Alias for joined data
                pipeline: [
                    {
                        $lookup: {
                            from: "videos", // Join with the videos collection
                            localField: "_id", // Field in Users collection
                            foreignField: "owner", // Field in Videos collection
                            as: "videos", // Alias for joined data
                        },
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos", // Get the latest video of the channel
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscribedChannel", // Unwind the subscribedChannel array
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                    },
                },
            },
        },
    ]);

    // Return the subscribed channels list with a success message
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
