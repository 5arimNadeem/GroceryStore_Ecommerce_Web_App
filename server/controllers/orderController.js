

// place order COD 

import Order from "../models/Order.js"
import Product from "../models/Product.js"

const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user.id
        const { items, address } = req.body
        if (!address || items.length == 0) {
            return res.json({ success: false, message: "Invalid data" })
        }

        // calculate amoutn using items 

        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product)
            return (await acc) + product.offerPrice * item.quantity
        }, 0)

        // add tax charge (2%)
        amount += Math.floor(amount * 0.02)

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD"
        })

        return res.json({ success: true, message: "Order placed Successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

// get order by user id 
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id
        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// get all orders (for seller/ admin) : /api/order/seller
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export { placeOrderCOD, getUserOrders, getAllOrders }