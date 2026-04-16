

// place order COD 

import Order from "../models/Order.js"
import Product from "../models/Product.js"
import stripe from "stripe"
import User from "../models/User.js"

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

// place order stripe :/api/order/stripe
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body
        const { origin } = req.headers;
        if (!address || items.length == 0) {
            return res.json({ success: false, message: "Invalid data" })
        }

        let productData = []

        // calculate amoutn using items 

        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product)
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            })
            return (await acc) + product.offerPrice * item.quantity
        }, 0)

        // add tax charge (2%)
        amount += Math.floor(amount * 0.02)

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online"
        })
        // Stripe GateWay initialize 
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
        // creeate line items stripe 

        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity
            }
        })

        // create session 
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.json({ success: true, url: session.url })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


// stirpe webhooks to verifty payements action : /stripe 
const stripeWebHooks = async (request, responce) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

    const sig = request.headers("stripe-signature")
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        responce.status(400).send(`Webhook Error: ${error.message}`)
    }

    // handle the event 

    switch (event.type) {
        case "payment_intent.succeeded": {

            const paymentIntent = event.data.object
            const paymentIntentId = paymentIntent.id

            // getting session metadata 
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });
            const { orderId, userId } = session.data[0].metadata

            // mark pyametn as paid 

            await Order.findByIdAndUpdate(orderId, { isPaid: true })
            // Clear user cart 

            await User.findByIdAndUpdate(userId, { cartItems: {} })
            break;
        }

        case "payment_intent.payment_failed":
            {

                const paymentIntent = event.data.object
                const paymentIntentId = paymentIntent.id

                // getting session metadata 
                const session = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntentId,
                });
                const { orderId } = session.data[0].metadata

                await Order.findByIdAndDelete(orderId)
                break;
            }

        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }

    responce.json({})
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
export { placeOrderCOD, getUserOrders, getAllOrders, placeOrderStripe }