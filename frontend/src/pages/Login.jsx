import React, { useState } from "react";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const res = await fetch("http://127.0.0.1:8000/login/", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                onLogin(data.token); // Przekazujemy token do komponentu nadrzędnego
            } else {
                const text = await res.text();
                setError(text);
            }
        } catch (err) {
            setError("Błąd połączenia z serwerem");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Logowanie</h2>
            <input
                type="text"
                placeholder="Nazwa użytkownika"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <button type="submit">Zaloguj</button>
            {error && <div style={{ color: "red" }}>{error}</div>}
        </form>
    );
}
