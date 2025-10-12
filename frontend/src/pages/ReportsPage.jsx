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
        setOrders(data);
        const uniqueEmployees = getUniqueEmployees(data);
        setEmployees(uniqueEmployees.map((name) => ({ name }))); // Przekształć na obiekty z `name`
      })
      .catch((err) => console.error("Błąd podczas pobierania zamówień:", err));
  }, []);

  const handleGenerateReport = () => {
    if (reportType === "employee") {
      console.log("Generowanie raportu pracownika:", selectedEmployees, startDate, endDate);
      alert(`Raport pracownika wygenerowany dla: ${selectedEmployees.join(", ")} w okresie od ${startDate} do ${endDate}`);
    } else if (reportType === "order") {
      console.log("Generowanie raportu zamówienia:", selectedOrders);
      alert(`Raport zamówienia wygenerowany dla: ${selectedOrders.join(", ")}`);
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
                <label key={index} style={{ display: "block", marginBottom: "5px", color: "#111" }}>
                  <input
                    type="checkbox"
                    value={employee.name}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees((prev) => [...prev, employee.name]);
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
            <label style={{ color: "white" }}>
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
                order.numer.toLowerCase().includes(orderSearch.toLowerCase())
              )
              .map((order, index) => (
                <label key={index} style={{ display: "block", marginBottom: "5px", color: "#111" }}>
                  <input
                    type="checkbox"
                    value={order.numer}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders((prev) => [...prev, order.numer]);
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