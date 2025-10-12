import React, { useState, useEffect } from "react";
import Register from "./Register";
import EditUser from "./EditUser";
import DeleteUser from "./DeleteUser";

export default function ManageUsers({ token }) {
    const [view, setView] = useState("add");
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (token) {
            fetch("http://127.0.0.1:8000/users-list/", {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setUsers(data.users.map(u => u.username)));
        }
    }, [token]);

    return (
        <div className="white-box">
            <h2>Zarządzanie użytkownikami</h2>
            <div className="user-btn-group">
                <button onClick={() => setView("add")} className="blue-btn">Dodaj użytkownika</button>
                <button onClick={() => setView("edit")} className="blue-btn">Edytuj użytkownika</button>
                <button onClick={() => setView("delete")} className="blue-btn">Usuń użytkownika</button>
            </div>
            {view === "add" && <Register />}
            {view === "edit" && <EditUser token={token} users={users} />}
            {view === "delete" && <DeleteUser token={token} users={users} />}
        </div>
    );
}
