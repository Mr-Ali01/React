function UserProfile(props) {
    // { name, age, education, city }
  return (
    <div className="w-80 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      
      <div className="flex flex-col items-center">
        
        <img
          src="https://i.pravatar.cc/150?img=12"
          alt={props.name}
          className="h-24 w-24 rounded-full object-cover"
        />

        <h2 className="mt-4 text-2xl font-bold text-gray-900">
          {props.name}
        </h2>

        <p className="mt-1 text-gray-500">
          {props.city}
        </p>

      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between">
          <span className="font-medium text-gray-500">
            Age
          </span>

          <span className="font-semibold text-gray-900">
            {props.age}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-500">
            Education
          </span>

          <span className="font-semibold text-gray-900">
            {props.education}
          </span>
        </div>
      </div>

    </div>
  )
}

export default UserProfile