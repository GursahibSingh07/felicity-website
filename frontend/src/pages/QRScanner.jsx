import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

function QRScanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [manualTicket, setManualTicket] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [activeView, setActiveView] = useState("scanner");
  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAction, setOverrideAction] = useState("mark");
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    fetchDashboard();
    return () => {
      stopScanner();
    };
  }, [eventId]);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/attendance/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDashboard(data);
    } catch (err) {
      setScanError(err.message);
    } finally {
      setDashLoading(false);
    }
  };

  const startScanner = async () => {
    setScanResult(null);
    setScanError("");
    setScanning(true);

    try {
      const qr = new Html5Qrcode("qr-reader");
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await qr.stop();
          html5QrRef.current = null;
          setScanning(false);
          await processTicket(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setScanError("Camera access denied or not available. Use manual entry.");
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
      } catch (_) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const processTicket = async (ticketId) => {
    setScanResult(null);
    setScanError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/scan/${ticketId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setScanResult({ type: "duplicate", ...data });
        return;
      }
      if (!res.ok) throw new Error(data.message);
      setScanResult({ type: "success", ...data });
      fetchDashboard();
    } catch (err) {
      setScanError(err.message);
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    if (!manualTicket.trim()) return;
    processTicket(manualTicket.trim());
    setManualTicket("");
  };

  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      alert("Reason is required for manual override");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/manual-override/${overrideModal}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: overrideReason, action: overrideAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOverrideModal(null);
      setOverrideReason("");
      fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/attendance/${eventId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${dashboard?.eventTitle || "event"}_attendance.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const tabStyle = (tab) => ({
    padding: "0.65rem 1.4rem",
    border: "none",
    borderBottom: `3px solid ${activeView === tab ? "#007bff" : "transparent"}`,
    background: "none",
    color: activeView === tab ? "#007bff" : "#666",
    fontWeight: activeView === tab ? "bold" : "normal",
    cursor: "pointer",
    fontSize: "0.95rem",
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "1px solid #ccc", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: "0.5rem" }}>QR Scanner & Attendance</h1>
      {dashboard && <p style={{ color: "#666", marginBottom: "1.5rem" }}>{dashboard.eventTitle}</p>}

      <div style={{ borderBottom: "1px solid #eee", marginBottom: "2rem", display: "flex", gap: "0" }}>
        {["scanner", "dashboard"].map(tab => (
          <button key={tab} onClick={() => { setActiveView(tab); if (tab === "scanner") stopScanner(); }} style={tabStyle(tab)}>
            {tab === "scanner" ? "Scan QR" : "Attendance Dashboard"}
          </button>
        ))}
      </div>

      {activeView === "scanner" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem", textAlign: "center" }}>
              <h3 style={{ marginTop: 0 }}>Camera Scanner</h3>
              <div id="qr-reader" ref={scannerRef} style={{ width: "100%", maxWidth: "320px", margin: "0 auto 1rem auto" }} />
              {!scanning ? (
                <button onClick={startScanner} style={{ background: "#007bff", color: "white", border: "none", padding: "0.6rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" }}>
                  Start Camera
                </button>
              ) : (
                <button onClick={stopScanner} style={{ background: "#dc3545", color: "white", border: "none", padding: "0.6rem 1.5rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" }}>
                  Stop Camera
                </button>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "1.5rem" }}>
              <h3 style={{ marginTop: 0 }}>Manual Entry</h3>
              <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                Enter ticket ID manually if camera is unavailable
              </p>
              <form onSubmit={handleManualScan} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={manualTicket}
                  onChange={e => setManualTicket(e.target.value)}
                  placeholder="Enter Ticket ID..."
                  style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1px solid #ddd", borderRadius: "6px", fontSize: "0.95rem" }}
                />
                <button type="submit" style={{ background: "#28a745", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                  Scan
                </button>
              </form>
            </div>
          </div>

          {scanError && (
            <div style={{ padding: "1rem", background: "#f8d7da", color: "#721c24", borderRadius: "8px", marginBottom: "1rem" }}>
              {scanError}
            </div>
          )}

          {scanResult && scanResult.type === "success" && (
            <div style={{ padding: "1.25rem", background: "#d4edda", color: "#155724", borderRadius: "8px", marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Attendance Marked!</h3>
              <p style={{ margin: "0.2rem 0" }}><strong>Name:</strong> {scanResult.participant?.name}</p>
              <p style={{ margin: "0.2rem 0" }}><strong>Email:</strong> {scanResult.participant?.email}</p>
              <p style={{ margin: "0.2rem 0" }}><strong>Ticket:</strong> {scanResult.participant?.ticketId}</p>
              <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}>
                Scanned at: {new Date(scanResult.attendedAt).toLocaleString()}
              </p>
            </div>
          )}

          {scanResult && scanResult.type === "duplicate" && (
            <div style={{ padding: "1.25rem", background: "#fff3cd", color: "#856404", borderRadius: "8px", marginBottom: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem 0" }}>Duplicate Scan!</h3>
              <p style={{ margin: "0.2rem 0" }}>{scanResult.message}</p>
              <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}>
                Originally scanned: {scanResult.attendedAt ? new Date(scanResult.attendedAt).toLocaleString() : "—"}
              </p>
              <p style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}>Method: {scanResult.attendanceMethod || "—"}</p>
            </div>
          )}

          {dashboard && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#007bff" }}>{dashboard.totalEligible}</div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>Total Eligible</div>
              </div>
              <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#28a745" }}>{dashboard.attendedCount}</div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>Scanned</div>
              </div>
              <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#dc3545" }}>{dashboard.notAttendedCount}</div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>Not Scanned</div>
              </div>
              <div style={{ background: "white", border: "1px solid #ddd", borderRadius: "8px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#6f42c1" }}>{dashboard.attendanceRate}%</div>
                <div style={{ fontSize: "0.85rem", color: "#666" }}>Rate</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "dashboard" && (
        <div>
          {dashLoading ? (
            <p>Loading...</p>
          ) : !dashboard ? (
            <p>No data available.</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", flex: 1 }}>
                  <div style={{ background: "#e3f2fd", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{dashboard.totalEligible}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>Total</div>
                  </div>
                  <div style={{ background: "#d4edda", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#155724" }}>{dashboard.attendedCount}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>Attended</div>
                  </div>
                  <div style={{ background: "#f8d7da", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#721c24" }}>{dashboard.notAttendedCount}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>Not Yet</div>
                  </div>
                  <div style={{ background: "#e8daef", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#6f42c1" }}>{dashboard.attendanceRate}%</div>
                    <div style={{ fontSize: "0.85rem", color: "#666" }}>Rate</div>
                  </div>
                </div>
                <button onClick={handleExportCSV} style={{ background: "#28a745", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                  Export CSV
                </button>
              </div>

              <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.5rem", border: "1px solid #eee", marginBottom: "1.5rem" }}>
                <h3 style={{ marginTop: 0 }}>Attendance Progress</h3>
                <div style={{ background: "#e9ecef", borderRadius: "8px", height: "24px", overflow: "hidden" }}>
                  <div style={{ background: "#28a745", height: "100%", width: `${dashboard.attendanceRate}%`, transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
                  {dashboard.attendedCount} / {dashboard.totalEligible} checked in ({dashboard.attendanceRate}%)
                </p>
              </div>

              <h3>Attended ({dashboard.attended.length})</h3>
              {dashboard.attended.length === 0 ? (
                <p style={{ color: "#666" }}>No attendees yet.</p>
              ) : (
                <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ background: "#d4edda" }}>
                        {["Name", "Email", "Ticket ID", "Scanned At", "Method", "Action"].map(h => (
                          <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.attended.map(a => (
                        <tr key={a.registrationId} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.name}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.email}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{a.ticketId}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{a.attendedAt ? new Date(a.attendedAt).toLocaleString() : "—"}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <span style={{ background: a.attendanceMethod === "qr_scan" ? "#cff4fc" : "#fff3cd", padding: "0.2rem 0.5rem", borderRadius: "8px", fontSize: "0.78rem", fontWeight: "bold" }}>
                              {a.attendanceMethod === "qr_scan" ? "QR Scan" : "Manual"}
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <button onClick={() => { setOverrideModal(a.registrationId); setOverrideAction("unmark"); setOverrideReason(""); }} style={{ background: "#ffc107", color: "#333", border: "none", padding: "0.25rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>
                              Unmark
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h3>Not Yet Attended ({dashboard.notAttended.length})</h3>
              {dashboard.notAttended.length === 0 ? (
                <p style={{ color: "#666" }}>Everyone has checked in!</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ background: "#f8d7da" }}>
                        {["Name", "Email", "Ticket ID", "Registered", "Action"].map(h => (
                          <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "2px solid #ddd" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.notAttended.map(a => (
                        <tr key={a.registrationId} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.name}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.email}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{a.ticketId}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{new Date(a.registrationDate).toLocaleDateString()}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <button onClick={() => { setOverrideModal(a.registrationId); setOverrideAction("mark"); setOverrideReason(""); }} style={{ background: "#28a745", color: "white", border: "none", padding: "0.25rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" }}>
                              Mark Attended
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {overrideModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "8px", maxWidth: "400px", width: "90%" }}>
            <h3 style={{ marginTop: 0 }}>
              {overrideAction === "mark" ? "Manual Mark Attendance" : "Unmark Attendance"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              This action requires a reason for audit logging.
            </p>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Reason *</label>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for manual override..."
              style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleManualOverride} style={{ flex: 1, background: overrideAction === "mark" ? "#28a745" : "#ffc107", color: overrideAction === "mark" ? "white" : "#333", border: "none", padding: "0.6rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                Confirm
              </button>
              <button onClick={() => setOverrideModal(null)} style={{ flex: 1, background: "#6c757d", color: "white", border: "none", padding: "0.6rem", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
