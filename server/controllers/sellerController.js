import jwt from "jsonwebtoken"

const daysOfWeek = 7
const hoursInADay = 24
const minutesInAHour = 60
const secondsInAMinute = 60
const thousand = 1000


const timeInMilliSeconds = (daysOfWeek, hoursInADay, minutesInAHour, secondsInAMinute, thousand) => {
    return daysOfWeek * hoursInADay * minutesInAHour * secondsInAMinute * thousand;
}


const sellerLogin = async (req, res) => {



    try {

        const { email, password } = req.body

        if (password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' })

            res.cookie('sellerToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                // csrf protection
                // A CSRF (Cross-Site Request Forgery) token is a unique security measure designed to protect web applications from unauthorized or malicious requests. It's a specific type of token, often referred to as a synchronizer token or challenge token, that verifies the authenticity of requests made by a user.

                //  function to calcualte time in miliseconds for cookie expiration
                maxAge: timeInMilliSeconds(daysOfWeek, hoursInADay, minutesInAHour, secondsInAMinute, thousand)
            })
            res.json({ success: true, message: "Logged in" , token})
        } else {
            return res.json({ success: false, message: "Invalid Credentials" })
        }

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}


// chekc auth : /api/user/is-auth

const isSellerAuth = async (req, res) => {
    try {
        return res.json({ success: true, seller: req.user })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}

// logout user : /api/user/logout

const sellerLogout = async (req, res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        res.json({ success: true, message: "logged out" })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })

    }
}

export { sellerLogin, isSellerAuth, sellerLogout }