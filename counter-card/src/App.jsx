import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import CounterCard from './components/CounterCard'

function App() {
  const CounterItems =["Likes", "Cart Items","Downloads"]
  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="mb-10 text-center text-4xl font-bold text-gray-900">
        Counter Cards
      </h1>
    
      <div className="flex flex-wrap justify-center gap-8">
        {CounterItems.map((item)=>(
          <CounterCard
          title = {item} />
        ))}
        {/* <CounterCard title="Likes" />
        <CounterCard title="Cart Items" />
        <CounterCard title="Downloads" /> */}
      </div>
    </div>
  )
}

export default App
