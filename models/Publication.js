const mongoose = require("mongoose");

const publicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["evento", "servicio"], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Publication", publicationSchema);
