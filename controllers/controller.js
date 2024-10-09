import Questions from "../models/question.schema.js";
import Results from "../models/result.schema.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { formatResponse } from "../utils/responseFormatter.js";

// Get All Questions
export async function getQuestions(req, res, next) {
  try {
    const questions = await Questions.find();
    formatResponse(res, 200, "Questions retrieved successfully", questions);
  } catch (error) {
    next(error);
  }
}

// List All Questions In The Database
export async function listAllQuestions(req, res, next) {
  try {
    const questions = await Questions.find().select(
      "question answers correctAnswerIndex channel course lecture topic"
    );

    const structuredQuestions = questions.map((q) => ({
      question: q.question,
      correctAnswer: q.answers[q.correctAnswerIndex],
      channel: q.channel,
      course: q.course,
      lecture: q.lecture,
      topic: q.topic,
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

// New function to search questions with filters
export async function searchQuestions(req, res, next) {
  try {
    const { channel, course, lecture, topic } = req.query;

    // Build the filter object based on provided query parameters
    const filter = {};
    if (channel) filter.channel = channel;
    if (course) filter.course = course;
    if (lecture) filter.lecture = lecture;
    if (topic) filter.topic = topic;

    const questions = await Questions.find(filter).select(
      "question answers correctAnswerIndex channel course lecture topic"
    );

    const structuredQuestions = questions.map((q) => ({
      question: q.question,
      correctAnswer: q.answers[q.correctAnswerIndex],
      channel: q.channel,
      course: q.course,
      lecture: q.lecture,
      topic: q.topic,
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
  try {
    const question = await Questions.create(req.body);
    formatResponse(res, 201, "Question added successfully", question);
  } catch (error) {
    next(error);
  }
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

// Store Result
export async function storeResults(req, res, next) {
  try {
    const { username, result, attempts } = req.body;
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

    // Check if result already exists for this user
    const existingResult = await Results.findOne({
      username,
      totalQuestions: questions.length,
    });
    if (existingResult) {
      return formatResponse(res, 409, "Result for this user already exists.");
    }

    // Transform the result array and calculate passed questions
    let passedQuestions = 0;
    const transformedResult = result.map((selectedAnswer, index) => {
      const correct = selectedAnswer === questions[index].correctAnswerIndex;
      if (correct) passedQuestions++;
      return {
        questionId: questions[index]._id,
        selectedAnswer,
        correct,
      };
    });

    // Calculate percentage score
    const percentageScore = (passedQuestions / questions.length) * 100;

    // Determine achieved status
    const achieved = percentageScore >= 70 ? "passed" : "failed";

    // Approximate percentageScore to the nearest integer for points
    const points = Math.round(percentageScore);

    // Create new result object
    const newResult = new Results({
      userId: hashedUserId,
      username,
      result: transformedResult,
      attempts,
      points,
      achieved,
      passedQuestions,
      totalQuestions: questions.length,
      percentageScore,
    });

    const savedResult = await newResult.save();
    formatResponse(res, 201, "Result saved successfully", {
      savedResult,
      userId,
      passedQuestions,
      totalQuestions: questions.length,
      percentageScore,
      achieved,
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
