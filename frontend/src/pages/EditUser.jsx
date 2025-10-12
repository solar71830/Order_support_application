import React, { useState } from "react";

export default function EditUser({ token, users }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [position, setPosition] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage("");
        const formData = new URLSearchParams();
        formData.append("username", username);
        if (email) formData.append("email", email);
        if (password) formData.append("password", password);
        if (position) formData.append("position", position);

        try {
            const res = await fetch("http://127.0.0.1:8000/account-edit/", {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const text = await res.text();
            setMessage(text);
        } catch (err) {
            setMessage("Błąd połączenia z serwerem");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
            <h2>Edycja użytkownika</h2>
            <select value={username} onChange={e => setUsername(e.target.value)} required>
                <option value="">Wybierz użytkownika</option>
                {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input
                type="text"
                placeholder="Nazwa użytkownika"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Nowy email (opcjonalnie)"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Nowe hasło (opcjonalnie)"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <input
                type="text"
                placeholder="Nowe stanowisko (opcjonalnie)"
                value={position}
                onChange={e => setPosition(e.target.value)}
            />
            <button type="submit" className="blue-btn form-btn">Edytuj użytkownika</button>
            {message && <div>{message}</div>}
        </form>
    );
}
