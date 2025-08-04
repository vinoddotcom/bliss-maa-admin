import mongoose, {model, Schema, models} from "mongoose";

const ProductSchema = new Schema({
  title: {type:String, required:true},
  description: String,
  purpose: String,
  images: [{type:String}],
  category: {type:mongoose.Types.ObjectId, ref:'Category'},
  properties: {type:Object},

    // 🚀 SEO fields
  slug: { type: String, required: true, unique: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  keywords: [{ type: String }],
  shortDescription: { type: String },
}, {
  timestamps: true,
});

export const Product = models.Product || model('Product', ProductSchema);