import React, { useState, useEffect } from "react";
import "../App.css";

export default function OrderDetailPage({ orderId, onBack, token }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError("");
    try {
      // Pobierz szczegóły zamówienia
      const res = await fetch(`http://127.0.0.1:8000/api/order/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Nie znaleziono zamówienia");

      const data = await res.json();
      setOrder({
        ...data,
        comments_count: data.comments_count ?? 0,
        statusNormalized: data.status ?? "Brak",
      });

      setOrderDetails([
        {
          name: data.towar,
          quantity: data.ilosc,
          price: data.cena,
          notes: data.firma,
        },
      ]);

      // Pobierz komentarze
      await fetchComments(orderId);
    } catch (err) {
      setError(err.message || "Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (id = orderId) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/comments/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setComments([]);
        setOrder((prev) => (prev ? { ...prev, comments_count: 0 } : prev));
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.comments)
        ? data.comments
        : [];
      setComments(list);
      setOrder((prev) => (prev ? { ...prev, comments_count: list.length } : prev));
    } catch {
      setComments([]);
      setOrder((prev) => (prev ? { ...prev, comments_count: 0 } : prev));
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return alert("Komentarz nie może być pusty");

    try {
      const formData = new URLSearchParams();
      formData.append("comment", newComment);
      formData.append("text", newComment);
      formData.append("tresc", newComment);

      const res = await fetch(`http://127.0.0.1:8000/comments/${orderId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error("Błąd przy dodawaniu komentarza");

      await fetchComments(orderId);
      setNewComment("");
      alert("Komentarz został dodany!");
    } catch (err) {
      alert(err.message || err);
    }
  };

  if (loading) {
    return <div style={{ marginTop: 52, textAlign: "center" }}>Ładowanie szczegółów zamówienia...</div>;
  }

  if (error) {
    return (
      <div style={{ marginTop: 52, maxWidth: 1200, margin: "52px auto", padding: 20 }}>
        <button onClick={onBack} className="btn report-btn">← Powrót do listy zamówień</button>
        <div style={{ color: "red", padding: 20, backgroundColor: "#ffe6e6", borderRadius: 8 }}>
          <strong>Błąd:</strong> {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ marginTop: 52, maxWidth: 1200, margin: "52px auto", padding: 20 }}>
        <button onClick={onBack} className="btn report-btn">← Powrót do listy zamówień</button>
        <div style={{ padding: 20, backgroundColor: "#f8f9fa", borderRadius: 8 }}>Nie znaleziono zamówienia.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 52, padding: 20, maxWidth: 1200, margin: "52px auto" }}>
      {/* Przycisk powrotu */}
      <button onClick={onBack} className="btn report-btn" style={{ marginBottom: 20 }}>
        ← Powrót do listy zamówień
      </button>

      {/* Nagłówek zamówienia */}
      <div style={{ backgroundColor: "#38b6ff", color: "#fff", padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 10px 0" }}>Zamówienie: {order.numer || order.id}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><strong>Osoba:</strong> {order.osoba || "Brak"}</div>
          <div><strong>Wartość:</strong> {order.cena || 0} zł</div>
          <div><strong>Status:</strong> {order.status || "Brak"}</div>
          <div><strong>Data zamówienia:</strong> {order.data_zamowienia || "Brak"}</div>
          <div><strong>Deadline:</strong> {order.data_potwierdzona || "Brak"}</div>
          <div><strong>Liczba komentarzy:</strong> {order.comments_count || 0}</div>
        </div>
      </div>

      {/* Elementy zamówienia */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: "#111", marginBottom: 10 }}>Elementy zamówienia</h3>
        {orderDetails.length ? (
          <div style={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: 8, padding: 15, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #38b6ff" }}>
                  <th style={{ padding: 10, color:'black' }}>Nazwa</th>
                  <th style={{ padding: 10, color:'black' }}>Ilość</th>
                  <th style={{ padding: 10, color:'black' }}>Cena</th>
                  <th style={{ padding: 10, color:'black' }}>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 10, color:'black' }}>{item.name || "Brak"}</td>
                    <td style={{ padding: 10, color:'black' }}>{item.quantity || "-"}</td>
                    <td style={{ padding: 10, color:'black' }}>{item.price || "-"}</td>
                    <td style={{ padding: 10, color:'black' }}>{item.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: "#f8f9fa", 
            padding: 15, 
            borderRadius: 8, 
            color: 'black' }}>
              Brak elementów w tym zamówieniu.</div>
        )}
      </div>

      {/* Komentarze */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: "#111", marginBottom: 10 }}>Komentarze</h3>
        {commentsLoading ? (
          <div>Ładowanie komentarzy...</div>
        ) : comments.length ? (
          <div style={{ 
            backgroundColor: "#fff", 
            border: "1px solid #ccc", 
            borderRadius: 8, 
            color: 'black',
            padding: 15, 
            maxHeight: 300, 
            overflowY: "auto" }}>
            {comments.map((c) => (
              <div key={c.id ?? `${c.date}-${c.text}`} style={{ marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                <div style={{ fontWeight: "bold", whiteSpace: "pre-line" }}>{c.text ?? c.comment ?? ""}</div>
                <small style={{ color: "#666" }}>{c.date ?? c.created_at ?? ""}</small>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ backgroundColor: "#f8f9fa", padding: 15, borderRadius: 8, color:'black' }}>Brak komentarzy.</div>
        )}
      </div>

      {/* Formularz dodania komentarza */}
      <div style={{ backgroundColor: "#f8f9fa", border: "1px solid #ccc", borderRadius: 8, padding: 15, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, color: "#111" }}>Dodaj nowy komentarz</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
          placeholder="Wpisz komentarz..."
          style={{ width: "90%", padding: 10, borderRadius: 4, border: "1px solid #ccc", backgroundColor: "#fff", color: "#111" }}
        />
        <button onClick={handleAddComment} 
          className="btn report-btn">
          Dodaj komentarz
        </button>
      </div>
    </div>
  );
}
