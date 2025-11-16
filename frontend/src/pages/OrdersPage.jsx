import React, { useEffect, useState } from "react";
import OrderDetailPage from "./OrderDetailPage";
import "../App.css";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState(""); // treść komentarza w modal
  const [commentDeadline, setCommentDeadline] = useState(""); // deadline w formularzu komentarza
  const [commentsList, setCommentsList] = useState([]); // pobrane komentarze dla wybranego zamówienia
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState(""); // Wyszukiwanie
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null); // nowe: do wyświetlenia szczegółów

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/orders/")
      .then((res) => res.json())
      .then((data) => {
        const ordersList = Array.isArray(data) ? data : (data.results || []);
        console.log("Pierwszy order:", ordersList[0]); // <- tutaj zobaczysz wszystkie pola
        setOrders(ordersList);
      })
      .catch((err) => {
        console.error("Błąd pobierania zamówień:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  // pomocnik: pobierz cookie
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // pobierz komentarze dla zamówienia
  const fetchComments = (orderId) => {
    setCommentsLoading(true);
    fetch(`http://127.0.0.1:8000/comments/${orderId}/`)
      .then(async (res) => {
        if (!res.ok) {
          // może backend zwraca HTML (np. przekierowanie) -> traktujemy jako brak
          const txt = await res.text().catch(() => "");
          console.warn("fetchComments non-ok:", res.status, txt);
          return [];
        }
        return res.json().catch(() => []); // jeśli nie JSON -> pusta lista
      })
      .then((data) => {
        // Obsługa różnych formatów odpowiedzi
        if (!data) {
          setCommentsList([]);
        } else if (Array.isArray(data)) {
          setCommentsList(data);
        } else if (data.comments) {
          setCommentsList(Array.isArray(data.comments) ? data.comments : []);
        } else {
          setCommentsList([]);
        }
      })
      .catch((err) => {
        console.error("Błąd fetchComments:", err);
        setCommentsList([]);
      })
      .finally(() => setCommentsLoading(false));
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedOrders = [...orders].sort((a, b) => {
      const va = (a[key] ?? "").toString().toLowerCase();
      const vb = (b[key] ?? "").toString().toLowerCase();
      if (va < vb) return direction === "asc" ? -1 : 1;
      if (va > vb) return direction === "asc" ? 1 : -1;
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

  // helper: normalizuj liczbę dni (time_diff może być string, null, itp.)
  const parseDays = (val) => {
    const n = Number(val);
    if (Number.isFinite(n)) return n;
    return 9999; // traktuj jako daleko w przyszłości
  };

  // logika kolorów i textual label dla termometru
  const thermometerColor = (order) => {
    // Jeśli status to Zrealizowane -> zawsze zielony
    if (order?.status === "Zrealizowane") {
      return "#28a745";
    }
    
    // Dla pozostałych statusów (Brak, Oczekiwanie, W trakcie) -> sprawdzaj dni
    if (order?.is_overdue) return "#dc3545";
    const days = parseDays(order?.time_diff);
    if (days <= 3) return "#dc3545";
    if (days <= 7) return "#ffc107";
    return "#28a745";
  };

  // aktualizuj status zamówienia (zgodnie z template index.html backend expects POST to update_status url)
  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        // jeśli używamy JWT -> wysyłamy JSON z Authorization
        const res = await fetch(`http://127.0.0.1:8000/update_status/${orderId}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.status);
        }
      } else {
        // sesja + CSRF -> FormData + credentials
        const csrftoken = getCookie("csrftoken");
        const form = new FormData();
        form.append("status", newStatus);
        const res = await fetch(`http://127.0.0.1:8000/update_status/${orderId}/`, {
          method: "POST",
          credentials: "include",
          headers: csrftoken ? { "X-CSRFToken": csrftoken } : {},
          body: form,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.status);
        }
      }
      // odśwież listę zamówień
      loadOrders();
    } catch (err) {
      console.error("Błąd update status:", err);
      alert("Błąd aktualizacji statusu: " + (err.message || err));
      // odśwież dane lokalnie jeżeli potrzebne
      loadOrders();
    }
  };

  const handleAddComment = async () => {
    if (!selectedOrder) return;

    try {
      const payload = {
        text: comment,
        deadline: commentDeadline || null,
      };

      const token = localStorage.getItem("token");
      // jeśli mamy token - wysyłamy JSON z Authorization; inaczej korzystamy z sesji (CSRF)
      if (token) {
        const res = await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.status);
        }
      } else {
        const csrftoken = getCookie("csrftoken");
        const form = new FormData();
        form.append("text", comment);
        if (commentDeadline) form.append("deadline", commentDeadline);
        const res = await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          credentials: "include",
          headers: csrftoken ? { "X-CSRFToken": csrftoken } : {},
          body: form,
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || res.status);
        }
      }

      // sukces
      setComment("");
      setCommentDeadline("");
      fetchComments(selectedOrder.id);
      loadOrders();
      alert("Komentarz został dodany!");
    } catch (err) {
      console.error("Błąd podczas dodawania komentarza:", err);
      alert("Wystąpił błąd podczas dodawania komentarza: " + (err.message || err));
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      (order.numer || "").toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.osoba || "").toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // jeśli wybrany szczegół zamówienia -> wyświetl stronę szczegółów
  if (selectedOrderDetail) {
    return (
      <OrderDetailPage
        orderId={selectedOrderDetail.id}
        onBack={() => setSelectedOrderDetail(null)}
      />
    );
  }

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
        }}
      >
        <input
          type="text"
          placeholder="Wyszukaj zamówienie po numerze lub osobie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#111",
          }}
        />
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
              <th>Termometr</th>
              <th>Komentarze</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Dodaj Komentarz</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              // Sprawdź które pole deadline istnieje w odpowiedzi backendu
              const deadlineValue = 
                order?.next_deadline && order.next_deadline !== "" && order.next_deadline !== null && order.next_deadline !== "Brak"
                  ? order.next_deadline
                  : (order?.deadline || order?.data_deadline || "Brak");
              
              const barColor = thermometerColor(order);
              return (
                <tr 
                  key={order.id}
                  onClick={() => setSelectedOrderDetail(order)}
                  style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                >
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
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${order.timeline_progress_scaled ?? order.timeline_progress ?? 0}%`,
                          transition: "width 1s ease",
                          background: barColor,
                          minWidth: "0",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      />
                      <span
                        className="data-label"
                        style={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#fff",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                        }}
                      >
                        {order.data_potwierdzona ?? "Brak"}
                      </span>
                    </div>
                  </td>
                  <td>{order.comments_count ?? 0}</td>
                  <td
                    style={
                      deadlineValue !== "Brak"
                        ? { background: "red", color: "white", textAlign: "center" }
                        : { color: "#111", textAlign: "center" }
                    }
                  >
                    {deadlineValue}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status || "Brak"}
                      className="form-select"
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        // potwierdzenie jak w template
                        if (window.confirm("Czy na pewno chcesz zastosować zmiany?")) {
                          updateOrderStatus(order.id, newStatus);
                        } else {
                          // przywróć poprzednią wartość (przefetch)
                          loadOrders();
                        }
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        fetchComments(order.id);
                        setShowModal(true);
                      }}
                    >
                      Dodaj Komentarz
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal komentarzy (wg comments.html) */}
      {showModal && selectedOrder && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              width: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ marginBottom: "10px", textAlign: "center", color: "#111" }}>
              Komentarze dla zamówienia: <strong>{selectedOrder.numer}</strong>
            </h3>

            {/* lista komentarzy */}
            <div style={{ marginBottom: 12 }}>
              {commentsLoading ? (
                <div>Ładowanie komentarzy...</div>
              ) : commentsList.length ? (
                <ul style={{ paddingLeft: 16 }}>
                  {commentsList.map((c) => (
                    <li key={c.id ?? `${c.date}-${c.text}` } style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "1rem" }}>{c.text ?? c.comment ?? ""}</div>
                      <small style={{ color: "#666" }}>
                        {c.date ?? c.created_at ?? ""}
                        { (c.deadline ?? c.deadline_date) ? (
                          <span style={{ color: "red", fontWeight: "bold", marginLeft: 8 }}>
                            (Deadline: {c.deadline ?? c.deadline_date})
                          </span>
                        ) : null}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>Brak komentarzy.</div>
              )}
            </div>

            {/* formularz dodania komentarza (wg comments.html) */}
            <div style={{ marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 6 }}>Dodaj komentarz</label>
                <textarea
                  className="form-control"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: 8, borderRadius: 4 }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6 }}>Deadline (opcjonalnie)</label>
                <input
                  type="date"
                  className="form-control"
                  value={commentDeadline}
                  onChange={(e) => setCommentDeadline(e.target.value)}
                  style={{ padding: 8, borderRadius: 4, width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={handleAddComment} className="btn btn-primary" style={{ width: "48%" }}>
                  Dodaj
                </button>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ width: "48%" }}>
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}