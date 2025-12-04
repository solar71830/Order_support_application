import React, { useState, useEffect } from "react";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [newNews, setNewNews] = useState({ title: "", content: "" });
  const [editingNews, setEditingNews] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // --------------------------- LOAD NEWS SAFELY ---------------------------
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("news"));
      if (Array.isArray(stored)) {
        const cleaned = stored.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.id === "number" &&
            item.title &&
            item.content
        );
        setNews(cleaned);
      } else {
        setNews([]);
      }
    } catch {
      setNews([]);
    }
  }, []);

  const saveNews = (updated) => {
    setNews(updated);
    localStorage.setItem("news", JSON.stringify(updated));
  };

  // --------------------------- ADD NEWS ---------------------------
  const handleAddNews = () => {
    if (!newNews.title.trim() || !newNews.content.trim()) return;

    const ids = news.map((n) => n.id).filter((id) => typeof id === "number");
    const newId = ids.length ? Math.max(...ids) + 1 : 1;

    let user = "Anonimowy";
    try {
      const u = JSON.parse(localStorage.getItem("userInfo"));
      if (u?.username) user = u.username;
    } catch {}

    const updated = [
      {
        id: newId,
        title: newNews.title,
        content: newNews.content,
        author: user,
        createdAt: new Date().toISOString(),
      },
      ...news,
    ];

    saveNews(updated);
    setNewNews({ title: "", content: "" });
    setShowAddForm(false);
  };

  // --------------------------- EDIT NEWS ---------------------------
  const startEditing = (item) => {
    setShowAddForm(false);
    setEditingNews({ ...item });
  };

  const handleEditNews = () => {
    if (!editingNews) return;

    const updated = news.map((n) =>
      n.id === editingNews.id ? editingNews : n
    );

    saveNews(updated);
    setEditingNews(null);
  };

  // --------------------------- DELETE NEWS ---------------------------
  const handleDeleteNews = (id) => {
    setShowAddForm(false);
    const updated = news.filter((n) => n.id !== id);
    saveNews(updated);

    if (editingNews?.id === id) setEditingNews(null);
  };

  return (
    <div className="white-box">
      <h2 style={{ color: "#111", marginBottom: "20px", textAlign: "center" }}>
        Aktualności
      </h2>

      {/* ---------------- FORMULARZ EDYCJI NA GÓRZE ---------------- */}
      {editingNews && (
        <div
          style={{
            marginBottom: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3 style={{ color: "#111", textAlign: "left" }}>
            Edytuj aktualność
          </h3>

          <input
            type="text"
            placeholder="Tytuł"
            value={editingNews.title}
            onChange={(e) =>
              setEditingNews({ ...editingNews, title: e.target.value })
            }
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#111",
              boxSizing: "border-box",
            }}
          />

          <textarea
            placeholder="Treść"
            value={editingNews.content}
            onChange={(e) =>
              setEditingNews({ ...editingNews, content: e.target.value })
            }
            style={{
              width: "100%",
              marginBottom: "10px",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#111",
              resize: "none",
              boxSizing: "border-box",
              minHeight: "120px",
            }}
          ></textarea>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <button onClick={handleEditNews} className="btn report-btn">
              Zapisz zmiany
            </button>

            <button
              onClick={() => handleDeleteNews(editingNews.id)}
              style={{
                backgroundColor: "red",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                flex: 1,
              }}
              className="btn report-btn"
            >
              Usuń
            </button>

            <button
              onClick={() => setEditingNews(null)}
              style={{
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                flex: 1,
              }}
              className="btn report-btn"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}

      {/* ---------------- FORMULARZ DODAWANIA (wyłączony przy edycji) ---------------- */}
      {!editingNews && (
        <>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="btn report-btn"
            style={{ marginBottom: "10px" }}
          >
            {showAddForm ? "Ukryj formularz" : "Dodaj nową aktualność"}
          </button>

          {showAddForm && (
            <div
              style={{
                marginBottom: "20px",
                padding: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#f8f9fa",
              }}
            >
              <h3 style={{ color: "#111", textAlign: "left" }}>
                Dodaj nową aktualność
              </h3>

              <input
                type="text"
                placeholder="Tytuł"
                value={newNews.title}
                onChange={(e) =>
                  setNewNews({ ...newNews, title: e.target.value })
                }
                style={{
                  width: "100%",
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#111",
                  boxSizing: "border-box",
                }}
              />

              <textarea
                placeholder="Treść"
                value={newNews.content}
                onChange={(e) =>
                  setNewNews({ ...newNews, content: e.target.value })
                }
                style={{
                  width: "100%",
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  color: "#111",
                  resize: "none",
                  boxSizing: "border-box",
                  minHeight: "120px",
                }}
              ></textarea>

              <button
                onClick={handleAddNews}
                className="btn report-btn"
                style={{ marginBottom: "10px" }}
              >
                Dodaj Aktualność
              </button>
            </div>
          )}
        </>
      )}

      {/* ---------------- LISTA AKTUALNOŚCI ---------------- */}
      <div>
        {news.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: "#38b6ff",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                textAlign: "left",
                flex: 1,
              }}
            >
              <div style={{ width: "100%" }}>
                <h3
                  style={{
                    margin: "0 0 5px 0",
                    color: "#111",
                    textAlign: "left",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: "0 0 5px 0",
                    color: "#111",
                    textAlign: "left",
                    whiteSpace: "pre-wrap", // <--- ENTERY DZIAŁAJĄ
                  }}
                >
                  {item.content}
                </p>

                <small
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Autor: {item.author || "Anonimowy"}{" "}
                  {item.createdAt &&
                    ` • ${new Date(item.createdAt).toLocaleDateString("pl-PL")}`}
                </small>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginLeft: "10px" }}>
              <button
                onClick={() => startEditing(item)}
                className="btn report-btn"
              >
                Edytuj
              </button>
              <button
                onClick={() => handleDeleteNews(item.id)}
                className="btn report-btn"
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
