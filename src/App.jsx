import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Component1 from './Component1'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Component1 />
    </>
  )
}

export default App
