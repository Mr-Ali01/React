import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Card from './component/card'

function App() {
  const [count, setCount] = useState(0)

  const Person = {
    name:"Ali",
    age:23,
    education:"MCA"
  }
  return (
    <>
     <h1>Welcome to Samir Ali</h1>
     <Card {...Person}/>
    </>
  )
}

export default App
