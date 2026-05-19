import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Pages/sign"
import Result from "./Pages/mosaic"



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route index element={<Home />} />
          <Route path="Result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}