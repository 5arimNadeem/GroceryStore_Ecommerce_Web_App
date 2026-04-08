import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: Array, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, require: true },
    category: { tyep: Array, required: true },
    inStock: { type: Boolean, default: {} },
    cartItems: { type: Object, default: {} }
}, {timestamps:true})

const Product = mongoose.models.product || mongoose.model('product', productSchema)

export default Product