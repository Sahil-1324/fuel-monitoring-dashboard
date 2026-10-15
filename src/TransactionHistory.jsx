
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./TransactionHistory.css";

const demoTransactions = [
  { id: "TXN-1084", tanker: "M001", date: "Today, 10:42 AM", previous: 50, current: 25, type: "Leakage Alert" },
  { id: "TXN-1083", tanker: "M002", date: "Today, 10:30 AM", previous: 65, current: 70, type: "Fuel Added" },
  { id: "TXN-1082", tanker: "M004", date: "Today, 09:45 AM", previous: 35, current: 10, type: "Low Fuel" },
  { id: "TXN-1081", tanker: "M005", date: "Today, 09:12 AM", previous: 75, current: 80, type: "Fuel Added" },
  { id: "TXN-1080", tanker: "M003", date: "Today, 08:55 AM", previous: 85, current: 80, type: "Normal" },
  { id: "TXN-1079", tanker: "M002", date: "Yesterday, 06:20 PM", previous: 45, current: 65, type: "Fuel Added" },
];

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState(demoTransactions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/api/machine-data");

        if (!response.ok) throw new Error("API request failed");

        const machines = await response.json();
        setApiConnected(true);

        // Use actual saved readings from Flask for the latest snapshot.
        // Demo rows remain until a real transaction-history API is added.
        const liveRows = machines.map((machine) => ({
          id: `LIVE-${machine.id}`,
          tanker: machine.device_id,
          date: "Latest saved reading",
          previous: null,
          current: Number(machine.fuel),
          type: machine.leakage_suspected
            ? "Leakage Alert"
            : machine.fuel <= 20
            ? "Low Fuel"
            : machine.temperature >= 80
            ? "High Temperature"
            : "Normal",
          live: true,
          temperature: machine.temperature,
        }));

        setTransactions((current) => [
          ...liveRows,
          ...current.filter((item) => !item.live),
        ]);
      } catch (error) {
        setApiConnected(false);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch =
        transaction.tanker.toLowerCase().includes(search.toLowerCase()) ||
        transaction.id.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        (filter === "Fuel Added" && transaction.type === "Fuel Added") ||
        (filter === "Fuel Decrease" &&
          transaction.previous !== null &&
          transaction.current < transaction.previous) ||
        (filter === "Alerts" &&
          ["Leakage Alert", "Low Fuel", "High Temperature"].includes(
            transaction.type
          ));

      return matchesSearch && matchesFilter;
    });
  }, [transactions, search, filter]);

  const fuelAdded = transactions.filter(
    (t) => t.previous !== null && t.current > t.previous
  ).length;

  const fuelDecreased = transactions.filter(
    (t) => t.previous !== null && t.current < t.previous
  ).length;

  const alertCount = transactions.filter((t) =>
    ["Leakage Alert", "Low Fuel", "High Temperature"].includes(t.type)
  ).length;

  function exportCSV() {
    const headers = [
      "Transaction ID",
      "Tanker ID",
      "Date",
      "Previous Fuel (%)",
      "Current Fuel (%)",
      "Change (%)",
      "Status",
    ];

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.tanker,
      t.date,
      t.previous ?? "N/A",
      t.current,
      t.previous === null ? "N/A" : t.current - t.previous,
      t.type,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "fuel-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="transaction-app">
      <aside className="transaction-sidebar">
        <Link to="/" className="transaction-brand">
          <span className="brand-icon">◈</span>
          <span>TANK<span className="brand-blue">FLOW</span></span>
        </Link>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="transaction-nav">
          <Link to="/" className="nav-link">
            <span>▦</span> Overview
          </Link>
          <Link to="/" className="nav-link">
            <span>◉</span> Live Monitoring
          </Link>
          <Link to="/transactions" className="nav-link active">
            <span>↻</span> Transaction History
          </Link>
          <a href="#transaction-alerts" className="nav-link">
            <span>♧</span> Alerts
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-indicator">
            <span className={`connection-dot ${apiConnected ? "" : "offline"}`} />
            <div>
              <strong>{apiConnected ? "API Connected" : "API Offline"}</strong>
              <small>Flask monitoring server</small>
            </div>
          </div>
          <p>FLEET MONITORING SYSTEM</p>
          <small>Transaction Centre · v1.0</small>
        </div>
      </aside>

      <main className="transaction-main">
        <header className="transaction-topbar">
          <div>
            <span className="breadcrumb">WORKSPACE / HISTORY</span>
            <h1>Transaction History</h1>
            <p className="page-subtitle">
              Track fuel movements and monitor activity across your fleet.
            </p>
          </div>

          <button className="export-button" onClick={exportCSV}>
            <span>↓</span> Export CSV
          </button>
        </header>

        <section className="transaction-stats">
          <article className="stat-card">
            <div className="stat-heading">
              <span>Total Records</span>
              <span className="stat-icon blue-icon">▤</span>
            </div>
            <h2>{transactions.length}</h2>
            <p>Available entries</p>
            <div className="stat-decoration blue-decoration" />
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              <span>Fuel Added Events</span>
              <span className="stat-icon green-icon">↗</span>
            </div>
            <h2>{fuelAdded}</h2>
            <p>Fuel level increased</p>
            <div className="stat-decoration green-decoration" />
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              <span>Fuel Decrease Events</span>
              <span className="stat-icon orange-icon">↘</span>
            </div>
            <h2>{fuelDecreased}</h2>
            <p>Fuel level decreased</p>
            <div className="stat-decoration orange-decoration" />
          </article>

          <article className="stat-card">
            <div className="stat-heading">
              <span>Detected Alerts</span>
              <span className="stat-icon red-icon">!</span>
            </div>
            <h2>{alertCount}</h2>
            <p>Events requiring attention</p>
            <div className="stat-decoration red-decoration" />
          </article>
        </section>

        <section className="transaction-content">
          <div className="table-heading">
            <div>
              <h2>Recent Activity</h2>
              <p>Review fuel readings and their recorded status.</p>
            </div>
            <span className="record-count">
              {filteredTransactions.length} records
            </span>
          </div>

          <div className="transaction-toolbar">
            <div className="transaction-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search tanker ID or transaction..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              aria-label="Filter transactions"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="transaction-filter"
            >
              <option value="All">All activity</option>
              <option value="Fuel Added">Fuel added</option>
              <option value="Fuel Decrease">Fuel decrease</option>
              <option value="Alerts">Alerts only</option>
            </select>
          </div>

          <div className="transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>TRANSACTION</th>
                  <th>TANKER</th>
                  <th>DATE & TIME</th>
                  <th>PREVIOUS</th>
                  <th>CURRENT</th>
                  <th>CHANGE</th>
                  <th>EVENT STATUS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      Loading transaction data...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const change =
                      transaction.previous === null
                        ? null
                        : transaction.current - transaction.previous;

                    const statusClass = transaction.type
                      .toLowerCase()
                      .replaceAll(" ", "-");

                    return (
                      <tr key={transaction.id}>
                        <td>
                          <div className="transaction-id">
                            <span className="transaction-row-icon">↻</span>
                            <div>
                              <strong>{transaction.id}</strong>
                              {transaction.live && (
                                <small className="live-tag">LIVE DATA</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="tanker-tag">{transaction.tanker}</span>
                        </td>
                        <td className="date-cell">{transaction.date}</td>
                        <td>
                          {transaction.previous === null
                            ? "—"
                            : `${transaction.previous}%`}
                        </td>
                        <td>
                          <div className="current-fuel">
                            <span>{transaction.current}%</span>
                            <div className="mini-fuel-bar">
                              <div
                                style={{
                                  width: `${transaction.current}%`,
                                  background:
                                    transaction.current <= 20
                                      ? "#fb7185"
                                      : "#38bdf8",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          {change === null ? (
                            <span className="change-neutral">—</span>
                          ) : (
                            <span
                              className={`change-value ${
                                change > 0
                                  ? "change-positive"
                                  : change < 0
                                  ? "change-negative"
                                  : "change-neutral"
                              }`}
                            >
                              {change > 0 ? "+" : ""}
                              {change}%
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`event-badge ${statusClass}`}>
                            <span className="badge-dot" />
                            {transaction.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="transaction-table-footer">
            <span>Showing {filteredTransactions.length} entries</span>
            <span className="footer-note">
              {apiConnected
                ? "● Connected to Flask API"
                : "○ Showing sample data"}
            </span>
          </div>
        </section>

        <section className="transaction-info" id="transaction-alerts">
          <div className="info-symbol">i</div>
          <div>
            <strong>About your transaction data</strong>
            <p>
              Latest fuel levels are retrieved from Flask. Historical example
              rows are included for the design preview; a transaction-log
              database is needed to store genuine past readings and timestamps.
            </p>
          </div>
        </section>

        <footer className="transaction-footer">
          <span>© 2026 TankFlow Monitoring</span>
          <span>Fuel visibility. Smarter decisions.</span>
        </footer>
      </main>
    </div>
  );
}
