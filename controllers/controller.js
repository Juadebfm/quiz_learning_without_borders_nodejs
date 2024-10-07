import Questions from "../models/question.schema.js";
import Results from "../models/result.schema.js";

export async function getQuestions(req, res) {
  try {
    const q = await Questions.find();
    res.json(q);
  } catch (error) {
    res.json({ error });
  }
}

export async function insertQuestions(req, res) {
  try {
    const { question, answers, correctAnswerIndex } = req.body;

    if (!question || !answers || correctAnswerIndex === undefined) {
      return res.status(400).json({
        error: "Question, answers, and correctAnswerIndex are required.",
      });
    }

    if (answers.length !== 4) {
      return res
        .status(400)
        .json({ error: "Exactly 4 answers must be provided." });
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex > 3) {
      return res
        .status(400)
        .json({ error: "correctAnswerIndex must be between 0 and 3." });
    }

    const data = await Questions.create({
      question,
      answers,
      correctAnswerIndex,
    });

    res.json({ message: "Question Added Successfully", data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteQuestions(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Question ID is required" });
    }

    const result = await Questions.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ message: "Question deleted successfully", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getResults(req, res) {
  res.json("Return response");
}

export async function storeResults(req, res) {
  res.json("Return response");
}

export async function deleteResults(req, res) {
  res.json("Return response");
}
