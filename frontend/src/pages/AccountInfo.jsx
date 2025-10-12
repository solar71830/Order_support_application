import React, { useEffect, useState } from "react";

export default function AccountInfo({ token }) {
    const [info, setInfo] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("http://127.0.0.1:8000/account-info/", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Błąd serwera");
                }
                return res.json();
            })
            .then((data) => setInfo(data.info))
            .catch((err) => setError(err.message));
    }, [token]);

    return (
        <div className="white-box">
            <h2>Informacje o koncie</h2>
            {error && <div style={{ color: "red" }}>{error}</div>}
            {info ? (
                <div>
                    <p><strong>ID:</strong> {info.id}</p>
                    <p><strong>Nazwa uzytkownika:</strong> {info.username}</p>
                    <p><strong>Email:</strong> {info.email}</p>
                    <p><strong>Stanowisko:</strong> {info.position}</p>
                </div>
            ) : (
                <div>Ładowanie...</div>
            )}
        </div>
    );
}
