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
    borderRadius: "10px",
    background: activeView === tab ? "white" : "transparent",
    color: activeView === tab ? "#6366f1" : "#64748b",
    fontWeight: activeView === tab ? "600" : "500",
    cursor: "pointer",
    fontSize: "0.95rem",
    boxShadow: activeView === tab ? "0 2px 8px rgba(99,102,241,0.1)" : "none",
    transition: "all 0.15s",
  });

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", padding: "0.4rem 1rem", borderRadius: "10px", cursor: "pointer", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#475569", fontWeight: "500" }}>
        ← Back
      </button>

      <h1 style={{ marginBottom: "0.5rem" }}>QR Scanner & Attendance</h1>
      {dashboard && <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>{dashboard.eventTitle}</p>}

      <div style={{ marginBottom: "2rem", display: "flex", gap: "0.4rem", background: "#f1f5f9", padding: "0.35rem", borderRadius: "12px" }}>
        {["scanner", "dashboard"].map(tab => (
          <button key={tab} onClick={() => { setActiveView(tab); if (tab === "scanner") stopScanner(); }} style={tabStyle(tab)}>
            {tab === "scanner" ? "Scan QR" : "Attendance Dashboard"}
          </button>
        ))}
      </div>

      {activeView === "scanner" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", textAlign: "center" }}>
              <h3 style={{ marginTop: 0 }}>Camera Scanner</h3>
              <div id="qr-reader" ref={scannerRef} style={{ width: "100%", maxWidth: "320px", margin: "0 auto 1rem auto" }} />
              {!scanning ? (
                <button onClick={startScanner} style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "white", border: "none", padding: "0.6rem 1.5rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}>
                  Start Camera
                </button>
              ) : (
                <button onClick={stopScanner} style={{ background: "#ef4444", color: "white", border: "none", padding: "0.6rem 1.5rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
                  Stop Camera
                </button>
              )}
            </div>

            <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem" }}>
              <h3 style={{ marginTop: 0 }}>Manual Entry</h3>
              <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "1rem" }}>
                Enter ticket ID manually if camera is unavailable
              </p>
              <form onSubmit={handleManualScan} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={manualTicket}
                  onChange={e => setManualTicket(e.target.value)}
                  placeholder="Enter Ticket ID..."
                  style={{ flex: 1, padding: "0.5rem 0.75rem", border: "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "0.95rem" }}
                />
                <button type="submit" style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
                  Scan
                </button>
              </form>
            </div>
          </div>

          {scanError && (
            <div style={{ padding: "1rem", background: "#fef2f2", color: "#ef4444", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #fecaca" }}>
              {scanError}
            </div>
          )}

          {scanResult && scanResult.type === "success" && (
            <div style={{ padding: "1.25rem", background: "#ecfdf5", color: "#059669", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #a7f3d0" }}>
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
            <div style={{ padding: "1.25rem", background: "#fef3c7", color: "#92400e", borderRadius: "12px", marginBottom: "1rem", border: "1px solid #fde68a" }}>
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
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#6366f1" }}>{dashboard.totalEligible}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Eligible</div>
              </div>
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#10b981" }}>{dashboard.attendedCount}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Scanned</div>
              </div>
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#ef4444" }}>{dashboard.notAttendedCount}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Not Scanned</div>
              </div>
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#8b5cf6" }}>{dashboard.attendanceRate}%</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Rate</div>
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
                  <div style={{ background: "#e0f2fe", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{dashboard.totalEligible}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Total</div>
                  </div>
                  <div style={{ background: "#ecfdf5", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#059669" }}>{dashboard.attendedCount}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Attended</div>
                  </div>
                  <div style={{ background: "#fef2f2", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>{dashboard.notAttendedCount}</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Not Yet</div>
                  </div>
                  <div style={{ background: "#ede9fe", padding: "1rem", borderRadius: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#8b5cf6" }}>{dashboard.attendanceRate}%</div>
                    <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Rate</div>
                  </div>
                </div>
                <button onClick={handleExportCSV} style={{ background: "linear-gradient(135deg, #10b981, #34d399)", color: "white", border: "none", padding: "0.6rem 1.2rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600", boxShadow: "0 4px 12px rgba(16,185,129,0.25)" }}>
                  Export CSV
                </button>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "1.5rem", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                <h3 style={{ marginTop: 0 }}>Attendance Progress</h3>
                <div style={{ background: "#e2e8f0", borderRadius: "8px", height: "24px", overflow: "hidden" }}>
                  <div style={{ background: "linear-gradient(135deg, #10b981, #34d399)", height: "100%", width: `${dashboard.attendanceRate}%`, transition: "width 0.5s" }} />
                </div>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.5rem" }}>
                  {dashboard.attendedCount} / {dashboard.totalEligible} checked in ({dashboard.attendanceRate}%)
                </p>
              </div>

              <h3>Attended ({dashboard.attended.length})</h3>
              {dashboard.attended.length === 0 ? (
                <p style={{ color: "#64748b" }}>No attendees yet.</p>
              ) : (
                <div style={{ overflowX: "auto", marginBottom: "2rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ background: "#ecfdf5" }}>
                        {["Name", "Email", "Ticket ID", "Scanned At", "Method", "Action"].map(h => (
                          <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
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
                            <span style={{ background: a.attendanceMethod === "qr_scan" ? "#e0f2fe" : "#fef3c7", padding: "0.2rem 0.5rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600", color: a.attendanceMethod === "qr_scan" ? "#0369a1" : "#92400e" }}>
                              {a.attendanceMethod === "qr_scan" ? "QR Scan" : "Manual"}
                            </span>
                          </td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <button onClick={() => { setOverrideModal(a.registrationId); setOverrideAction("unmark"); setOverrideReason(""); }} style={{ background: "#f59e0b", color: "white", border: "none", padding: "0.25rem 0.6rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}>
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
                <p style={{ color: "#64748b" }}>Everyone has checked in!</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ background: "#fef2f2" }}>
                        {["Name", "Email", "Ticket ID", "Registered", "Action"].map(h => (
                          <th key={h} style={{ padding: "0.6rem 0.75rem", textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.notAttended.map(a => (
                        <tr key={a.registrationId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.name}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>{a.email}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontFamily: "monospace", fontSize: "0.8rem" }}>{a.ticketId}</td>
                          <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{new Date(a.registrationDate).toLocaleDateString()}</td>
                          <td style={{ padding: "0.6rem 0.75rem" }}>
                            <button onClick={() => { setOverrideModal(a.registrationId); setOverrideAction("mark"); setOverrideReason(""); }} style={{ background: "#10b981", color: "white", border: "none", padding: "0.25rem 0.6rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}>
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
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "2rem", borderRadius: "20px", maxWidth: "400px", width: "90%", boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <h3 style={{ marginTop: 0 }}>
              {overrideAction === "mark" ? "Manual Mark Attendance" : "Unmark Attendance"}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
              This action requires a reason for audit logging.
            </p>
            <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Reason *</label>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              rows={3}
              placeholder="Enter reason for manual override..."
              style={{ width: "100%", padding: "0.5rem", borderRadius: "10px", border: "1.5px solid #e2e8f0", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={handleManualOverride} style={{ flex: 1, background: overrideAction === "mark" ? "#10b981" : "#f59e0b", color: "white", border: "none", padding: "0.6rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
                Confirm
              </button>
              <button onClick={() => setOverrideModal(null)} style={{ flex: 1, background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0", padding: "0.6rem", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
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
