import { BrowserRouter, Routes, Route } from "react-router-dom";
import Inventory from "./pages/Inventory";
import CustomerOrder from "./pages/CustomerOrder";
import "./App.css";
import OrdersList from "./pages/OrdersList";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerOrder />} />
          <Route path="/Inventory" element={<Inventory />} />
          <Route path="/OrdersList" element={<OrdersList />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
