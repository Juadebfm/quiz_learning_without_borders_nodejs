import { Router } from "express";
const router = Router();

import * as controller from "../controllers/controller.js";

// Questions Route
router
  .route("/questions")
  .get(controller.getQuestions)
  .post(controller.insertQuestions);

router.route("/questions/:id").delete(controller.deleteQuestions);

router
  .route("/result")
  .get(controller.getResults)
  .post(controller.storeResults);

router.route("/result/:id").delete(controller.deleteResults);
export default router;
