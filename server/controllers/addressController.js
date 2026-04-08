import Address from "../models/Address.js"


// add address : /api/address/add
const addAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const address = req.body
        await Address.create({ ...address, userId })

        res.json({ success: true, message: "Address added successfully" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }

}

const getAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const addresses = await Address.find({ userId })
        res.json({ success: true, addresses })
    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

export { addAddress, getAddress   }