import React, { useEffect, useState } from "react";
import OrderDetailPage from "./OrderDetailPage";
import "../App.css";

export default function OrdersPage({ token }) {
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState("");
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(false);

  // LOAD ALL ORDERS ONCE
  useEffect(() => {
    setLoading(true);

    fetch(`http://127.0.0.1:8000/api/orders/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then(async (data) => {
        const results = data.results || (Array.isArray(data) ? data : []);
        const normalized = results.map(normalizeOrder);
        const withComments = await Promise.all(
          normalized.map(async (order) => {
            const count = await fetchCommentsCount(order.id);
            return {
              ...order,
              comments_count: count,
              comments_count_num: count,
            };
          })
        );

        setAllOrders(withComments);
      })
      .catch((err) => {
        console.error("Błąd pobierania zamówień:", err);
        setAllOrders([]);
      })
      .finally(() => setLoading(false));
  }, [token, reloadFlag]);

  const daysUntilDeadline = (o) => {
    if (!o || !o.data_potwierdzona) return null;
    const today = new Date();
    const deadline = new Date(o.data_potwierdzona);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.round((deadline - today) / (1000 * 60 * 60 * 24));
  };

  const normalizeOrder = (o) => {
    if (!o) return {};

    const numer = o.numer ?? o.nr ?? o.id ?? "";
    const osoba = o.osoba ?? o.pracownik ?? o.user ?? "";
    const cena = Number(o.cena ?? o.wartosc ?? 0);

    const data_potwierdzona =
      o.data_potwierdzona ??
      o.data_zamowienia ??
      null;

    let status = o.status ?? o.stan ?? "Brak";
    status = status === "NULL" || status === "" ? "Brak" : status;

    const timeDiff = daysUntilDeadline(o);

    const commentsCount = Number(o.comments_count ?? 0);

    return {
      ...o,
      numer,
      osoba,
      cena,
      deadlineValue: data_potwierdzona,
      statusNormalized: status,
      time_diff_num: timeDiff,
      comments_count: commentsCount,
      comments_count_num: commentsCount,
    };
  };

  const fetchComments = (orderId) => {
    setCommentsLoading(true);
    return fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) return [];
        return res.json().catch(() => []);
      })
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.comments)
          ? data.comments
          : [];

        setCommentsList(list);

        setAllOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  comments_count: list.length,
                  comments_count_num: list.length,
                }
              : o
          )
        );

        return list;
      })
      .catch(() => {
        setCommentsList([]);
        return [];
      })
      .finally(() => setCommentsLoading(false));
  };

  const fetchCommentsCount = async (orderId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return 0;

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.comments)
        ? data.comments
        : [];

      return list.length;
    } catch {
      return 0;
    }
  };


  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...allOrders].sort((a, b) => {
      let va = a[key];
      let vb = b[key];

      const isDateA =
        typeof va === "string" && /^\d{4}-\d{2}-\d{2}$/.test(va);
      const isDateB =
        typeof vb === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vb);

      if (isDateA && isDateB) {
        return direction === "asc"
          ? new Date(va) - new Date(vb)
          : new Date(vb) - new Date(va);
      }

      const na = parseFloat(va);
      const nb = parseFloat(vb);

      if (!isNaN(na) && !isNaN(nb)) {
        return direction === "asc" ? na - nb : nb - na;
      }

      const sa = (va || "").toLowerCase();
      const sb = (vb || "").toLowerCase();

      if (sa < sb) return direction === "asc" ? -1 : 1;
      if (sa > sb) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setAllOrders(sorted);
    setPage(1);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key)
      return sortConfig.direction === "asc" ? "▲" : "▼";
    return "▲▼";
  };

  const parseDays = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 9999;
  };

  const thermometerColor = (order) => {
    if (!order) return "#28a745";
    if (order.statusNormalized === "Zrealizowane") return "#28a745";

    const days = parseDays(order.time_diff_num);
    if (days < 0) return "#dc3545";
    if (days <= 3) return "#dc3545";
    if (days <= 7) return "#ffc107";
    return "#28a745";
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const formUpdateData = new URLSearchParams();
      formUpdateData.append("status", newStatus);

      await fetch(`http://127.0.0.1:8000/update_status/${orderId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: formUpdateData.toString(),
      });

      setReloadFlag((prev) => !prev);
    } catch (err) {
      alert("Błąd aktualizacji statusu");
    }
  };

  const handleAddComment = async () => {
    if (!selectedOrder) return;

    if (comment.replace(/\s/g, "") === "") {
      alert("Komentarz nie może być pusty");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("comment", comment);

      const res = await fetch(
        `http://127.0.0.1:8000/comments/${selectedOrder.id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: formData.toString(),
        }
      );

      if (!res.ok) throw new Error("Błąd dodawania komentarza");

      await fetchComments(selectedOrder.id);
      setComment("");
    } catch (err) {
      alert("Błąd podczas dodawania komentarza");
    }
  };

  // FILTER + PAGINATION
  const filteredOrders = allOrders.filter(
    (order) =>
      (order.numer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.osoba || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageOrders = filteredOrders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  if (selectedOrderDetail) {
    return (
      <OrderDetailPage
        orderId={selectedOrderDetail.id}
        onBack={() => setSelectedOrderDetail(null)}
        token={token}
      />
    );
  }

  if (loading) return <div>Ładowanie...</div>;
  if (!allOrders.length) return <div>Brak zamówień.</div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 52,
      }}
    >
      <h2 style={{ color: "#111", marginBottom: 24 }}>Tabela Zamówień</h2>

      {/* SEARCH */}
      <div style={{ width: "90%", marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Wyszukaj zamówienie po numerze lub osobie..."
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ccc",
            borderRadius: 8,
            backgroundColor: "#fff",
            color: "#111",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          marginBottom: 32,
        }}
      >
        <table
          className="orders-table table text-dark"
          style={{ minWidth: 900, width: "fit-content", margin: "0 auto" }}
        >
          <thead>
            <tr>
              <th onClick={() => handleSort("numer")} style={{ cursor: "pointer" }}>
                Numer zamówienia {getSortIndicator("numer")}
              </th>
              <th onClick={() => handleSort("osoba")} style={{ cursor: "pointer" }}>
                Osoba {getSortIndicator("osoba")}
              </th>
              <th onClick={() => handleSort("cena")} style={{ cursor: "pointer" }}>
                Wartość {getSortIndicator("cena")}
              </th>
              <th
                onClick={() => handleSort("data_zamowienia")}
                style={{ cursor: "pointer" }}
              >
                Data zamówienia {getSortIndicator("data_zamowienia")}
              </th>
              <th
                onClick={() => handleSort("comments_count_num")}
                style={{ cursor: "pointer" }}
              >
                Komentarze {getSortIndicator("comments_count_num")}
              </th>
              <th
                onClick={() => handleSort("data_potwierdzona")}
                style={{ cursor: "pointer" }}
              >
                Deadline {getSortIndicator("data_potwierdzona")}
              </th>
              <th>Status</th>
              <th>Dodaj Komentarz</th>
            </tr>
          </thead>

          <tbody>
            {pageOrders.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedOrderDetail(order)}
                style={{
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(ev) =>
                  (ev.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseLeave={(ev) =>
                  (ev.currentTarget.style.backgroundColor = "")
                }
              >
                <td>{order.numer}</td>
                <td>{order.osoba || "Brak"}</td>
                <td>{order.cena}</td>
                <td>{order.data_zamowienia}</td>
                <td>{order.comments_count ?? 0}</td>

                <td
                  style={{
                    textAlign: "center",
                    backgroundColor: thermometerColor(order),
                    color: "#fff",
                    fontWeight: "bold",
                    borderRadius: 4,
                  }}
                >
                  {order.deadlineValue}
                </td>

                <td onClick={(ev) => ev.stopPropagation()}>
                  <select
                    value={order.statusNormalized}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm("Czy na pewno chcesz zastosować zmiany?")
                      ) {
                        updateOrderStatus(order.id, e.target.value);
                      } else {
                        setReloadFlag((prev) => !prev);
                      }
                    }}
                    style={{
                      width: "90%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      backgroundColor: "#fff",
                      color: "#111",
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

                <td onClick={(ev) => ev.stopPropagation()}>
                  <button
                    className="btn report-btn"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setSelectedOrder(order);
                      fetchComments(order.id);
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

        {/* PAGINATION */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 20,
            gap: 10,
          }}
        >
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="btn report-btn"
          >
            ◀ Poprzednia
          </button>

          <span style={{ fontWeight: "bold", color: "black" }}>
            Strona {page} / {Math.ceil(filteredOrders.length / pageSize)}
          </span>

          <button
            disabled={page >= Math.ceil(filteredOrders.length / pageSize)}
            onClick={() => setPage(page + 1)}
            className="btn report-btn"
          >
            Następna ▶
          </button>
        </div>
      </div>

      {/* COMMENT MODAL */}
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
              padding: 20,
              borderRadius: 8,
              width: 600,
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3
              style={{
                marginBottom: 10,
                textAlign: "center",
                color: "#111",
              }}
            >
              Komentarze dla zamówienia:{" "}
              <strong>{selectedOrder.numer}</strong>
            </h3>

            <div style={{ marginBottom: 12 }}>
              {commentsLoading ? (
                <div>Ładowanie komentarzy...</div>
              ) : commentsList.length ? (
                <ul style={{ paddingLeft: 16 }}>
                  {commentsList.map((c) => (
                    <li key={c.id ?? Math.random()} style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: "1rem",
                          color: "#111",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {c.text ?? ""}
                      </div>
                      <small style={{ color: "#444" }}>
                        {c.date ?? c.created_at ?? ""}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>Brak komentarzy.</div>
              )}
            </div>

            <div>
              <textarea
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                style={{
                  width: "90%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#111",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={handleAddComment}
                  className="btn report-btn"
                  style={{ width: "48%" }}
                >
                  Dodaj
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn report-btn"
                  style={{ width: "48%" }}
                >
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
