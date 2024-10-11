import Questions from "../models/question.schema.js";
import Results from "../models/result.schema.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { formatResponse } from "../utils/responseFormatter.js";
import { validateQuestion, validateResult } from "../middleware/validate.js";
import mongoose from "mongoose";

// Get All Questions (with optional filtering and total count)
export async function getQuestions(req, res, next) {
  try {
    const { channel, course, topic, lessons } = req.query;

    const filter = {};
    if (channel) filter.channel = channel;
    if (course) filter.course = course;
    if (topic) filter.topic = topic;
    if (lessons) filter.lessons = lessons;

    // Get the questions based on the filter
    const questions = await Questions.find(filter);

    // Get the total count of questions (without filter)
    const totalQuestions = await Questions.countDocuments();

    // Get the count of filtered questions
    const filteredCount = questions.length;

    const response = {
      totalQuestions,
      filteredCount,
      questions,
    };

    formatResponse(res, 200, "Questions retrieved successfully", response);
  } catch (error) {
    next(error);
  }
}

// List All Questions In The Database (with optional filtering)
export async function listAllQuestions(req, res, next) {
  try {
    const { channel, course, topic, lessons } = req.query;

    const filter = {};
    if (channel) filter.channel = channel;
    if (course) filter.course = course;
    if (topic) filter.topic = topic;
    if (lessons) filter.lessons = lessons;

    const questions = await Questions.find(filter).select(
      "question answers correctAnswerIndex channel course topic lessons"
    );

    const structuredQuestions = questions.map((q) => ({
      id: q._id,
      question: q.question,
      correctAnswer: q.answers[q.correctAnswerIndex],
      channel: q.channel,
      course: q.course,
      topic: q.topic,
      lessons: q.lessons,
    }));

    const response = {
      totalQuestions: questions.length,
      questions: structuredQuestions,
    };

    formatResponse(res, 200, "All questions retrieved successfully", response);
  } catch (error) {
    next(error);
  }
}

// Get a Question by ID
export async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;

    // Check if the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return formatResponse(res, 400, "Invalid question ID format");
    }

    const question = await Questions.findById(id).select(
      "question answers correctAnswerIndex channel course topic lessons"
    );

    if (!question) {
      return formatResponse(res, 404, "Question not found");
    }

    const structuredQuestion = {
      id: question._id,
      question: question.question,
      answers: question.answers,
      correctAnswerIndex: question.correctAnswerIndex,
      channel: question.channel,
      course: question.course,
      topic: question.topic,
      lessons: question.lessons,
    };

    formatResponse(
      res,
      200,
      "Question retrieved successfully",
      structuredQuestion
    );
  } catch (error) {
    console.error("Error in getQuestionById:", error);

    if (error instanceof mongoose.Error.CastError) {
      return formatResponse(res, 400, "Invalid question ID format");
    }

    formatResponse(res, 500, "An error occurred while retrieving the question");
  }
}

// Search questions with filters
export async function searchQuestions(req, res, next) {
  try {
    const { channel, course, topic, lessons } = req.query;

    const filter = {};
    if (channel) filter.channel = channel;
    if (course) filter.course = course;
    if (topic) filter.topic = topic;
    if (lessons) filter.lessons = lessons;

    const questions = await Questions.find(filter).select(
      "question answers correctAnswerIndex channel course topic lessons"
    );

    const structuredQuestions = questions.map((q) => ({
      question: q.question,
      answers: q.answers,
      correctAnswerIndex: q.correctAnswerIndex,
      channel: q.channel,
      course: q.course,
      topic: q.topic,
      lessons: q.lessons,
    }));

    const response = {
      totalQuestions: questions.length,
      questions: structuredQuestions,
    };

    formatResponse(res, 200, "Questions retrieved successfully", response);
  } catch (error) {
    next(error);
  }
}

// Add A Question

export async function insertQuestions(req, res, next) {
  validateQuestion(req, res, async () => {
    try {
      const existingQuestion = await Questions.findOne({
        question: req.body.question,
      });

      if (existingQuestion) {
        return res.status(409).json({
          error: "This question already exists.",
        });
      }

      const question = await Questions.create(req.body);
      formatResponse(res, 201, "Question added successfully", question);
    } catch (error) {
      next(error);
    }
  });
}

// Delete A Question
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

// Delete All Questions
export async function deleteAllQuestions(req, res, next) {
  try {
    const result = await Questions.deleteMany({});

    if (result.deletedCount === 0) {
      return formatResponse(res, 404, "No questions found to delete");
    }

    formatResponse(
      res,
      200,
      `Successfully deleted ${result.deletedCount} questions`
    );
  } catch (error) {
    console.error("Error in deleteAllQuestions:", error);
    formatResponse(res, 500, "An error occurred while deleting questions");
  }
}

// Store Results
export async function storeResults(req, res, next) {
  validateResult(req, res, async () => {
    try {
      const { username, result, channel, course, topic, lessons } = req.body;

      // Check for existing attempts
      const existingAttempts = await Results.find({
        username,
        createdAt: { $gte: new Date(Date.now() - 20 * 60 * 1000) },
      });

      if (existingAttempts.length >= 3) {
        const oldestAttempt = existingAttempts[0];
        const timeElapsed = Date.now() - oldestAttempt.createdAt.getTime();
        const timeRemaining = Math.ceil((20 * 60 * 1000 - timeElapsed) / 60000);

        return formatResponse(
          res,
          429,
          `Too many attempts. Please wait ${timeRemaining} minutes before trying another quiz.`
        );
      }

      const userId = uuidv4();
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedUserId = await bcrypt.hash(userId, saltRounds);

      // Validate questionIds
      const questionIds = result.map((r) => r.questionId);
      if (!questionIds.every(mongoose.Types.ObjectId.isValid)) {
        return formatResponse(
          res,
          400,
          "Invalid questionId format. All questionIds must be valid ObjectId strings."
        );
      }

      let questionFilter = {
        _id: { $in: questionIds.map((id) => new mongoose.Types.ObjectId(id)) },
      };
      if (channel) questionFilter.channel = channel;
      if (course) questionFilter.course = course;
      if (topic) questionFilter.topic = topic;
      if (lessons) questionFilter.lessons = lessons;

      const questions = await Questions.find(questionFilter).select(
        "_id correctAnswerIndex"
      );

      if (questions.length !== result.length) {
        return formatResponse(
          res,
          400,
          "Number of answers doesn't match number of questions in this quiz"
        );
      }

      let passedQuestions = 0;
      const transformedResult = result.map((answer) => {
        const question = questions.find(
          (q) => q._id.toString() === answer.questionId
        );
        if (!question) {
          throw new Error(`Question not found for id: ${answer.questionId}`);
        }
        const correct = answer.selectedAnswer === question.correctAnswerIndex;
        if (correct) passedQuestions++;
        return {
          questionId: question._id,
          selectedAnswer: answer.selectedAnswer,
          correct,
        };
      });

      const percentageScore = (passedQuestions / questions.length) * 100;
      const achieved = percentageScore >= 70 ? "passed" : "failed";
      const points = Math.round(percentageScore);

      const newResult = new Results({
        userId: hashedUserId,
        username,
        result: transformedResult,
        attempts: existingAttempts.length + 1,
        points,
        achieved,
        passedQuestions,
        totalQuestions: questions.length,
        percentageScore,
        channel,
        course,
        topic,
        lessons,
      });

      const savedResult = await newResult.save();
      formatResponse(res, 201, "Result saved successfully", {
        savedResult,
        userId,
        passedQuestions,
        totalQuestions: questions.length,
        percentageScore,
        achieved,
        attemptsRemaining: 3 - (existingAttempts.length + 1),
      });
    } catch (error) {
      console.error("Error in storeResults:", error);
      if (error instanceof mongoose.Error.CastError) {
        return formatResponse(
          res,
          400,
          `Invalid data format: ${error.message}`
        );
      }
      if (error.message.includes("Question not found")) {
        return formatResponse(res, 404, error.message);
      }
      next(error);
    }
  });
}

// Get Results
export async function getResults(req, res, next) {
  try {
    const results = await Results.find();
    formatResponse(res, 200, "Results retrieved successfully", results);
  } catch (error) {
    next(error);
  }
}

// Delete Result
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

// Delete All Results
export async function deleteAllResults(req, res, next) {
  try {
    const result = await Results.deleteMany({});

    if (result.deletedCount === 0) {
      return formatResponse(res, 404, "No results found to delete");
    }

    formatResponse(
      res,
      200,
      `Successfully deleted ${result.deletedCount} results`
    );
  } catch (error) {
    console.error("Error in deleteAllResults:", error);
    formatResponse(res, 500, "An error occurred while deleting results");
  }
}
