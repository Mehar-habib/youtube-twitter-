import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
// Create a new instance of an Express application
const app = new express();

// Set up CORS middleware with specified origin and credentials support
app.use(
    cors({
        origin: process.env.CORS_ORIGIN, // Allow CORS from the origin specified in the environment variables
        credentials: true, // Allow cookies to be sent with requests
    })
);
// Middleware to parse incoming JSON requests with a size limit of 16kb
app.use(express.json({ limit: "16kb" }));
// Middleware to parse URL-encoded data with a size limit of 16kb
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// Middleware to parse cookies from the HTTP request
app.use(cookieParser());
// Serve static files from the 'public' directory
app.use(express.static("public"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/tweet", tweetRouter);
export default app;
