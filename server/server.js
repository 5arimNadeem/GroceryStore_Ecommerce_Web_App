import cookieParser from "cookie-parser"
import express from "express"
import cors from 'cors'
import connectDB from "./configs/db.js"
import 'dotenv/config'
import userRouter from "./routes/userRoute.js"
import sellerRouter from "./routes/sellerRoute.js"

const app = express()
const port = process.env.PORT || 4000

await connectDB()

const allowedOrigins = ['http://localhost:5173']
// middleware config's

app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json())
app.use(cookieParser())


app.get('/', (req, res) => res.send("Api is working"))
app.use('/api/user', userRouter)
app.use('/api/seller', sellerRouter)

app.listen(port, () => { console.log("server is working brother :)") })

