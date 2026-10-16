import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "https://kasp-api-practice.onrender.com";

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMachines() {
    try {
      const response = await fetch(`${API_URL}/machine-data`);

      if (!response.ok) {
        throw new Error(`Unable to load machine data: ${response.status}`);
      }

      const data = await response.json();
      setMachines(data);
      setError("");
    } catch (err) {
      console.error("Machine data error:", err);
      setError(
        "Cannot connect to Flask. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMachines();

    const interval = setInterval(loadMachines, 5000);

    return () => clearInterval(interval);
  }, []);

  const lowFuel = machines.filter(
    (machine) => Number(machine.fuel) <= 20
  ).length;

  const highTemperature = machines.filter(
    (machine) => Number(machine.temperature) >= 80
  ).length;

  const leakage = machines.filter(
    (machine) => machine.leakage_suspected === true
  ).length;

  function statusOf(machine) {
    if (machine.leakage_suspected) return "POSSIBLE LEAKAGE";
    if (Number(machine.fuel) <= 20) return "LOW FUEL";
    if (Number(machine.temperature) >= 80) return "HIGH TEMPERATURE";
    return "NORMAL";
  }

  function statusClassOf(status) {
    if (status === "NORMAL") return "normal";
    if (status === "LOW FUEL") return "low";
    if (status === "HIGH TEMPERATURE") return "hot";
    return "leak";
  }

  return (
    <div className="dashboard-app">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="dashboard-logo">◈</span>
          <span>
            TANK<span>FLOW</span>
          </span>
        </Link>

        <p className="dashboard-nav-title">WORKSPACE</p>

        <nav className="dashboard-nav">
          <Link to="/" className="dashboard-nav-link selected">
            <span>▦</span> Overview
          </Link>

          <a href="#machines" className="dashboard-nav-link">
            <span>◉</span> Live Monitoring
          </a>

          <Link to="/transactions" className="dashboard-nav-link">
            <span>↻</span> Transaction History
          </Link>

          <a href="#alerts" className="dashboard-nav-link">
            <span>♧</span> Alerts
          </a>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <span className="dashboard-online-dot" />
          <div>
            <strong>Live Monitoring</strong>
            <small>Flask API connection</small>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              FLEET MANAGEMENT / OVERVIEW
            </span>
            <h1>Fuel Monitoring</h1>
            <p>
              Monitor tanker fuel levels, temperature and safety alerts.
            </p>
          </div>

          <button
            className="dashboard-refresh"
            onClick={loadMachines}
            disabled={loading}
          >
            ↻ Refresh data
          </button>
        </header>

        <section className="dashboard-stats">
          <article className="dashboard-stat">
            <span>Total Tankers</span>
            <strong>{machines.length}</strong>
            <small>Registered devices</small>
          </article>

          <article className="dashboard-stat">
            <span>Low Fuel</span>
            <strong className="dashboard-red">{lowFuel}</strong>
            <small>Fuel level at or below 20%</small>
          </article>

          <article className="dashboard-stat">
            <span>High Temperature</span>
            <strong className="dashboard-orange">
              {highTemperature}
            </strong>
            <small>Temperature at or above 80°</small>
          </article>

          <article className="dashboard-stat">
            <span>Leakage Alerts</span>
            <strong className="dashboard-pink">{leakage}</strong>
            <small>Unusual fuel drops detected</small>
          </article>
        </section>

        {error && <div className="dashboard-error">{error}</div>}

        <section className="dashboard-panel" id="machines">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Live Tanker Monitoring</h2>
              <p>Current readings received from your Flask API.</p>
            </div>

            <span className="dashboard-live-label">
              <span className="dashboard-online-dot" /> LIVE
            </span>
          </div>

          {loading ? (
            <p className="dashboard-message">
              Loading tanker data...
            </p>
          ) : machines.length === 0 ? (
            <p className="dashboard-message">
              No tankers found in the database.
            </p>
          ) : (
            <div className="dashboard-machine-grid">
              {machines.map((machine) => {
                const status = statusOf(machine);
                const statusClass = statusClassOf(status);

                return (
                  <article
                    className="dashboard-machine-card"
                    key={machine.id}
                  >
                    <div className="dashboard-machine-heading">
                      <div className="dashboard-machine-icon">◈</div>

                      <div>
                        <h3>{machine.device_id}</h3>
                        <small>Tanker monitoring unit</small>
                      </div>

                      <span
                        className={`dashboard-status ${statusClass}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="dashboard-fuel-heading">
                      <span>Fuel level</span>
                      <strong>{machine.fuel}%</strong>
                    </div>

                    <div className="dashboard-fuel-track">
                      <div
                        className={
                          Number(machine.fuel) <= 20
                            ? "dashboard-fuel-fill low-fill"
                            : "dashboard-fuel-fill"
                        }
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, Number(machine.fuel) || 0)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="dashboard-reading-row">
                      <span>Temperature</span>
                      <strong
                        className={
                          Number(machine.temperature) >= 80
                            ? "dashboard-orange"
                            : ""
                        }
                      >
                        {machine.temperature}°C
                      </strong>
                    </div>

                    <div className="dashboard-reading-row">
                      <span>Leakage status</span>
                      <strong
                        className={
                          machine.leakage_suspected
                            ? "dashboard-pink"
                            : ""
                        }
                      >
                        {machine.leakage_suspected
                          ? "Suspected"
                          : "Not detected"}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="dashboard-alert-panel" id="alerts">
          <div>
            <h2>Safety overview</h2>
            <p>Review tankers that may need attention.</p>
          </div>

          {leakage + lowFuel + highTemperature === 0 ? (
            <span className="dashboard-status normal">
              No active alerts
            </span>
          ) : (
            <div className="dashboard-alert-counts">
              {leakage > 0 && (
                <span>{leakage} leakage alert(s)</span>
              )}

              {lowFuel > 0 && (
                <span>{lowFuel} low-fuel alert(s)</span>
              )}

              {highTemperature > 0 && (
                <span>{highTemperature} temperature alert(s)</span>
              )}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <span>© 2026 TankFlow Monitoring</span>
          <span>Fuel visibility. Smarter decisions.</span>
        </footer>
      </main>
    </div>
  );
}
