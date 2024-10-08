import Results from "../models/result.schema.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

export const createResult = async (resultData) => {
  const userId = uuidv4();
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS || 10;
  const hashedUserId = await bcrypt.hash(userId, parseInt(saltRounds));

  const newResult = new Results({
    ...resultData,
    userId: hashedUserId,
  });

  const savedResult = await newResult.save();
  return { savedResult, userId };
};

export const getAllResults = async () => {
  return await Results.find();
};

export const deleteResultById = async (id) => {
  return await Results.findByIdAndDelete(id);
};
