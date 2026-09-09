import { useState } from 'react'

function CounterCard({ title }) {
  const [count, setCount] = useState(0)

  function increase() {
    setCount(count + 1)
  }

  function decrease() {
    if(count > 0){
        setCount(count - 1)
    }
  }

  function reset() {
    setCount(0)
  }

  return (
    <div className="w-80 rounded-2xl bg-black p-6 text-center shadow-lg">
      <h2 className="text-2xl font-bold text-gray-500">
        {title}
      </h2>

      <p className="my-8 text-6xl font-bold text-blue-600">
        {count}
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={decrease}
          className="rounded-lg bg-red-500 px-5 py-2 font-bold text-white hover:bg-red-600"
        >
          −
        </button>

        <button
          onClick={reset}
          className="rounded-lg bg-gray-500 px-5 py-2 font-bold text-white hover:bg-gray-600"
        >
          Reset
        </button>

        <button
          onClick={increase}
          className="rounded-lg bg-green-500 px-5 py-2 font-bold text-white hover:bg-green-600"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default CounterCard