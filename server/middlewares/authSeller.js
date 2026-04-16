import jwt from "jsonwebtoken"

const authSeller = async (req, res, next) => {
    const { sellerToken } = req.cookies
    if (!sellerToken) {
        return res.json({ success: false, message: "not Authorized" })
    }
    try {
        const sellerTokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET)

        if (sellerTokenDecode.email) {
            req.user = { email: sellerTokenDecode.email }
        }
        
        else {
            return res.json({ success: false, message: "not authorized" })
        }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authSeller