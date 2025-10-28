import React, { useEffect, useState } from "react";
import "./App.css";
import Template from "./pages/Template";
import OrdersPage from "./pages/OrdersPage";
import WorkPage from "./pages/WorkPage";
import NewsPage from "./pages/NewsPage";
import ReportsPage from "./pages/ReportsPage";
import Login from "./pages/Login";
import AccountInfo from "./pages/AccountInfo";
import ManageUsers from "./pages/ManageUsers";

function App() {
    const [orders, setOrders] = useState([]);
    const [active, setActive] = useState("orders");
    const [token, setToken] = useState(null);
    const [authMode, setAuthMode] = useState("login");
    const [userInfo, setUserInfo] = useState(null);

    // Funkcja obs³uguj¹ca logowanie jeœli narusza prawa bezpiezceñstwa usun¹æ @Bartek
    const handleLogin = (token) => {
        const now = new Date().getTime(); // Aktualny czas w milisekundach
        localStorage.setItem("jwtToken", token); // Zapisz token
        localStorage.setItem("tokenTimestamp", now); // Zapisz czas zapisania tokena
        setToken(token); // Ustaw token w stanie aplikacji
    };

    useEffect(() => {
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("tokenTimestamp");
        setToken(null); // Wyzeruj token w stanie aplikacji
    }, []);

    useEffect(() => {
        const savedToken = localStorage.getItem("jwtToken");
        const tokenTimestamp = localStorage.getItem("tokenTimestamp");
        const now = new Date().getTime();

        if (savedToken && tokenTimestamp) {
            const elapsedTime = now - parseInt(tokenTimestamp, 10); // Czas od zapisania tokena
            const thirtyMinutes = 30 * 60 * 1000; // 30 minut w milisekundach

            if (elapsedTime > thirtyMinutes) {
                localStorage.removeItem("jwtToken"); // Usuñ token
                localStorage.removeItem("tokenTimestamp"); // Usuñ czas zapisania tokena
                setToken(null); // Wyzeruj token w stanie aplikacji
                alert("Sesja wygas³a. Zaloguj siê ponownie."); // Powiadom u¿ytkownika
            } else {
                setToken(savedToken); // Token jest nadal wa¿ny
            }
        }
    }, []);

    // Wczytaj token z localStorage przy pierwszym renderze
    useEffect(() => {
        const savedToken = localStorage.getItem("jwtToken");
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    useEffect(() => {
        if (token) {
            fetch("http://127.0.0.1:8000/account-info/", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    setUserInfo(data.info);
                });
        } else {
            setUserInfo(null);
        }
    }, [token]);

    useEffect(() => {
        if (token && userInfo && userInfo.role === "admin") {
            fetch("http://127.0.0.1:8000/api/orders/", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setOrders(data));
        }
    }, [token, userInfo]);

    let page = null;
    if (!token) {
        page =
            authMode === "login" ? (
                <Login onLogin={handleLogin} switchMode={() => setAuthMode("login")} />
            ) : null;
    } else if (userInfo) {
        if (userInfo.role === "admin") {
            if (active === "orders") page = <OrdersPage orders={orders} />;
            if (active === "work") page = <WorkPage />;
            if (active === "news") page = <NewsPage />;
            if (active === "reports") page = <ReportsPage />;
            if (active === "account") page = <AccountInfo token={token} />;
            if (active === "manageusers") page = <ManageUsers token={token} />;
        } else {
            if (active === "account") page = <AccountInfo token={token} />;
            if (active === "orders") page = <OrdersPage orders={orders} />;
            if (active === "work") page = <WorkPage />;
            if (active === "news") page = <NewsPage />;
            if (active === "reports") page = <ReportsPage />;
        }
    }

    return (
        <Template
            active={active}
            setActive={setActive}
            userInfo={userInfo}
        >
            {page}
        </Template>
    );
}

export default App;
