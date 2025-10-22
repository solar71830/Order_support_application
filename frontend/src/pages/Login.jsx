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
                onLogin(data.token);
            } else {
                const text = await res.text();
                setError(text);
            }
        } catch (error) {
            setError("Błąd połączenia z serwerem");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#f8f9fa",
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    padding: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                    width: "350px",
                    textAlign: "center",
                }}
            >
                <h2 style={{ marginBottom: "20px", color: "#111" }}>Logowanie</h2>
                <input
                    type="text"
                    placeholder="Nazwa użytkownika"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    style={{
                        width: "90%",
                        padding: "10px",
                        marginBottom: "10px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        color: "#111",
                    }}
                />
                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                        width: "90%",
                        padding: "10px",
                        marginBottom: "20px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        color: "#111",
                    }}
                />
                <button
                    type="submit"
                    style={{
                        width: "90%",
                        padding: "10px",
                        backgroundColor: "#38b6ff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    Zaloguj
                </button>
                {error && (
                    <div
                        style={{
                            marginTop: "10px",
                            color: "red",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}
