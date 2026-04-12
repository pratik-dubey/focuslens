import mongoose, { Schema, model, models } from 'mongoose'

const UserSchema = new Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String },
  provider:  { type: String, default: 'credentials' },
  avatar:    { type: String },
  createdAt: { type: Date, default: Date.now },
})

export const User = models.User || model('User', UserSchema)
