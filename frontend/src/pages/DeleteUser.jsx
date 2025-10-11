import React, { useState } from "react";

export default function DeleteUser({ token, users }) {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage("");
        const formData = new URLSearchParams();
        formData.append("username", username);

        try {
            const res = await fetch("http://127.0.0.1:8000/account-delete/", {
                method: "POST",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const text = await res.text();
            setMessage(text);
        } catch (err) {
            setMessage("B³¹d po³¹czenia z serwerem");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="user-form">
            <h2>Usuwanie u¿ytkownika</h2>
            <select value={username} onChange={e => setUsername(e.target.value)} required>
                <option value="">Wybierz u¿ytkownika</option>
                {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button type="submit" className="blue-btn form-btn">Usuñ u¿ytkownika</button>
            {message && <div>{message}</div>}
        </form>
    );
}
