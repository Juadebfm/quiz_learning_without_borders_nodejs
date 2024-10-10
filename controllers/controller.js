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
      id: q._id, // Include the question's ID
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

// Get a Question by ID
export async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;

    // Find the question by its ID
    const question = await Questions.findById(id).select(
      "question answers correctAnswerIndex channel course lecture topic"
    );

    // If the question is not found
    if (!question) {
      return formatResponse(res, 404, "Question not found");
    }

    // Structure the response
    const structuredQuestion = {
      id: question._id,
      question: question.question,
      correctAnswer: question.answers[question.correctAnswerIndex],
      correctAnswerIndex: question.correctAnswerIndex,
      channel: question.channel,
      course: question.course,
      lecture: question.lecture,
      topic: question.topic,
    };

    // Send the formatted response
    formatResponse(
      res,
      200,
      "Question retrieved successfully",
      structuredQuestion
    );
  } catch (error) {
    next(error);
  }
}

// Search questions with filters
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
    // Check if the question already exists
    const existingQuestion = await Questions.findOne({
      question: req.body.question,
      answers: req.body.answers,
    });

    if (existingQuestion) {
      return res.status(409).json({
        error: "This question AND this answers already exists.",
      });
    }

    // Proceed with insertion if no duplicate is found
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
    const { username, result } = req.body;

    // Check for existing attempts by this user in the last 20 minutes
    const existingAttempts = await Results.find({
      username,
      createdAt: { $gte: new Date(Date.now() - 20 * 60 * 1000) }, // Last 20 minutes
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

    // Fetch all questions for this quiz
    const questions = await Questions.find({
      _id: { $in: result.map((r) => r.questionId) },
    }).select("_id correctAnswerIndex");

    if (questions.length !== result.length) {
      return formatResponse(
        res,
        400,
        "Number of answers doesn't match number of questions in this quiz"
      );
    }

    // Transform the result array and calculate passed questions
    let passedQuestions = 0;
    const transformedResult = result.map((answer) => {
      const question = questions.find(
        (q) => q._id.toString() === answer.questionId
      );
      const correct = answer.selectedAnswer === question.correctAnswerIndex;
      if (correct) passedQuestions++;
      return {
        questionId: question._id,
        selectedAnswer: answer.selectedAnswer,
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
      attempts: existingAttempts.length + 1,
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
      attemptsRemaining: 3 - (existingAttempts.length + 1),
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
