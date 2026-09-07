import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import UserProfile from './component/UserProfile'

function App() {
  const [users, setUser] = useState({
    name:"Iliyas Ali",
    age:20,
    education:"BCA",
    city:"Hyderabad"
  })
  function changeUser() {
    setUser ({
      name: 'Sahil Ansari',
      age: 25,
      education: 'B.Tech',
      city: 'Hyderabad',
    })
  }
  //   const user = {
  //   name: 'Samir Ali',
  //   age: 23,
  //   education: 'MCA',
  //   city: 'Visakhapatnam',
  // }
  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
      
      {/* <UserProfile {...user}/> */}
      {/* <UserProfile
  name={user.name}
  age={user.age}
  education={user.education}
  city={user.city}
/> */}
 <UserProfile
  name={users.name}
  age={users.age}
  education={users.education}
  city={users.city}
/>  
<button
        onClick={changeUser}
        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Change User
      </button>
    </div>
    </>
  )
}

export default App
