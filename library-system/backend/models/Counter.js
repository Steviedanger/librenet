import mongoose from 'mongoose';

/**
 * Named atomic counters. Each document holds a monotonically increasing `seq`
 * bumped via findOneAndUpdate($inc) so concurrent writers never collide.
 * Used to auto-generate sequential library IDs (see User model).
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

/**
 * Atomically increment the named counter and return the next value.
 */
counterSchema.statics.next = async function (name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
