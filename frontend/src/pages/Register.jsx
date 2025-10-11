import React, { useState } from "react";

export default function Register() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [position, setPosition] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage("");
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);
        formData.append("email", email);
        formData.append("position", position);

        try {
            const res = await fetch("http://127.0.0.1:8000/register/", {
                method: "POST",
                body: formData,
            });
            const text = await res.text();
            setMessage(text);
        } catch (err) {
            setMessage("B³¹d po³¹czenia z serwerem");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
            <h2>Rejestracja</h2>
            <input
                type="text"
                placeholder="Nazwa uzytkownika"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Haslo"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Stanowisko (opcjonalnie)"
                value={position}
                onChange={e => setPosition(e.target.value)}
            />
            <button type="submit" className="blue-btn form-btn">Zarejestruj</button>
            {message && <div>{message}</div>}
        </form>
    );
}
