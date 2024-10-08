import { Router } from "express";
import * as controller from "../controllers/controller.js";
import { validateQuestion, validateResult } from "../middleware/validate.js";

const router = Router();

router
  .route("/questions")
  .get(controller.getQuestions)
  .post(validateQuestion, controller.insertQuestions);

router.route("/questions/:id").delete(controller.deleteQuestions);

router
  .route("/result")
  .get(controller.getResults)
  .post(validateResult, controller.storeResults);

router.route("/result/:id").delete(controller.deleteResults);

export default router;
