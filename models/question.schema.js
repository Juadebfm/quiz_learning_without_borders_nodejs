import mongoose from "mongoose";

const { Schema } = mongoose;

const questionModel = new Schema({
  question: { type: String, required: true },
  answers: {
    type: [String],
    required: true,
    validate: [arrayLimit, "Must have exactly 4 answers"],
  },
  correctAnswerIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Validation function to ensure there are exactly 4 answers
function arrayLimit(val) {
  return val.length === 4;
}

export default mongoose.model("Question", questionModel);
