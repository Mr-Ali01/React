import {
  BrowserRouter,
  Routes,
  Route,
  Link
} from "react-router-dom";

import Home from "./pages/Home";
import Results from "./pages/Results";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>

      <nav>
        <Link to="/">Home</Link>{" "}
        <Link to="/results">Results</Link>{" "}
        <Link to="/profile">Profile</Link>
      </nav>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/results"
          element={<Results />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;