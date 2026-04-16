
import { useEffect, useState } from "react";
// import { assets } from "../assets/assets.js";
// import axios from "axios";
import { toast } from "react-hot-toast";
import { useAppContext } from "../../context/AppContext.jsx";

const Login = () => {
    const { isSeller, setIsSeller, navigate, axios } = useAppContext()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            const { data } = await axios.post('/api/seller/login', { email, password })
            if (data.success) {
                setIsSeller(true)
                navigate('/seller')
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }

    }



    useEffect(() => {
        if (isSeller) {
            navigate('/seller')
        }
    }, [isSeller])

    return !isSeller && (
        <form
            onSubmit={onSubmitHandler}
            className="min-h-[80vh] flex items-center">
            <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg">
                <p className="text-2xl font-semibold m-auto">
                    <span className="text-primary ">Seller</span> Login
                </p>
                <div className="w-full">
                    <p>Email</p>
                    <input
                        onChange={(e) => setEmail(e.target.value)} value={email}
                        className="border border-amber-100 rounded w-full p-2 mt-1" type="email" required />
                </div>

                <div className="w-full">
                    <p>Password</p>
                    <input
                        onChange={(e) => setPassword(e.target.value)} value={password}
                        className="border border-amber-100 rounded w-full p-2 mt-1" type="password" required />
                </div>

                <button className="text-white bg-primary w-full py-2 rounded-md text-base">Seller Login</button>
                {/* {
                    state === "Admin"
                        ? <p>Doctor Login? <span className="cursor-pointer text-primary underline font-bold" onClick={() => setState('Doctor')}>Click here</span> </p>
                        : <p>Admin Login? <span className="cursor-pointer text-primary underline font-bold" onClick={() => setState('Admin')}>Click here</span> </p>
                } */}
            </div>
        </form>
    );
};

export default Login;