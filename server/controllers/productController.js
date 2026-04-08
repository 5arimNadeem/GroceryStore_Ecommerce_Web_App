import { v2 as cloudinary } from "cloudinary"
import Product from "../models/Product.js"

// add product : /api/product/add 

const addProduct = async (req, res) => {

    try {
        let productData = JSON.parse(req.body.productData)
        const images = req.files

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path,
                    { resource_type: 'image' }
                )
                return result.secure_url

                TrackEvent
            })
        )
        await Product.create({ ...productData, image: imagesUrl })
        res.json({ success: true, message: "Product Added" })
    } catch (error) {
        console.log(error.message)
        res.json({ succes: false, message: error.message })

    }
}

// product list : /api/product/list
const productList = async (req, res) => {
    try {
        const products = await Product.find({})
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// get product : /api/product/list

const productById = async (req, res) => {
    try {
        const id = req.user.id
        const products = await Product.findById(id)
        res.json({ success: true, product })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// get single product : /api/product/id

const changeStock = async (req, res) => {
    try {
        const id = req.user.id
        const isStock = req.user.inStock

        await Product.findByIdAndUpdate(id, { inStock })
        res.json({ succes: true, message: "Stock updated" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

export { addProduct, productList, productById, changeStock }