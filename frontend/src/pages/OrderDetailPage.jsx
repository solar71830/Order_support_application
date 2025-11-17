import React, { useState, useEffect } from "react";
import "../App.css";

export default function OrderDetailPage({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentDeadline, setCommentDeadline] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError("");
    try {
      // Pobierz listę wszystkich zamówień i znajdź to o danym ID
      const ordersRes = await fetch(`http://127.0.0.1:8000/api/orders/`);
      if (!ordersRes.ok) {
        throw new Error(`Błąd pobierania zamówień: ${ordersRes.status}`);
      }
      const ordersData = await ordersRes.json();
      const ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.results || []);
      
      // Znajdź zamówienie o danym ID
      const foundOrder = ordersList.find(o => o.id === orderId || o.id === parseInt(orderId));
      if (!foundOrder) {
        throw new Error("Nie znaleziono zamówienia na liście");
      }
      
      console.log("Zamówienie:", foundOrder);
      setOrder(foundOrder);

      // Pobierz szczegóły zamówienia
      try {
        const detailsRes = await fetch(`http://127.0.0.1:8000/api/order/${orderId}/`);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          // Stwórz tablicę z jednym elementem (towar)
          const item = {
            name: detailsData.towar,
            quantity: detailsData.ilosc,
            price: detailsData.cena,
            notes: detailsData.firma
          };
          setOrderDetails([item]);
        } else {
          setOrderDetails([]);
        }
      } catch (err) {
        console.warn("Błąd pobierania szczegółów:", err);
        setOrderDetails([]);
      }

      // Pobierz komentarze
      await fetchComments(orderId);
    } catch (err) {
      console.error("Błąd loadOrderDetail:", err);
      setError(err.message || "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const fetchComments = async (id = orderId) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/comments/${id}/`);
      if (!res.ok) {
        console.warn("Błąd pobierania komentarzy:", res.status);
        setComments([]);
        // zaktualizuj licznik w nagłówku na 0
        setOrder(prev => prev ? { ...prev, comments_count: 0 } : prev);
        return [];
      }
      const data = await res.json().catch(() => []);
      console.log("Komentarze:", data);

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data.comments && Array.isArray(data.comments)) list = data.comments;
      else list = [];

      setComments(list);
      // zaktualizuj licznik komentarzy w headerze zamówienia
      setOrder(prev => (prev ? { ...prev, comments_count: list.length } : prev));

      return list;
    } catch (err) {
      console.error("Błąd fetchComments:", err);
      setComments([]);
      setOrder(prev => prev ? { ...prev, comments_count: 0 } : prev);
      return [];
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Komentarz nie może być pusty");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const textValue = newComment.trim();

      // przygotuj payload z kilkoma wariantami nazw pola (kompatybilność)
      const jsonPayload = {
        text: textValue,
        comment: textValue,
        tresc: textValue,
        deadline: commentDeadline || null,
      };

      let res;
      if (token) {
        res = await fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jsonPayload),
        });
      } else {
        const csrftoken = getCookie("csrftoken");
        const form = new FormData();
        form.append("text", textValue);
        form.append("comment", textValue);
        form.append("tresc", textValue);
        if (commentDeadline) form.append("deadline", commentDeadline);

        res = await fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {
          method: "POST",
          credentials: "include",
          headers: csrftoken ? { "X-CSRFToken": csrftoken } : {},
          body: form,
        });
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let parsed;
        try { parsed = JSON.parse(txt); } catch { parsed = txt; }
        throw new Error((parsed && parsed.error) ? parsed.error : txt || res.status);
      }

      // po udanym dodaniu odśwież komentarze i licznik w nagłówku
      const list = await fetchComments(orderId);

      setNewComment("");
      setCommentDeadline("");

      alert("Komentarz został dodany!");
    } catch (err) {
      console.error("Błąd przy dodawaniu komentarza:", err);
      alert("Błąd: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: "52px", textAlign: "center", padding: "20px", color: "#111" }}>
        Ładowanie szczegółów zamówienia...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: "52px", padding: "20px", maxWidth: "1200px", margin: "52px auto" }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: "#38b6ff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Powrót do listy zamówień
        </button>
        <div style={{ color: "red", padding: "20px", backgroundColor: "#ffe6e6", borderRadius: "8px" }}>
          <strong>Błąd:</strong> {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ marginTop: "52px", padding: "20px", maxWidth: "1200px", margin: "52px auto" }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: "#38b6ff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Powrót do listy zamówień
        </button>
        <div style={{ padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px", color: "#111" }}>
          Nie znaleziono zamówienia.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "52px", padding: "20px", maxWidth: "1200px", margin: "52px auto" }}>
      {/* Przycisk powrotu */}
      <button
        onClick={onBack}
        style={{
          backgroundColor: "#38b6ff",
          color: "#fff",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Powrót do listy zamówień
      </button>

      {/* Nagłówek zamówienia */}
      <div
        style={{
          backgroundColor: "#38b6ff",
          color: "#fff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0" }}>Zamówienie: {order.numer || order.id}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <strong>Osoba:</strong> {order.osoba || "Brak"}
          </div>
          <div>
            <strong>Wartość:</strong> {order.cena || 0} zł
          </div>
          <div>
            <strong>Status:</strong> {order.status || "Brak"}
          </div>
          <div>
            <strong>Data potwierdzenia:</strong> {order.data_potwierdzona || "Brak"}
          </div>
          <div>
            <strong>Deadline:</strong>{" "}
            {order.next_deadline && order.next_deadline !== "Brak" ? order.next_deadline : "Brak"}
          </div>
          <div>
            <strong>Liczba komentarzy:</strong> {order.comments_count || 0}
          </div>
        </div>
      </div>

      {/* Elementy zamówienia */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#111", marginBottom: "10px" }}>Elementy zamówienia</h3>
        {orderDetails && orderDetails.length > 0 ? (
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              overflowX: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #38b6ff" }}>
                  <th style={{ textAlign: "left", padding: "10px", color: "#111" }}>Nazwa</th>
                  <th style={{ textAlign: "left", padding: "10px", color: "#111" }}>Ilość</th>
                  <th style={{ textAlign: "left", padding: "10px", color: "#111" }}>Cena</th>
                  <th style={{ textAlign: "left", padding: "10px", color: "#111" }}>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px", color: "#111" }}>{item.name || item.title || "Brak"}</td>
                    <td style={{ padding: "10px", color: "#111" }}>{item.quantity || item.amount || "-"}</td>
                    <td style={{ padding: "10px", color: "#111" }}>{item.price || item.cost || "-"}</td>
                    <td style={{ padding: "10px", color: "#111" }}>{item.notes || item.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", color: "#111" }}>
            Brak elementów w tym zamówieniu.
          </div>
        )}
      </div>

      {/* Komentarze */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#111", marginBottom: "10px" }}>Komentarze</h3>
        {commentsLoading ? (
          <div style={{ color: "#111" }}>Ładowanie komentarzy...</div>
        ) : comments.length > 0 ? (
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {comments.map((c) => (
              <div
                key={c.id ?? `${c.date}-${c.text}`}
                style={{
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div style={{ color: "#111", fontWeight: "bold" }}>{c.text ?? c.comment ?? ""}</div>
                <small style={{ color: "#666" }}>
                  {c.date ?? c.created_at ?? ""}
                  {c.deadline || c.deadline_date ? (
                    <span style={{ color: "red", fontWeight: "bold", marginLeft: "8px" }}>
                      (Deadline: {c.deadline ?? c.deadline_date})
                    </span>
                  ) : null}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", color: "#111" }}>
            Brak komentarzy.
          </div>
        )}
      </div>

      {/* Formularz dodania komentarza */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ color: "#111", marginTop: "0" }}>Dodaj nowy komentarz</h3>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px", color: "#111", fontWeight: "bold" }}>
            Komentarz
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Wpisz komentarz..."
            rows={4}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#fff",
              color: "#111",
              fontFamily: "Arial, sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px", color: "#111", fontWeight: "bold" }}>
            Deadline (opcjonalnie)
          </label>
          <input
            type="date"
            value={commentDeadline}
            onChange={(e) => setCommentDeadline(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: "#fff",
              color: "#111",
            }}
          />
        </div>
        <button
          onClick={handleAddComment}
          style={{
            backgroundColor: "#38b6ff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Dodaj komentarz
        </button>
      </div>
    </div>
  );
}