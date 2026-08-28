import  React  from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StrictMode } from 'react'

 function MyApp(){
  return (
    <h1>Samir Ali | Java Developer</h1>
  )
 }
//  const ReactElement = {
//     type: 'a',
//     props: {
//         href: 'https://google.com',
//         target: '_blank'
//     },
//     children: 'Click me to visit google'
// }
// const linkList = (
//   <a href="https://google.com" target='_blank'>Visite Link</a>
// )
const reactElement = React.createElement(
  'a',
  {href:'https://google.com',target:'_blank'},
  'Google'
  

)
createRoot(document.getElementById('root')).render(
 
   
    reactElement
  
)
