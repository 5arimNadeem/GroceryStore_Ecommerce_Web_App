import React from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import { Toaster } from 'react-hot-toast'
import { Routes, Route, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import { useAppContext } from './context/AppContext'
import Login from './components/Login'
import SellerLogin from './components/seller/SellerLogin.jsx'
import AllProducts from './pages/AllProducts'
import MyOrders from './pages/MyOrders.jsx'
import ProductDetails from './pages/ProductDetails'
import ProductCategory from './pages/ProductCategory'
import AddAddress from './pages/AddAddress'
import Cart from './pages/Cart'
import SellerLayout from './pages/seller/SellerLayout.jsx'
import AddProduct from './pages/seller/AddProduct.jsx'
import Orders from './pages/seller/Orders.jsx'
import ProductList from './pages/seller/ProductList.jsx'
import Loading from './components/Loading.jsx'

const App = () => {
  /* The useLocation hook in React Router is a function that returns the location object from the current URL. This location object contains the current URL's pathname, search parameters, hash fragment, and some other information. */
  const isSellerPath = useLocation().pathname.includes("seller")
  const { showUserLogin, isSeller } = useAppContext()
  return (
    <div className='text-default min-h-screen text-gray-700 bg-white'>

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
          <Route path="/add-address" element={<AddAddress />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/loader" element={<Loading />} />

          <Route path="/seller" element={isSeller ? <SellerLayout /> : <SellerLogin />} >
            <Route index element={isSeller ? <AddProduct /> : null} />
            <Route path='/seller/product-list' element={<ProductList />} />
            <Route path='/seller/orders' element={<Orders />} />
          </Route>

        </Routes>
      </div>
      {!isSellerPath && <Footer />
      }
    </div>

  )
}

export default App 