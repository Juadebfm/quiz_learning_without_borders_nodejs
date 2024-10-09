import { Router } from "express";
import * as controller from "../controllers/controller.js";
import { validateQuestion, validateResult } from "../middleware/validate.js";

const router = Router();

router
  .route("/questions")
  .get(controller.getQuestions)
  .post(validateQuestion, controller.insertQuestions);

router.route("/questions/list").get(controller.listAllQuestions);

router.route("/questions/:id").delete(controller.deleteQuestions);

router.get("/questions/search", controller.searchQuestions);

router
  .route("/result")
  .get(controller.getResults)
  .post(validateResult, controller.storeResults);

router.route("/result/:id").delete(controller.deleteResults);

export default router;
