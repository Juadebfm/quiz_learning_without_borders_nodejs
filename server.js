import express from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "dotenv";
import router from "./router/route.js";

import connect from "./database/conn.js";

const app = express();

app.use(morgan("tiny"));

app.use(cors());
app.use(express.json());
config();

//
app.use("/api", router);

const port = process.env.PORT || 8081;

connect()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log(`Server Connected To http://localhost:${port}`);
      });
    } catch (error) {
      console.log(error, "Error Encountered");
    }
  })
  .catch((error) => {
    console.log("Invalid Database Connection");
  });
