import { Route, Routes } from "react-router";
import HomePage from "./pages/HomePage.tsx";

// Each screen gets a route here. Feature screens (votes, feed, dashboard) get added as they're built.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
