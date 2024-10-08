import Questions from "../models/question.schema.js";

export const getAllQuestions = async () => {
  return await Questions.find();
};

export const createQuestion = async (questionData) => {
  return await Questions.create(questionData);
};

export const deleteQuestionById = async (id) => {
  return await Questions.findByIdAndDelete(id);
};
