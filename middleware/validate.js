import Joi from "joi";

const questionSchema = Joi.object({
  question: Joi.string().required().trim(),
  answers: Joi.array()
    .items(Joi.string().trim().required())
    .length(4)
    .required(),
  correctAnswerIndex: Joi.number().integer().min(0).max(3).required(),
});

const resultSchema = Joi.object({
  username: Joi.string().required().trim(),
  result: Joi.array().items(Joi.number().min(0).max(3)).required(),
  attempts: Joi.number().integer().min(1).required(),
  points: Joi.number().min(0).required(),
  achieved: Joi.string().trim().required(),
});

export const validateQuestion = (req, res, next) => {
  const { error } = questionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};
export const validateResult = (req, res, next) => {
  const { error } = resultSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};
