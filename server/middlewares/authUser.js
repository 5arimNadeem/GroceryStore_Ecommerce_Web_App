import jwt from "jsonwebtoken"

const authUser = async (req, res, next) => {
    const { token } = req.cookies
    if (!token) {
        return res.json({ success: false, message: "not Authorized" })
    }
    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

        if (tokenDecode.id) {
            req.user = { id: tokenDecode.id }
        } else {
            return res.json({ success: false, message: "not authorized" })
        }
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authUser