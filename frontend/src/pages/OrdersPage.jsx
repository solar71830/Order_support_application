import React, { useEffect, useState } from "react";
import "../App.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/orders/")
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Ładowanie...</div>;
  if (!orders.length) return <div>Brak zamówień.</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "32px",
      }}
    >
      <h2
        className="text-center"
        style={{ color: "#111", marginBottom: "24px" }}
      >
        Tabela Zamówień
      </h2>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          marginBottom: "32px",
        }}
      >
        <table
          className="orders-table table text-dark"
          style={{
            minWidth: "900px",
            width: "fit-content",
            margin: "0 auto",
          }}
        >
          <thead>
            <tr>
              <th>Numer Zamówienia</th>
              <th>Osoba</th>
              <th>Wartość Zamówienia</th>
              <th style={{ minWidth: "180px" }}>Termometr</th>
              <th>Komentarze</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Dodaj Komentarz</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 50).map(order => (
              <tr key={order.id}>
                <td>{order.numer || order.id}</td>
                <td>{order.osoba || "Brak"}</td>
                <td>{order.cena}</td>
                <td>
                  <div
                    className="progress"
                    style={{
                      height: 25,
                      background: "#e9ecef",
                      position: "relative",
                      minWidth: "160px",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      className={
                        "progress-bar" +
                        (order.is_overdue
                          ? " progress-bar-danger"
                          : order.time_diff <= 7 && order.time_diff >= 0
                          ? " progress-bar-warning"
                          : " progress-bar-info")
                      }
                      role="progressbar"
                      style={{
                        width: `${order.timeline_progress_scaled}%`,
                        transition: "width 1s ease",
                        background:
                          order.is_overdue
                            ? "red"
                            : order.time_diff <= 7 && order.time_diff >= 0
                            ? "yellow"
                            : "#17a2b8",
                        minWidth: "0",
                        height: "100%",
                        borderRadius: "4px",
                      }}
                    ></div>
                    <span
                      className="data-label"
                      style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "black",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {order.data_potwierdzona}
                    </span>
                  </div>
                </td>
                <td>{order.comments_count}</td>
                <td
                  style={
                    order.next_deadline && order.next_deadline !== "Brak"
                      ? { background: "red", color: "white", textAlign: "center" }
                      : { color: "#111", textAlign: "center" }
                  }
                >
                  {order.next_deadline && order.next_deadline !== "Brak"
                    ? order.next_deadline
                    : "Brak"}
                </td>
                <td>
                  <select
                    value={order.status || "Brak"}
                    className="form-select"
                    onChange={e => {
                      alert(
                        `Zmieniono status zamówienia ${order.numer} na ${e.target.value}`
                      );
                    }}
                  >
                    <option value="Brak" hidden>
                      Brak
                    </option>
                    <option value="Oczekiwanie">Oczekiwanie</option>
                    <option value="W trakcie">W trakcie</option>
                    <option value="Zrealizowane">Zrealizowane</option>
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      alert("Przejdź do komentarzy zamówienia " + order.numer)
                    }
                  >
                    Dodaj Komentarz
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}