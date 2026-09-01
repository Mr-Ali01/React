import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [counter, setCount] = useState(15)
  
  function addNumber() {
    if(counter < 20) {
      setCount(count=> count+1);
    console.log(counter, Math.random());
    } else {
      alert("Please add number less than equal 20");
    }
    
  }
  const removeNumber=()=>{
    if(counter > 0) {
    setCount((count)=> count-1);
    } else{
      alert("Please add number Greater than equal 0");

    }
  }

  return (
    <>
      <p>{counter}</p>
      <button onClick={addNumber}>Up-Counter</button>
      <button onClick={removeNumber}>Down-Counter</button>
    </>
  )
}

export default App
