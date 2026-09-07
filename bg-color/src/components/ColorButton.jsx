function ColorButton({ color, onClick }) {
  return (
    <button onClick={() => onClick(color)}
      className="h-10 w-10 rounded-full border-2 border-white shadow-md transition hover:scale-110"
      style={{ backgroundColor: color }}
    ></button>
  )
}

export default ColorButton