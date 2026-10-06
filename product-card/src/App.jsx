import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import ProductCards from './components/ProductCards'
function App() {
  const [count, setCount] = useState(0)
const products = [
    {
      id: 1,
      name: 'Wireless Headphones',
      price: 1999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
    },
    {
      id: 2,
      name: 'Smart Watch',
      price: 2999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'
    },
    {
      id: 3,
      name: 'Running Shoes',
      price: 2499,
      category: 'Footwear',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'
    },
    {
      id: 4,
      name: 'Backpack',
      price: 1499,
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62'
    }
  ]


  return (
    <>
      <div className="min-h-screen bg-gray-100 p-10">
        <h1 className="mb-10 text-center text-4xl font-bold text-gray-900">
        Our Products
      </h1>
            <div className="flex flex-wrap justify-center gap-8">
              {
                products.map((product)=> {
                  return(
                    <ProductCards
                  key={product.id}
                  name={product.name}
                  price={product.price}
                  category={product.category}
                  image={product.image}
                  />
                  )
                })
              }
            </div>

      </div>

    </>
  )
}

export default App
