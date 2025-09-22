import React from "react";
import "../App.css";

export default function Template({ active, setActive, children }) {
  const menu = [
    { label: "TABELA ZAMÓWIEŃ", key: "orders" },
    { label: "KONTROLA PRACY", key: "work" },
    { label: "AKTUALNOŚCI", key: "news" },
    { label: "RAPORTY", key: "reports" },
  ];

  return (
    <div>
      <nav className="topbar">
        <span className="company-name">Nazwa firmy</span>
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
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}