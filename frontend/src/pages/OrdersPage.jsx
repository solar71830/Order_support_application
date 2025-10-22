import React, { useEffect, useState } from "react";
import "../App.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState(""); // Wyszukiwanie
  const [showAddOrderModal, setShowAddOrderModal] = useState(false); // Modal dodania zamówienia
  const [newOrder, setNewOrder] = useState({ numer: "", osoba: "", cena: 0, status: "Oczekiwanie" }); // Formularz dodania zamówienia

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/orders/")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedOrders = [...orders].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "asc" ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    setOrders(sortedOrders);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return "▲▼";
  };

  const handleAddComment = () => {
    if (!selectedOrder) return;

    const formData = new FormData();
    formData.append("comment", comment); // Treść komentarza
    formData.append("deadline", new Date().toISOString().split("T")[0]); // Automatyczna dzisiejsza data

    fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Błąd podczas dodawania komentarza");
        }
        return res.json();
      })
      .then(() => {
        alert("Komentarz został dodany!");
        setShowModal(false);
        setComment("");
        // Opcjonalnie: odśwież dane zamówień
        fetch("http://127.0.0.1:8000/api/orders/")
          .then((res) => res.json())
          .then((data) => setOrders(data));
      })
      .catch((err) => {
        console.error(err);
        alert("Wystąpił błąd podczas dodawania komentarza.");
      });
  };

  const handleAddOrder = () => {
    const formData = new FormData();
    formData.append("numer", newOrder.numer);
    formData.append("osoba", newOrder.osoba);
    formData.append("cena", newOrder.cena);
    formData.append("status", newOrder.status);

    fetch("http://127.0.0.1:8000/api/orders/", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Błąd podczas dodawania zamówienia");
        }
        return res.json();
      })
      .then(() => {
        alert("Zamówienie zostało dodane!");
        setShowAddOrderModal(false);
        setNewOrder({ numer: "", osoba: "", cena: 0, status: "Oczekiwanie" });
        // Odśwież dane zamówień
        fetch("http://127.0.0.1:8000/api/orders/")
          .then((res) => res.json())
          .then((data) => setOrders(data));
      })
      .catch((err) => {
        console.error(err);
        alert("Wystąpił błąd podczas dodawania zamówienia.");
      });
  };

  const filteredOrders = orders.filter(
    (order) =>
      (order.numer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.osoba || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Ładowanie...</div>;
  if (!orders.length) return <div>Brak zamówień.</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "52px",
      }}
    >
      <h2
        className="text-center"
        style={{ color: "#111", marginBottom: "24px" }}
      >
        Tabela Zamówień
      </h2>

      {/* Okienko wyszukiwania */}
      <div
        style={{
          width: "90%",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <input
          type="text"
          placeholder="Wyszukaj zamówienie po numerze lub osobie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "45%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#111",
          }}
        />

        {/* Dodanie zamówienia */}
        <button
          onClick={() => setShowAddOrderModal(true)}
          style={{
            backgroundColor: "#38b6ff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Dodaj Zamówienie
        </button>
      </div>

      {/* Tabela zamówień */}
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
              <th onClick={() => handleSort("numer")} style={{ cursor: "pointer" }}>
                Numer Zamówienia {getSortIndicator("numer")}
              </th>
              <th onClick={() => handleSort("osoba")} style={{ cursor: "pointer" }}>
                Osoba {getSortIndicator("osoba")}
              </th>
              <th onClick={() => handleSort("cena")} style={{ cursor: "pointer" }}>
                Wartość Zamówienia {getSortIndicator("cena")}
              </th>
              <th onClick={() => handleSort("timeline_progress_scaled")} style={{ cursor: "pointer" }}>
                Termometr {getSortIndicator("timeline_progress_scaled")}
              </th>
              <th>Komentarze</th>
              <th>Deadline</th>
              <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                Status {getSortIndicator("status")}
              </th>
              <th>Dodaj Komentarz</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.slice(0, 50).map((order) => (
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
                    onChange={(e) => {
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
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                  >
                    Dodaj Komentarz
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal dodania zamówienia */}
      {showAddOrderModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginBottom: "20px", textAlign: "center", color: "#111" }}>
              Dodaj nowe zamówienie
            </h3>
            <input
              type="text"
              placeholder="Numer zamówienia"
              value={newOrder.numer}
              onChange={(e) => setNewOrder({ ...newOrder, numer: e.target.value })}
              style={{
                width: "90%",
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#111",
              }}
            />
            <input
              type="text"
              placeholder="Osoba"
              value={newOrder.osoba}
              onChange={(e) => setNewOrder({ ...newOrder, osoba: e.target.value })}
              style={{
                width: "90%",
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#111",
              }}
            />
            <input
              type="number"
              placeholder="Cena"
              value={newOrder.cena}
              onChange={(e) => setNewOrder({ ...newOrder, cena: e.target.value })}
              style={{
                width: "90%",
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#111",
              }}
            />
            <select
              value={newOrder.status}
              onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
              style={{
                width: "90%",
                marginBottom: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#111",
              }}
            >
              <option value="Oczekiwanie">Oczekiwanie</option>
              <option value="W trakcie">W trakcie</option>
              <option value="Zrealizowane">Zrealizowane</option>
            </select>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn btn-primary"
                onClick={handleAddOrder}
                style={{ width: "48%" }}
              >
                Dodaj
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddOrderModal(false)}
                style={{ width: "48%" }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginBottom: "20px", textAlign: "center", color: "#111" }}>
              Komentarz do zamówienia: <strong>{selectedOrder.numer}</strong>
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Dodaj komentarz"
              style={{
                width: "90%",
                height: "100px",
                marginBottom: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
                color: "#111",
                resize: "none",
              }}
            ></textarea>
            <input
              type="text"
              value={new Date().toLocaleDateString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
              readOnly
              style={{
                width: "90%",
                marginBottom: "20px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#f8f9fa",
                color: "#111",
                fontWeight: "bold",
                cursor: "not-allowed",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn btn-primary"
                onClick={handleAddComment}
                style={{ width: "48%" }}
              >
                Dodaj
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ width: "48%" }}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}