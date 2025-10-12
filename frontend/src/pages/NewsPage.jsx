import React, { useState, useEffect } from "react";

export default function NewsPage() {
  const [news, setNews] = useState([]); // Lista aktualności
  const [newNews, setNewNews] = useState({ title: "", content: "", image: null }); // Formularz dodania nowej aktualności
  const [editingNews, setEditingNews] = useState(null); // Aktualność do edycji
  const [showAddForm, setShowAddForm] = useState(false); // Kontrola widoczności formularza dodania aktualności

  // Funkcja do odczytu aktualności z localStorage
  useEffect(() => {
    const storedNews = JSON.parse(localStorage.getItem("news")) || [];
    setNews(storedNews);
  }, []);

  // Funkcja do zapisu aktualności w localStorage
  const saveNewsToLocalStorage = (updatedNews) => {
    localStorage.setItem("news", JSON.stringify(updatedNews));
  };

  const handleAddNews = () => {
    const newId = news.length ? Math.max(news.map((n) => n.id)) + 1 : 1;
    const updatedNews = [{ ...newNews, id: newId }, ...news]; // Dodaj nową aktualność na górę listy
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews); // Zapisz w localStorage
    setNewNews({ title: "", content: "", image: null });
    setShowAddForm(false); // Ukryj formularz po dodaniu aktualności
  };

  const handleEditNews = (id) => {
    const updatedNews = news.map((n) => (n.id === id ? editingNews : n));
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews); // Zapisz w localStorage
    setEditingNews(null);
  };

  const handleDeleteNews = (id) => {
    const updatedNews = news.filter((n) => n.id !== id); // Usuń aktualność o podanym ID
    setNews(updatedNews);
    saveNewsToLocalStorage(updatedNews); // Zapisz w localStorage
    setEditingNews(null); // Zamknij tryb edycji po usunięciu
  };

  return (
    <div className="white-box">
      <h2 style={{ color: "#111", marginBottom: "20px", textAlign: "center" }}>Aktualności</h2>

      {/* Przycisk do wyświetlenia formularza dodania nowej aktualności */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
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
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
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
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
              resize: "none",
            }}
          ></textarea>
          <input
            type="file"
            onChange={(e) => setNewNews({ ...newNews, image: URL.createObjectURL(e.target.files[0]) })}
            style={{
              marginBottom: "10px",
            }}
          />
          <button
            onClick={handleAddNews}
            style={{
              backgroundColor: "#38b6ff",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
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
            <div style={{ display: "flex", alignItems: "center", textAlign: "left" }}>
              {item.image && (
                <img
                  src={item.image}
                  alt="Aktualność"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "8px",
                    marginRight: "20px",
                  }}
                />
              )}
              <div>
                <h3 style={{ margin: 0, color: "#111", textAlign: "left" }}>{item.title}</h3>
                <p style={{ margin: 0, color: "#111", textAlign: "left" }}>{item.content}</p>
              </div>
            </div>
            <button
              onClick={() => setEditingNews(item)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#007bff",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Edytuj
            </button>
          </div>
        ))}
      </div>

      {/* Formularz edycji aktualności */}
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
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
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
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
              resize: "none",
            }}
          ></textarea>
          <input
            type="file"
            onChange={(e) => setEditingNews({ ...editingNews, image: URL.createObjectURL(e.target.files[0]) })}
            style={{
              marginBottom: "10px",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => handleEditNews(editingNews.id)}
              style={{
                backgroundColor: "#38b6ff",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                width: "48%",
              }}
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
                width: "48%",
              }}
            >
              Usuń
            </button>
          </div>
        </div>
      )}
    </div>
  );
}