import React, { useEffect, useState } from "react";
import OrderDetailPage from "./OrderDetailPage";
import "../App.css";

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [totalCount, setTotalCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [comment, setComment] = useState(""); // treść komentarza w modal
  //const [commentDeadline, setCommentDeadline] = useState(""); // deadline w formularzu komentarza
  const [commentsList, setCommentsList] = useState([]); // pobrane komentarze dla wybranego zamówienia
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState(""); // Wyszukiwanie
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null); // nowe: do wyświetlenia szczegółów

  useEffect(() => {
    loadOrders();
  }, [page]);


  const daysUntilDeadline = (o) => {
    if (!o || !o.data_oczekiwana) return null;

    const today = new Date();
    const deadline = new Date(o.data_oczekiwana);

    // Wyzerowanie czasu, żeby uniknąć problemów strefowych
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const ms = deadline - today;
    return Math.round(ms / (1000 * 60 * 60 * 24));
  };

  // helper: normalizuj pojedyncze zamówienie (status, deadline, progress, time_diff)
  const normalizeOrder = (o) => {
    if (!o) return {};

    // Pola podstawowe
    const numer = o.numer ?? o.nr ?? o.id ?? "";
    const osoba = o.osoba ?? o.pracownik ?? o.user ?? "";
    const cena = Number(o.cena ?? o.wartosc ?? 0);

    // data potwierdzona / deadline
    const data_potwierdzona =
      o.data_potwierdzona ??
      o.deadline ??
      o.data_oczekiwana ??
      null;

    // --- STATUS ---
    const raw = (o.status ?? o.stan ?? "").toString().trim();
    let status = raw || "Brak";
    
    if(status === "NULL" || status === "") {
      status = "Brak";
    } else if (status === "Oczekiwanie") {
      status = "Oczekiwanie";
    } else if (status === "W trakcie") {
      status = "W trakcie";
    } else if (status === "Zrealizowane") {
      status = "Zrealizowane";
    }
    // jeżeli jest data zamknięcia → ustaw Zrealizowane
    // if (o.data_zamkniecia != 'NULL' ) {
    //   status = "Zrealizowane";
    // }

    // --- LICZENIE DNI ---
    // const parseDate = (d) => (d ? new Date(d) : null);

    // const d1 = parseDate(o.data_zamowienia);
    // const d2 = parseDate(o.data_potwierdzona);

    // let timeDiff = null;

    // if (d1 && d2) {
    //   const ms = d2 - d1;
    //   timeDiff = Math.round(ms / (1000 * 60 * 60 * 24));
    // }

    const timeDiff = daysUntilDeadline(o);

    // komentarze
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


  const loadOrders = () => {
    setLoading(true);

    fetch(`http://127.0.0.1:8000/api/orders/?page=${page}&page_size=${pageSize}`)
      .then((res) => res.json())
      .then((data) => {
        const ordersList = Array.isArray(data) ? data : (data.results || []);

        // ⬇ tu ustawiamy totalCount z backendu
        if (data.count !== undefined) {
          setTotalCount(data.count);
        } else {
          // fallback — jeśli zwracasz listę bez paginacji
          setTotalCount(ordersList.length);
        }

        const normalized = ordersList.map(normalizeOrder);
        setOrders(normalized);

        // pobieranie liczby komentarzy — uproszczone
        Promise.allSettled(
          normalized.map((o) =>
            fetch(`http://127.0.0.1:8000/comments/${o.id}/`)
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


  // pomocnik: pobierz cookie
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // pobierz komentarze dla zamówienia — ZWRACA Promise z listą i aktualizuje licznik w tabeli
  const fetchComments = (orderId) => {
    setCommentsLoading(true);
    return fetch(`http://127.0.0.1:8000/comments/${orderId}/`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.warn("fetchComments non-ok:", res.status, txt);
          return [];
        }
        return res.json().catch(() => []);
      })
      .then((data) => {
        let list = [];
        if (!data) list = [];
        else if (Array.isArray(data)) list = data;
        else if (data.comments) list = Array.isArray(data.comments) ? data.comments : [];
        else list = [];

        setCommentsList(list);

        // zaktualizuj licznik komentarzy w liście zamówień
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, comments_count: list.length, comments_count_num: list.length }
              : o
          )
        );

        // zwróć listę do wywołującego
        return list;
      })
      .catch((err) => {
        console.error("Błąd fetchComments:", err);
        setCommentsList([]);
        return [];
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
      let va = a[key];
      let vb = b[key];
      // --------- SORTOWANIE DAT ---------
      // Sprawdzamy, czy wartości wyglądają na daty YYYY-MM-DD
      const isDateA = typeof va === "string" && /^\d{4}-\d{2}-\d{2}$/.test(va);
      const isDateB = typeof vb === "string" && /^\d{4}-\d{2}-\d{2}$/.test(vb);

      if (isDateA && isDateB) {
        const da = new Date(va);
        const db = new Date(vb);
        return direction === "asc" ? da - db : db - da;
      }

      // --- SORTOWANIE LICZB ---
      // Jeśli pola wyglądają jak liczby, to porównujemy je jako liczby
      const na = parseFloat(va);
      const nb = parseFloat(vb);

      const aIsNumber = !isNaN(na);
      const bIsNumber = !isNaN(nb);

      if (aIsNumber && bIsNumber) {
        return direction === "asc" ? na - nb : nb - na;
      }

      // --- SORTOWANIE TEKSTU ---
      const sa = (va ?? "").toString().toLowerCase();
      const sb = (vb ?? "").toString().toLowerCase();
      if (sa < sb) return direction === "asc" ? -1 : 1;
      if (sa > sb) return direction === "asc" ? 1 : -1;
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

  // logika kolorów i textual label dla termometru - używa znormalizowanych pól
  const thermometerColor = (order) => {
    if (!order) return "#28a745";

    if (order.statusNormalized === "Zrealizowane") return "#28a745";

    const days = parseDays(order.time_diff_num);
    if (days === null) return "#6c757d";

    if (days < 0) return "#dc3545";    // po terminie
    if (days <= 3) return "#dc3545";   // 0-3 dni
    if (days <= 7) return "#ffc107";   // 4-7 dni
    return "#28a745";                  // więcej niż 7 dni
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

    // NIE USUWAMY SPACJI — tylko blokujemy pusty komentarz
    const textValue = comment || "";
    if (textValue.replace(/\s/g, "") === "") {
      alert("Komentarz nie może być pusty");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const jsonPayload = {
        text: textValue,
        comment: textValue,
        tresc: textValue,
      };

      if (token) {
        const res = await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jsonPayload),
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
        form.append("text", textValue);
        form.append("comment", textValue);
        form.append("tresc", textValue);

        const res = await fetch(`http://127.0.0.1:8000/comments/${selectedOrder.id}/`, {
          method: "POST",
          credentials: "include",
          headers: csrftoken ? { "X-CSRFToken": csrftoken } : {},
          body: form,
        });
        if (!res.ok) {
          const text = await res.text();
          let parsed;
          try { parsed = JSON.parse(text); } catch { parsed = text; }
          throw new Error((parsed && parsed.error) ? parsed.error : text || res.status);
        }
      }

      // po udanym dodaniu pobierz ponownie komentarze i zaktualizuj licznik
      await fetchComments(selectedOrder.id);

      setComment("");
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
            {filteredOrders.map((order) => {
              return (
                <tr 
                  key={order.id}
                  onClick={() => setSelectedOrderDetail(order)}
                  style={{ cursor: "pointer", transition: "background-color 0.2s" }}
                  onMouseEnter={(ev) => ev.currentTarget.style.backgroundColor = "#f0f0f0"}
                  onMouseLeave={(ev) => ev.currentTarget.style.backgroundColor = ""}
                >
                  <td>{order.numer || order.id}</td>
                  <td>{order.osoba || "Brak"}</td>
                  <td>{order.cena}</td>
                  <td>{order.data_zamowienia}</td>
                      {/* <div
                        className="progress"
                        style={{
                          height: 25,
                          backgroundColor: "#f0f0f0",      // ⬅️ neutralne tło zamiast thermometerColor
                          position: "relative",
                          minWidth: "160px",
                          whiteSpace: "nowrap",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: 4,
                        }}
                      > 
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 8,
                          backgroundColor: "#999",        // ⬅️ neutralny pasek zamiast kolorowego
                          borderRadius: "4px 0 0 4px",
                          zIndex: 2,
                        }}
                      />
                      <span
                        className="data-label"
                        style={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#333",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          }}
                        >
                        {order.data_zamowienia  ?? "Brak"}
                      </span>
                    </div>
                  </td> */}

                  <td>{order.comments_count ?? 0}</td>
                  {/* <td style={{ textAlign: "center" }}>
                    <span style={{
                      color: order.is_overdue_bool ? "red" : "#111",
                      fontWeight: order.is_overdue_bool ? "700" : "400",
                    }}>
                      {order.deadlineValue}
                    </span>
                  </td> */}

                  <td style={{
                    textAlign: "center",
                    backgroundColor: thermometerColor(order),   // ⬅️ TERAZ KOLOR W TYM MIEJSCU
                    color: "#fff",
                    fontWeight: "bold",
                    borderRadius: 4,
                    }}>
                    <span>
                      {order.deadlineValue}
                    </span>
                  </td>

                  <td onClick={(ev) => ev.stopPropagation()}>
                    <select
                      value={order.statusNormalized || "Brak"}
                      className="form-select"
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (window.confirm("Czy na pewno chcesz zastosować zmiany?")) {
                          updateOrderStatus(order.id, newStatus);
                        } else {
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
                  <td onClick={(ev) => ev.stopPropagation()}>
                    <button
                      //className="btn btn-primary btn-sm"
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
              );
            })}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="btn report-btn"
            >
            ◀ Poprzednia
            </button>

            <span style={{ fontWeight: "bold", color:"black" }}>
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

            {/* formularz dodania komentarza (wg comments.html) */}
            <div style={{ marginTop: 8 }}>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label style={{ display: "block", marginBottom: 6, color: "black" }}>Dodaj komentarz</label>
                <textarea
                  className="form-control"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: 8, borderRadius: 4 }}
                />
              </div>
              {/* <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: "block", marginBottom: 6 }}>Deadline (opcjonalnie)</label>
                <input
                  type="date"
                  className="form-control"
                  value={commentDeadline}
                  onChange={(e) => setCommentDeadline(e.target.value)}
                  style={{ padding: 8, borderRadius: 4, width: "100%" }}
                />
              </div> */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
      )};
    </div>
  );
}