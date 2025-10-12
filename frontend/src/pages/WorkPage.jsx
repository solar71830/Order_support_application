import React, { useState, useEffect } from "react";

export default function WorkPage() {
  const [tasks, setTasks] = useState([]); // Lista zadań
  const [newTask, setNewTask] = useState({ title: "", assignedTo: "", status: "Oczekujące" }); // Formularz dodania zadania
  const [filter, setFilter] = useState(""); // Filtracja zadań

  // Funkcja do odczytu zadań z localStorage
  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    setTasks(storedTasks);
  }, []);

  // Funkcja do zapisu zadań w localStorage
  const saveTasksToLocalStorage = (updatedTasks) => {
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const handleAddTask = () => {
    const newId = tasks.length ? Math.max(tasks.map((t) => t.id)) + 1 : 1;
    const updatedTasks = [...tasks, { ...newTask, id: newId }];
    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
    setNewTask({ title: "", assignedTo: "", status: "Oczekujące" });
  };

  const handleUpdateTaskStatus = (id, status) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, status } : task
    );
    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
  };

  const handleDeleteTask = (id) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    saveTasksToLocalStorage(updatedTasks);
  };

  const filteredTasks = tasks.filter((task) =>
    filter ? task.assignedTo.toLowerCase().includes(filter.toLowerCase()) : true
  );

  return (
    <div className="white-box">
      <h2 style={{ textAlign: "center" }}>Kontrola pracy</h2>

      {/* Formularz dodania nowego zadania */}
      <div
        style={{
          marginBottom: "20px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3 style={{ color: "#111", textAlign: "left" }}>Dodaj nowe zadanie</h3>
        <input
          type="text"
          placeholder="Tytuł zadania"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#111",
          }}
        />
        <input
          type="text"
          placeholder="Przypisz do (np. imię pracownika)"
          value={newTask.assignedTo}
          onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#111",
          }}
        />
        <button
          onClick={handleAddTask}
          style={{
            backgroundColor: "#38b6ff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Dodaj zadanie
        </button>
      </div>

      {/* Filtracja zadań */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Filtruj według pracownika"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "10px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#fff",
            color: "#111",
          }}
        />
      </div>

      {/* Lista zadań */}
      <div>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
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
            <div style={{ textAlign: "left" }}>
              <h3 style={{ margin: 0, color: "#111" }}>{task.title}</h3>
              <p style={{ margin: 0, color: "#111" }}>
                Przypisane do: {task.assignedTo}
              </p>
              <p style={{ margin: 0, color: "#111" }}>Status: {task.status}</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() =>
                  handleUpdateTaskStatus(
                    task.id,
                    task.status === "Oczekujące"
                      ? "W trakcie"
                      : task.status === "W trakcie"
                      ? "Zakończone"
                      : "Oczekujące"
                  )
                }
                style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Zmień status
              </button>
              <button
                onClick={() => handleDeleteTask(task.id)}
                style={{
                  backgroundColor: "red",
                  color: "#fff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
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