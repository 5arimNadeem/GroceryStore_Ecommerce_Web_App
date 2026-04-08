import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs"

const saltValue = 10;
const daysOfWeek = 7
const hoursInADay = 24
const minutesInAHour = 60
const secondsInAMinute = 60
const thousand = 1000

const timeInMilliSeconds = (daysOfWeek, hoursInADay, minutesInAHour, secondsInAMinute, thousand) => {
    return daysOfWeek * hoursInADay * minutesInAHour * secondsInAMinute * thousand;
}
// Register user

const register = async (req, res) => {

    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {

            return res.json({ success: false, message: "Missign Detials" })
        }

        const existingUser = await User.findOne({ email })

        if (existingUser)
            return res.json({ success: false, message: "User Already Exists With this email" })

        const hashedPassword = await bcrypt.hash(password, saltValue)

        const user = await User.create({ name, email, password: hashedPassword })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            // csrf protection
            // A CSRF (Cross-Site Request Forgery) token is a unique security measure designed to protect web applications from unauthorized or malicious requests. It's a specific type of token, often referred to as a synchronizer token or challenge token, that verifies the authenticity of requests made by a user.
            //  function to calcualte time in miliseconds for cookie expiration
            maxAge: timeInMilliSeconds(daysOfWeek, hoursInADay, minutesInAHour, secondsInAMinute, thousand)
        })

        return res.json({ success: true, user: { email: user.email, name: user.name } })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {

            return res.json({ success: false, message: 'Email and password are required' })

        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Missing Detials" })
        }
        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            return res.json({ success: true, user: { email: user.email } })
        }
        if (!isMatch) {
            return res.json({ success: false, message: "invalid email or password" })
        }
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}

// chekc auth : /api/user/is-auth

const isAuth = async (req, res) => {
    try {
        const userId = req.user.id
        const user = await User.findById(userId).select('-password')
        return res.json({ success: true, user })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}
// logout user : /api/user/logout

const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        res.json({ success: true, messge: "logged out" })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}

export { register, login, isAuth, logout }

