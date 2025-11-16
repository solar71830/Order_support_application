import React, { useState, useEffect } from "react";
import Register from "./Register";
import EditUser from "./EditUser";
import DeleteUser from "./DeleteUser";

export default function ManageUsers({ token: propToken }) {
    const [view, setView] = useState("add");
    const [users, setUsers] = useState([]);
    const token = propToken || localStorage.getItem("token") || null;

    const fetchUsers = () => {
        if (!token) return;
        fetch("http://127.0.0.1:8000/users-list/", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error("Nie można pobrać listy użytkowników");
                return res.json();
            })
            .then(data => {
                // zakładam, że API zwraca { users: [...] } — dostosuj jeśli inaczej
                const list = Array.isArray(data.users) ? data.users.map(u => u.username) : [];
                setUsers(list);
            })
            .catch(err => {
                console.error(err);
                setUsers([]);
            });
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    return (
        <div className="white-box">
            <h2>Zarządzanie użytkownikami</h2>
            <div className="user-btn-group">
                <button onClick={() => setView("add")} className="blue-btn">Dodaj użytkownika</button>
                <button onClick={() => setView("edit")} className="blue-btn">Edytuj użytkownika</button>
                <button onClick={() => setView("delete")} className="blue-btn">Usuń użytkownika</button>
            </div>
            {view === "add" && <Register token={token} onDone={fetchUsers} />}
            {view === "edit" && <EditUser token={token} users={users} onDone={fetchUsers} />}
            {view === "delete" && <DeleteUser token={token} users={users} onDone={fetchUsers} />}
        </div>
    );
}
