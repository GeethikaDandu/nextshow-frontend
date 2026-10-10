import Welcome from "./Welcome";
import Login from "./Login";
import Register from "./Register";
export default function AuthPages(props) {
  const { authPage, setAuthPage, authLoading, authError, authSuccess, setAuthError, setAuthSuccess } = props;
  return <div className="nextshow-auth-grid" style={{ minHeight: "100vh", background: "radial-gradient(circle at 80% 15%, #34245c 0, #171322 38%, #100e17 78%)", color: "#fff", display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)", alignItems: "center", gap: "clamp(28px, 7vw, 100px)", padding: "clamp(24px, 7vw, 90px)", boxSizing: "border-box" }}>
    <section style={{ maxWidth: "570px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "25px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "58px" }}><span style={{ display: "grid", placeItems: "center", width: "38px", height: "38px", borderRadius: "12px", background: "#a78bfa", color: "#211536" }}>N</span>next<span style={{ color: "#b9a4ff", marginLeft: "-10px" }}>show</span><span style={{ color: "#a78bfa", marginLeft: "-10px" }}>.</span></div>
      <div style={{ color: "#c0aaff", fontSize: "11px", fontWeight: 900, letterSpacing: "3px", marginBottom: "18px" }}>YOUR CITY. YOUR SHOW.</div>
      <h1 style={{ fontSize: "clamp(42px, 5.5vw, 72px)", lineHeight: 1.04, letterSpacing: "-3px", margin: "0 0 22px", fontWeight: 900 }}>Make room for<br/><span style={{ color: "#b9a4ff" }}>great moments.</span></h1>
      <p style={{ maxWidth: "430px", color: "#c6c1d1", lineHeight: 1.8, fontSize: "16px" }}>Discover movies, live concerts and experiences. Your next unforgettable night starts here.</p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "30px" }}>{["🎬 Movies","🎤 Live music","🎭 Experiences"].map(item => <span key={item} style={{ border: "1px solid #484054", borderRadius: "999px", padding: "10px 14px", color: "#e3dcef", fontSize: "13px" }}>{item}</span>)}</div>
    </section>
    <section style={{ width: "100%", maxWidth: "430px", margin: "0 auto", background: "#fbfaff", color: "#211d2b", borderRadius: "24px", padding: "clamp(24px, 4vw, 38px)", boxSizing: "border-box", boxShadow: "0 28px 90px #0005" }}>
      {authError && <div role="alert" style={{ background: "#fff0f0", border: "1px solid #ffd0d0", color: "#a52a2a", borderRadius: "10px", padding: "11px 12px", fontSize: "13px", marginBottom: "12px" }}>{authError}</div>}
      {authSuccess && <div role="status" style={{ background: "#edfff5", border: "1px solid #b9f0d0", color: "#176b43", borderRadius: "10px", padding: "11px 12px", fontSize: "13px", marginBottom: "12px" }}>{authSuccess}</div>}
      {authPage === "welcome" ? <Welcome {...props}/> : authPage === "login" ? <Login {...props}/> : <Register {...props}/>}
    </section>
    <style>{`@media (max-width: 760px) { .nextshow-auth-grid { grid-template-columns: 1fr !important; } }`}</style>
  </div>;
}
