function ProductCards({ name, price, image, category }) {
  return (
    <div className="w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">

      <img
        src={image}
        alt={name}
        className="h-52 w-full object-cover"
      />

      <div className="p-5">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {category}
        </span>

        <h2 className="mt-3 text-xl font-bold text-gray-900">
          {name}
        </h2>

        <p className="mt-2 text-2xl font-bold text-green-600">
          ₹{price}
        </p>

        <button className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white transition hover:bg-gray-700">
          Add to Cart
        </button>

      </div>
    </div>
  )
}

export default ProductCards