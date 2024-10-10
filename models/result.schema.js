import mongoose from "mongoose";

const { Schema } = mongoose;

const resultSchema = new Schema({
  userId: {
    type: String,
    required: [true, "User ID is required"],
    unique: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
  },
  result: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "Question",
        required: [true, "Question ID is required"],
      },
      selectedAnswer: {
        type: Number,
        required: [true, "Selected answer is required"],
        min: 0,
        max: 3,
      },
      correct: {
        type: Boolean,
        required: [true, "Correctness of answer is required"],
      },
    },
  ],
  attempts: {
    type: Number,
    required: [true, "Number of attempts is required"],
    min: [1, "Attempts must be at least 1"],
  },
  points: {
    type: Number,
    required: [true, "Points are required"],
    min: [0, "Points cannot be negative"],
  },
  achieved: {
    type: String,
    required: [true, "Achievement status is required"],
    trim: true,
  },
  passedQuestions: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

resultSchema.index({ username: 1, createdAt: -1 });

export default mongoose.model("Result", resultSchema);
