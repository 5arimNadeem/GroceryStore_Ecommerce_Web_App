
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets, dummyProducts } from "../assets/assets.js"
import toast from "react-hot-toast"
export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const navigate = useNavigate()
    const currency = import.meta.VITE_CURRENCY
    const [user, setUser] = useState(true)
    const [cartItems, setCartItems] = useState({})
    const [products, setProducts] = useState([])
    const [isSeller, setIsSeller] = useState(false)
    const [searchQuery, setSearchQuery] = useState({})
    const [showUserLogin, setShowUserLogin] = useState(false)

    const fetchProducts = async () => {
        setProducts(dummyProducts)
    }

    // The structuredClone() method of the Window interface creates a deep clone of a value using the structured clone algorithm. The method also allows transferable objects in the original value to be transferred rather than cloned to the new object.
    // what is the deep copy : 
    //    A deep copy of an object is a copy whose properties do not share the same references (point to the same underlying values) as those of the source object from which the copy was made. As a result, when you change either the source or the copy, you can be assured you're not causing the other object to change too 

    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems)
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData)
        toast.success("added to cart")
    }

    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems)

        cartData[itemId]
        setCartItems(cartData)
        toast.success("Cart updated")
    }

    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems)
        if (cartData[itemId]) {
            cartData[itemId] -= 1
            if (cartData[itemId] === 0) {
                delete cartData[itemId]
            }
        }
        toast.success("Removed from Cart")
        setCartItems(cartData)
    }
    useEffect(() => {

        fetchProducts()
    }, []);

    //  get cart item count 

    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item]

        }
        return totalCount
    }

    // get cart total amount 

    const getCartAmount = () => {
        let totalAmount = 0;

        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items)
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items]
            }
        }

        return Math.floor(totalAmount * 100) / 100 
    }

    const value = { navigate, user, setUser, isSeller, assets, showUserLogin, setIsSeller, setShowUserLogin, products, addToCart, updateCartItem, removeFromCart, cartItems, currency, searchQuery, setSearchQuery, getCartAmount, getCartCount };



    return (
        <AppContext.Provider value={value} >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext)
}
