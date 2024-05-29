import dotenv from "dotenv";
import connectToDB from "./db/dbConnect.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectToDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`🛞 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => console.log("🛞 MONGODB connection failed: ", error));
