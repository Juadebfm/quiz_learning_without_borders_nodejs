import express from "express";
import morgan from "morgan";
import cors from "cors";
import { config } from "dotenv";
import router from "./router/route.js";

const app = express();

app.use(morgan("tiny"));

app.use(cors());
app.use(express.json());
config();

//
app.use("/api", router);

const port = process.env.PORT || 8081;

app.listen(port, () => {
  console.log(`Server Connected To http://localhost:${port}`);
});
