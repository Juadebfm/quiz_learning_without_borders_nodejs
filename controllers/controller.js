import Questions from "../models/question.schema.js";
import Results from "../models/result.schema.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { formatResponse } from "../utils/responseFormatter.js";

export async function getQuestions(req, res, next) {
  try {
    const questions = await Questions.find();
    formatResponse(res, 200, "Questions retrieved successfully", questions);
  } catch (error) {
    next(error);
  }
}

export async function insertQuestions(req, res, next) {
  try {
    const question = await Questions.create(req.body);
    formatResponse(res, 201, "Question added successfully", question);
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestions(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Questions.findByIdAndDelete(id);
    if (!result) {
      return formatResponse(res, 404, "Question not found");
    }
    formatResponse(res, 200, "Question deleted successfully", result);
  } catch (error) {
    next(error);
  }
}

export async function storeResults(req, res, next) {
  try {
    const { username, result, attempts, points, achieved } = req.body;
    const userId = uuidv4();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedUserId = await bcrypt.hash(userId, saltRounds);

    // Fetch all questions
    const questions = await Questions.find().select("_id correctAnswerIndex");

    if (questions.length !== result.length) {
      return formatResponse(
        res,
        400,
        "Number of answers doesn't match number of questions"
      );
    }

    // Transform the result array
    const transformedResult = result.map((selectedAnswer, index) => ({
      questionId: questions[index]._id,
      selectedAnswer,
      correct: selectedAnswer === questions[index].correctAnswerIndex,
    }));

    const newResult = new Results({
      userId: hashedUserId,
      username,
      result: transformedResult,
      attempts,
      points,
      achieved,
    });

    const savedResult = await newResult.save();
    formatResponse(res, 201, "Result saved successfully", {
      savedResult,
      userId,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResults(req, res, next) {
  try {
    const results = await Results.find();
    formatResponse(res, 200, "Results retrieved successfully", results);
  } catch (error) {
    next(error);
  }
}

export async function deleteResults(req, res, next) {
  try {
    const { id } = req.params;
    const deletedResult = await Results.findByIdAndDelete(id);
    if (!deletedResult) {
      return formatResponse(res, 404, "Result not found");
    }
    formatResponse(res, 200, "Result deleted successfully", deletedResult);
  } catch (error) {
    next(error);
  }
}
