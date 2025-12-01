import React, { useState, useEffect } from "react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState(null); // Typ raportu: "employee" lub "order"
  const [employees, setEmployees] = useState([]); // Lista unikalnych pracowników
  const [orders, setOrders] = useState([]); // Lista zamówień z backendu
  const [selectedEmployees, setSelectedEmployees] = useState([]); // Wybrani pracownicy
  const [selectedOrders, setSelectedOrders] = useState([]); // Wybrane zamówienia
  const [startDate, setStartDate] = useState(""); // Data początkowa
  const [endDate, setEndDate] = useState(""); // Data końcowa
  const [employeeSearch, setEmployeeSearch] = useState(""); // Wyszukiwanie pracowników
  const [orderSearch, setOrderSearch] = useState(""); // Wyszukiwanie zamówień

  // Funkcja do pobierania unikalnych pracowników
  const getUniqueEmployees = (orders) => {
    const employees = orders.map((order) => order.osoba).filter((osoba) => osoba); // Pobierz wszystkie osoby, ignorując `null` lub `undefined`
    return [...new Set(employees)]; // Usuń duplikaty za pomocą `Set`
  };

  // Pobieranie danych z backendu
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/orders/")
      .then((res) => res.json())
      .then((data) => {

      // OBSŁUGA backendu który zwraca results[]
      const list = Array.isArray(data) ? data : (data.results || []);

      setOrders(list);

      const uniqueEmployees = getUniqueEmployees(list);
      setEmployees(uniqueEmployees.map((name) => ({ name }))); 
    })
    .catch((err) => console.error("Błąd podczas pobierania zamówień:", err));
}, []);

    const handleGenerateReport = () => {
        console.log("Generowanie raportu rozpoczęte:", { reportType, selectedEmployees, selectedOrders });

        // Usuń duplikaty
        const uniqueEmployees = [...new Set(selectedEmployees)];
        const uniqueOrders = [...new Set(selectedOrders)];

        if (reportType === "employee") {
            if (uniqueEmployees.length === 0 || !startDate || !endDate) {
                alert("Wybierz pracownika i okres!");
                return;
            }

            uniqueEmployees.forEach((employeeName) => {
                console.log(`Generowanie raportu dla pracownika: ${employeeName}`);
                fetch(
                    `http://127.0.0.1:8000/user-report/?user_id=${encodeURIComponent(employeeName)}&start_date=${startDate}&end_date=${endDate}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                        },
                    }
                )
                    .then((res) => {
                        if (!res.ok) throw new Error("Błąd generowania raportu");
                        return res.blob();
                    })
                    .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `Raport_Pracownika_${employeeName}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                    })
                    .catch((err) => alert(err.message));
            });
        } else if (reportType === "order") {
            if (uniqueOrders.length === 0) {
                alert("Wybierz zamówienie!");
                return;
            }

            uniqueOrders.forEach((orderId) => {
                console.log(`Generowanie raportu dla zamówienia: ${orderId}`);
                fetch(
                    `http://127.0.0.1:8000/order-report/?order_id=${encodeURIComponent(orderId)}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("jwtToken"),
                        },
                    }
                )
                    .then((res) => {
                        if (!res.ok) throw new Error("Błąd generowania raportu");
                        return res.blob();
                    })
                    .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `Raport_Zamowienia_${orderId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                    })
                    .catch((err) => alert(err.message));
            });
        }
    };



  return (
    <div className="white-box">
      <h2 style={{ color: "white" }}>Raporty</h2>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setReportType("employee")}
          className="btn report-btn"
          style={{ marginRight: "10px" }}
        >
          Raport Pracownika
        </button>
        <button
          onClick={() => setReportType("order")}
          className="btn report-btn"
        >
          Raport Zamówienia
        </button>
      </div>

      {reportType === "employee" && (
        <div>
          <h3 style={{ color: "white" }}>Wybierz pracownika:</h3>
          <input
            type="text"
            placeholder="Wyszukaj pracownika..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            style={{
              marginBottom: "10px",
              padding: "10px",
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
            }}
          />
          <div
            style={{
              maxHeight: "200px", // Ograniczenie wysokości
              overflowY: "auto", // Dodanie przewijania
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#fff", // Białe tło
            }}
          >
            {employees
              .filter((employee) =>
                employee.name.toLowerCase().includes(employeeSearch.toLowerCase())
              )
              .map((employee, index) => (
                <label key={index} style={{ display: "block", marginBottom: "5px", width: "90%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    color: "#111",}}>
                  <input
                    type="checkbox"
                    value={employee.name}
                          onChange={(e) => {
                              if (e.target.checked) {
                                  setSelectedEmployees((prev) => [...new Set([...prev, employee.name])]); // Zapobieganie duplikatom
                              } else {
                                  setSelectedEmployees((prev) => prev.filter((emp) => emp !== employee.name));
                              }
                          }}

                  />
                  {employee.name}
                </label>
              ))}
          </div>
          <h3 style={{ color: "white" }}>Okres:</h3>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "black" }}>
              Data początkowa:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "#fff", // Białe tło
                  color: "#111", // Czarny tekst
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "5px",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                }}
              />
            </label>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ color: "white" }}>
              Data końcowa:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  marginLeft: "10px",
                  backgroundColor: "#fff", // Białe tło
                  color: "#111", // Czarny tekst
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "5px",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                }}
              />
            </label>
          </div>
          <button onClick={handleGenerateReport} className="report-btn" style={{ marginTop: "10px" }}>
            Generuj Raport
          </button>
        </div>
      )}

      {reportType === "order" && (
        <div>
          <h3 style={{ color: "white" }}>Wybierz zamówienie:</h3>
          <input
            type="text"
            placeholder="Wyszukaj zamówienie..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            style={{
              marginBottom: "10px",
              padding: "10px",
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: "8px",
              backgroundColor: "#fff", // Białe tło
              color: "#111", // Czarny tekst
            }}
          />
          <div
            style={{
              maxHeight: "200px", // Ograniczenie wysokości
              overflowY: "auto", // Dodanie przewijania
              marginBottom: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "#fff", // Białe tło
            }}
          >
            {orders
              .filter((order) =>
                (order.numer || "").toString().toLowerCase().includes(orderSearch.toLowerCase())
              )
              .map((order, index) => (
                <label key={index} style={{ display: "block", marginBottom: "5px", width: "90%",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    color: "#111",}}>
                  <input
                    type="checkbox"
                    value={order.numer}
                          onChange={(e) => {
                              if (e.target.checked) {
                                  setSelectedOrders((prev) => [...new Set([...prev, order.numer])]); // Zapobieganie duplikatom
                              } else {
                                  setSelectedOrders((prev) => prev.filter((ord) => ord !== order.numer));
                              }
                          }}

                  />
                  {order.numer}
                </label>
              ))}
          </div>
          <button onClick={handleGenerateReport} className="report-btn" style={{ marginTop: "10px" }}>
            Generuj Raport
          </button>
        </div>
      )}
    </div>
  );
}