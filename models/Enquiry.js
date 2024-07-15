import mongoose, {model, models, Schema} from "mongoose";
import { Category } from "./Category";

const enquirySchema = new Schema({
  name: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  phoneNumber: {
    type: String,
    require: true
  },
  message: {
    type: String,
  },
  productId: {
    type: {type:mongoose.Types.ObjectId, ref:'Product'},
  },
  expectedBudget: {
    type: Number,
  },
  time: {
    type: Date,
    default: Date.now
  }
});

const Enquiry = models?.Enquiry || model('Enquiry', enquirySchema);
export default Enquiry
// module.exports = Enquiry;
