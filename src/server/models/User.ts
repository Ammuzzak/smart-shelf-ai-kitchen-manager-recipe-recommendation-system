import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pantry: [
      {
        name: String,
        quantity: Number,
        unit: String,
      },
    ],
    savedRecipes: [String],
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);