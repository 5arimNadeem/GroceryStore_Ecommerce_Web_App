import jwt from "jsonwebtoken"

const authSeller = async (req, res, next) => {
    const { sellerToken } = req.cookies
    if (!sellerToken) {
        return res.json({ success: false, message: "not Authorized" })
    }
    try {
        const sellerTokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET)

        if (sellerTokenDecode.email === process.env.SELLER_EMAIL) {
            next()
        } else {
            return res.json({ success: false, message: "not authorized" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authSeller