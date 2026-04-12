import { Schema, model, models } from 'mongoose'

const SignalSchema = new Schema({
  timestamp:    { type: Date, default: Date.now },
  idleSeconds:  { type: Number, default: 0 },
  reScrolls:    { type: Number, default: 0 },
  readingSpeed: { type: Number, default: 0 },
  focusScore:   { type: Number, default: 0 },
  pageTitle:    { type: String, default: '' },
  pageUrl:      { type: String, default: '' },
}, { _id: false })

const SessionSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:        { type: String, required: true },          // 'YYYY-MM-DD'
  startTime:   { type: Date, default: Date.now },
  endTime:     { type: Date },
  platform:    { type: String, default: '' },
  topic:       { type: String, default: '' },
  signals:     [SignalSchema],
  avgScore:    { type: Number, default: 0 },
  peakScore:   { type: Number, default: 0 },
  lowestScore: { type: Number, default: 100 },
  alerts:      { type: Number, default: 0 },
  quizzes:     { type: Number, default: 0 },
  quizCorrect: { type: Number, default: 0 },
  totalMinutes:{ type: Number, default: 0 },
})

export const Session = models.Session || model('Session', SessionSchema)
