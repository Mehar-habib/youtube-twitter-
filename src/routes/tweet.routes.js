import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT, upload.none());
router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(updateTweet);

export default router;
