import React, { useEffect, useState } from "react";
import OrderDetailPage from "./OrderDetailPage";
import "../App.css";

export default function OrdersPage({token}) {
  const [page, setPage] = useState(1);
  const pageSize = 100;

  const [totalCount, setTotalCount] = useState(0);
  const [orders, setOrders] = useState([]);
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

  // ----------------------------------------------
  // LOAD ORDERS WHEN PAGE CHANGES
  // ----------------------------------------------
  useEffect(() => {
    loadOrders();
  }, [page, reloadFlag]);

  // ----------------------------------------------
  // CALCULATE DAYS UNTIL DEADLINE
  // ----------------------------------------------
  const daysUntilDeadline = (o) => {
    if (!o || !o.data_oczekiwana) return null;
    const today = new Date();
    const deadline = new Date(o.data_oczekiwana);

    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.round((deadline - today) / (1000 * 60 * 60 * 24));
  };

  // ----------------------------------------------
  // NORMALIZE ORDER
  // ----------------------------------------------
  const normalizeOrder = (o) => {
    if (!o) return {};

    const numer = o.numer ?? o.nr ?? o.id ?? "";
    const osoba = o.osoba ?? o.pracownik ?? o.user ?? "";
    const cena = Number(o.cena ?? o.wartosc ?? 0);

    const data_potwierdzona =
      o.data_potwierdzona ??
      o.deadline ??
      o.data_oczekiwana ??
      null;

    let status = o.status ?? o.stan ?? "Brak";
    status = status === "NULL" || status === "" ? "Brak" : status;

    const timeDiff = daysUntilDeadline(o);

    const commentsCount =
      Number(
        o.comments_count ??
          (Array.isArray(o.comments) && o.comments.length) ??
          0
      );

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

  // ----------------------------------------------
  // LOAD ORDERS WITH FIXED PAGINATION LOGIC
  // ----------------------------------------------
  const loadOrders = () => {
    setLoading(true);

    fetch(`http://127.0.0.1:8000/api/orders/?page=${page}&page_size=${pageSize}`,{headers:{  Authorization: `Bearer ${token}`}})
      .then((res) => res.json())
      .then((data) => {
        const results = data.results || (Array.isArray(data) ? data : []);
        const normalized = results.map(normalizeOrder);

        setOrders(normalized);

        // -------------- FIXED PAGINATION LOGIC ----------------
        if (typeof data.count === "number") {
          // BACKEND MA PAGINACJĘ — DRF
          setTotalCount(data.count);
        } else if (data.next || data.previous) {
          // Backend ma paginację, ale nie zwraca count
          // Szacujemy liczbę rekordów
          setTotalCount(page * pageSize + results.length);
        } else {
          // Backend NIE ma paginacji — zwraca całą listę
          setTotalCount(results.length);
        }
        // ------------------------------------------------------

        // Load comment counts for each order
        Promise.allSettled(
          
          normalized.map((o) =>
            fetch(`http://127.0.0.1:8000/comments/${o.id}/`,{headers:{  Authorization: `Bearer ${token}`}})
          
              .then((r) => r.json().catch(() => []))
              .then((arr) => ({
                id: o.id,
                count: Array.isArray(arr) ? arr.length : 0,
              }))
              .catch(() => ({ id: o.id, count: 0 }))
          )
        ).then((results) => {
          const counts = results
            .filter((x) => x.status === "fulfilled")
            .map((x) => x.value);

          setOrders((prev) =>
            prev.map((o) => {
              const found = counts.find((c) => c.id === o.id);
              return found
                ? { ...o, comments_count: found.count, comments_count_num: found.count }
                : o;
            })
          );
        });
      })
      .catch((err) => {
        console.error("Błąd pobierania zamówień:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  // ----------------------------------------------
  // GET COOKIE
  // ----------------------------------------------
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // ----------------------------------------------
  // FETCH COMMENTS
  // ----------------------------------------------
  const fetchComments = (orderId) => {
    setCommentsLoading(true);
    return fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {headers:{  Authorization: `Bearer ${token}`}})
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

        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, comments_count: list.length, comments_count_num: list.length }
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

  // ----------------------------------------------
  // SORTING
  // ----------------------------------------------
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...orders].sort((a, b) => {
      let va = a[key];
      let vb = b[key];

      const isDateA = typeof va === "string" && /^\d{4}-\d{2}-\d{2}$/.test(va);
      const isDateB = typeof vb === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vb);

      if (isDateA && isDateB) {
        return direction === "asc" ? new Date(va) - new Date(vb) : new Date(vb) - new Date(va);
      }

      const na = parseFloat(va);
      const nb = parseFloat(vb);

      if (!isNaN(na) && !isNaN(nb)) {
        return direction === "asc" ? na - nb : nb - na;
      }

      const sa = (va ?? "").toString().toLowerCase();
      const sb = (vb ?? "").toString().toLowerCase();

      if (sa < sb) return direction === "asc" ? -1 : 1;
      if (sa > sb) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setOrders(sorted);
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

  // ----------------------------------------------
  // UPDATE ORDER STATUS
  // ----------------------------------------------
  const updateOrderStatus = async (orderId, newStatus) => {
    //const token = localStorage.getItem("token");
    try {
      if (token) {
        await fetch(`http://127.0.0.1:8000/update_status/${orderId}/`, {
          method: "POST",
          headers: {
           "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: formUpdateData.toString()
        });
      } else {
        const csrftoken = getCookie("csrftoken");
        const form = new FormData();
        form.append("status", newStatus);

        await fetch(`http://127.0.0.1:8000/update_status/${orderId}/`, {
          method: "POST",
          credentials: "include",
          headers: csrftoken ? { "X-CSRFToken": csrftoken, Authorization: `Bearer ${token}`, } : {},
          body: form,
        });
      }
      setReloadFlag(prev => !prev);
    } catch (err) {
      alert("Błąd aktualizacji statusu");
    }
  };

  // ----------------------------------------------
  // ADD COMMENT
  // ----------------------------------------------
  const handleAddComment = async () => {
    if (!selectedOrder) return;

    if (comment.replace(/\s/g, "") === "") {
      alert("Komentarz nie może być pusty");
      return;
    }

    try {
      //const token = localStorage.getItem("token");
      
      const formData = new URLSearchParams();
      formData.append("text", textValue);
      formData.append("comment", textValue);
      formData.append("tresc", textValue);
      
      if (token) {
        
        const res = await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
          body: formData.toString(),
        });
        
        if (!res.ok) {
          const text = await res.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text; }
          throw new Error((parsed && parsed.error) ? parsed.error : text || res.status);
        }
      } else {
        const csrftoken = getCookie("csrftoken");
        const form = new FormData();
        form.append("text", comment);

        await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          credentials: "include",
          headers: {Authorization: `Bearer ${token}` },
          body: form,
        });
      }

      await fetchComments(selectedOrder.id);
      setComment("");

    } catch (err) {
      alert("Błąd podczas dodawania komentarza");
    }
  };

  // ----------------------------------------------
  // SEARCH FILTER
  // ----------------------------------------------
  const filteredOrders = orders.filter(
    (order) =>
      (order.numer || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.osoba || "")
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // ----------------------------------------------
  // DETAIL VIEW
  // ----------------------------------------------
  if (selectedOrderDetail) {
    return (
      <OrderDetailPage
        orderId={selectedOrderDetail.id}
        onBack={() => setSelectedOrderDetail(null)}
        token = {token}
      />
    );
  }

  if (loading) return <div>Ładowanie...</div>;
  if (!orders.length) return <div>Brak zamówień.</div>;

  // ----------------------------------------------
  // RENDER PAGE
  // ----------------------------------------------
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 52 }}>
      <h2 style={{ color: "#111", marginBottom: 24 }}>Tabela Zamówień</h2>

      <div style={{ width: "90%", marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Wyszukaj zamówienie po numerze lub osobie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

      <div style={{ width: "100%", overflowX: "auto", marginBottom: 32 }}>
        <table
          className="orders-table table text-dark"
          style={{ minWidth: 900, width: "fit-content", margin: "0 auto" }}
        >
          <thead>
            <tr>
              <th onClick={() => handleSort("numer")} style={{ cursor: "pointer" }}>
                Numer {getSortIndicator("numer")}
              </th>
              <th onClick={() => handleSort("osoba")} style={{ cursor: "pointer" }}>
                Osoba {getSortIndicator("osoba")}
              </th>
              <th onClick={() => handleSort("cena")} style={{ cursor: "pointer" }}>
                Wartość {getSortIndicator("cena")}
              </th>
              <th onClick={() => handleSort("data_zamowienia")} style={{ cursor: "pointer" }}>
                Data zamówienia {getSortIndicator("data_zamowienia")}
              </th>
              <th onClick={() => handleSort("comments_count_num")} style={{ cursor: "pointer" }}>
                Komentarze {getSortIndicator("comments_count_num")}
              </th>
              <th onClick={() => handleSort("data_oczekiwana")} style={{ cursor: "pointer" }}>
                Deadline {getSortIndicator("data_oczekiwana")}
              </th>
              <th>Status</th>
              <th>Dodaj Komentarz</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                onClick={() => setSelectedOrderDetail(order)}
                style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "#f0f0f0")}
                onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "")}
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
                      if (window.confirm("Czy na pewno chcesz zastosować zmiany?")) {
                        updateOrderStatus(order.id, e.target.value);
                      } else {
                        // zamiast loadOrders();
                        setReloadFlag(prev => !prev);
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
                    <option value="Brak" hidden>Brak</option>
                    <option value="Oczekiwanie">Oczekiwanie</option>
                    <option value="W trakcie">W trakcie</option>
                    <option value="Zrealizowane">Zrealizowane</option>
                  </select>
                </td>

                <td onClick={(ev) => ev.stopPropagation()}>
                  <button
                    className="btn report-btn"
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
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 20, gap: 10 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="btn report-btn"
          >
            ◀ Poprzednia
          </button>

          <span style={{ fontWeight: "bold", color: "black" }}>
            Strona {page} / {Math.ceil(totalCount / pageSize)}
          </span>

          <button
            disabled={page >= Math.ceil(totalCount / pageSize)}
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
            <h3 style={{ marginBottom: 10, textAlign: "center", color: "#111" }}>
              Komentarze dla zamówienia: <strong>{selectedOrder.numer}</strong>
            </h3>

            <div style={{ marginBottom: 12 }}>
              {commentsLoading ? (
                <div>Ładowanie komentarzy...</div>
              ) : commentsList.length ? (
                <ul style={{ paddingLeft: 16 }}>
                  {commentsList.map((c) => (
                    <li key={c.id ?? Math.random()} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "1rem", color: "#111", whiteSpace: "pre-wrap" }}>
                        {c.text ?? c.comment ?? ""}
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

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <button onClick={handleAddComment} className="btn report-btn" style={{ width: "48%" }}>
                  Dodaj
                </button>
                <button onClick={() => setShowModal(false)} className="btn report-btn" style={{ width: "48%" }}>
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
