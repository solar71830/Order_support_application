import React, { useState, useEffect } from "react";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [newNews, setNewNews] = useState({ title: "", content: "" });
  const [editingNews, setEditingNews] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const storedNews = JSON.parse(localStorage.getItem("news")) || [];
    setNews(storedNews);
  }, []);

  const saveNewsToLocalStorage = (updatedNews) => {
    localStorage.setItem("news", JSON.stringify(updatedNews));
  };

  const handleAddNews = () => {
    const newId = news.length ? Math.max(...news.map((n) => n.id)) + 1 : 1;
    const currentUser = (() => {
      try {
        const u = JSON.parse(localStorage.getItem("userInfo"));
        return u?.username || "Anonimowy";
      } catch {
        return "Anonimowy";
      }
    })();
    const updatedNews = [
      {
        ...newNews,
        id: newId,
        author: currentUser,
        createdAt: new Date().toISOString(),
      },
      ...news,
    ];
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews);
    setNewNews({ title: "", content: "" });
    setShowAddForm(false);
  };

  const handleEditNews = (id) => {
    const updatedNews = news.map((n) => (n.id === id ? editingNews : n));
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews);
    setEditingNews(null);
  };

  const handleDeleteNews = (id) => {
    const updatedNews = news.filter((n) => n.id !== id);
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews);
    setEditingNews(null);
  };

  return (
    <div className="white-box">
      <h2 style={{ color: "#111", marginBottom: "20px", textAlign: "center" }}>
        Aktualności
      </h2>

      {/* Przycisk do wyświetlenia formularza dodania nowej aktualności (dostępny dla wszystkich) */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="btn report-btn"
          style={{ marginBottom: "10px" }}
      >
        {showAddForm ? "Ukryj formularz" : "Dodaj nową aktualność"}
      </button>

      {/* Formularz dodania nowej aktualności */}
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
          <h3 style={{ color: "#111", textAlign: "left" }}>Dodaj nową aktualność</h3>
          <input
            type="text"
            placeholder="Tytuł"
            value={newNews.title}
            onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
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
            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
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

      {/* Lista aktualności */}
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

            {/* Edytuj / Usuń dostępne dla wszystkich */}
            <div style={{ display: "flex", gap: "8px", marginLeft: "10px" }}>
              <button
                onClick={() => setEditingNews(item)}
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

      {/* Formularz edycji aktualności (dostępny dla każdego kiedy editingNews ustawione) */}
      {editingNews && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h3 style={{ color: "#111", textAlign: "left" }}>Edytuj aktualność</h3>
          <input
            type="text"
            placeholder="Tytuł"
            value={editingNews.title}
            onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
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
            onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })}
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
            }}
          ></textarea>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <button
              onClick={() => handleEditNews(editingNews.id)}
              className="btn report-btn"
            >
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
    </div>
  );
}