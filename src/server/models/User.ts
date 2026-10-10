import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    pantry: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit: { type: String, default: "unit" },
        category: { type: String, default: "Pantry" },
        expiryDate: { type: String },
      },
    ],
    savedRecipes: [{ type: String }],
    sessions: [
      {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);