import React from "react";
import "../App.css";

export default function Template({ active, setActive, children, userInfo, onLogout }) {
  const menu = [
    { label: "TABELA ZAMÓWIEŃ", key: "orders" },
    { label: "AKTUALNOŚCI", key: "news" },
    { label: "RAPORTY", key: "reports" },
    { label: "INFORMACJE O KONCIE", key: "account" },
  ];

  if (userInfo && userInfo.role === "admin") {
    menu.push({ label: "UŻYTKOWNICY", key: "manageusers" });
  }

  const handleLogout = () => {
    if (window.confirm("Czy na pewno chcesz się wylogować?")) {
      onLogout && onLogout();
    }
  };

  return (
    <div>
      <nav className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="company-name">Nazwa firmy</span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {menu.map(item => (
            <a
              key={item.key}
              href="#"
              className={`topbar-link${active === item.key ? " active" : ""}`}
              onClick={e => {
                e.preventDefault();
                setActive(item.key);
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
        {userInfo && (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#dc3545",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginRight: "10px",
            }}
          >
            Wyloguj
          </button>
        )}
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}