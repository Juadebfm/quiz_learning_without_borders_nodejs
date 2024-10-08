import Joi from "joi";

export const questionSchema = Joi.object({
  question: Joi.string().required(),
  answers: Joi.array().items(Joi.string()).length(4).required(),
  correctAnswerIndex: Joi.number().min(0).max(3).required(),
});

export const resultSchema = Joi.object({
  username: Joi.string().required(),
  result: Joi.array().required(),
  attempts: Joi.number().required(),
  points: Joi.number().required(),
  achieved: Joi.string().required(),
});
