<div
      className="min-h-screen"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">
          Background Color Changer
        </h1>
      </div>

      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-3 rounded-2xl bg-white p-4 shadow-xl">
        {colors.map((color) => (
          <ColorButton
            key={color}
            color={color}
            onClick={changeColor}
          />
        ))}
      </div>
    </div>