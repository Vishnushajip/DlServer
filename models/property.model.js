import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    location: String,
    verified: String,
    remarks: { type: String },
    name: String,
    type: String,
    subtype: String,
    bhk: Number,
    sqft: String,
    price: Number,
    plotArea: String,
    unit: String,
    listedOn: {
      type: Number,
      required: true,
    },
    status: String,
    agent: String,
    Pricingoptions: String,
    propertyDescription: String,
    images: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    ownerName: String,
    phoneNumber: String,
    whatsappNumber: String,
    propertyId:String,
  },
  {
    timestamps: true,
  }
);

const Property = mongoose.model("Property", propertySchema);
export default Property;
