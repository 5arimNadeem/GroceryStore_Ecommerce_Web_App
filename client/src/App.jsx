import React from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import { useAppContext } from './context/AppContext'
import Login from './components/Login'
import AllProducts from './pages/AllProducts'
import ProductCategory from './pages/ProductCategory'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'

const App = () => {
  /* The useLocation hook in React Router is a function that returns the location object from the current URL. This location object contains the current URL's pathname, search parameters, hash fragment, and some other information. */
  const isSellerPath = useLocation().pathname.includes("seller")
  const { showUserLogin } = useAppContext()
  return (
    <div>

      {isSellerPath ? null :
        <Navbar />
      }
      {showUserLogin ? <Login /> : null}

      <Toaster />
      {/* <MainBanner /> */}
      <div className={`${isSellerPath ? "" : "px-5 md:px-15 lg:px-24 xl:px-32"} `}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>
      {!isSellerPath &&
        <Footer />
      }
    </div>

  )
}

export default App 