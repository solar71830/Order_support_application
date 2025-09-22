import React, { useEffect, useState } from "react";
import "./App.css";
import Template from "./pages/Template";
import OrdersPage from "./pages/OrdersPage";
import WorkPage from "./pages/WorkPage";
import NewsPage from "./pages/NewsPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  const [orders, setOrders] = useState([]);
  const [active, setActive] = useState("orders");

  useEffect(() => {
    // Pobierz dane z Django (przykład endpointu)
    fetch("http://127.0.0.1:8000/api/orders/")
      .then((res) => res.json())
      .then((data) => setOrders(data));
  }, []);

  let page = null;
  if (active === "orders") page = <OrdersPage orders={orders} />;
  if (active === "work") page = <WorkPage />;
  if (active === "news") page = <NewsPage />;
  if (active === "reports") page = <ReportsPage />;

  return (
    <Template active={active} setActive={setActive}>
      {page}
    </Template>
  );
}

export default App;
