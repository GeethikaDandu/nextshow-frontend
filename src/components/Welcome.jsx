import { buttonStyle } from "./authStyles";
export default function Welcome({ setAuthPage, setAuthError, setAuthSuccess }) {
  return <>
    <div style={{ color: "#7955d9", fontSize: "11px", fontWeight: 900, letterSpacing: "2px" }}>WELCOME TO NEXTSHOW</div>
    <h2 style={{ fontSize: "31px", letterSpacing: "-1px", margin: "12px 0 8px" }}>Your next show awaits.</h2>
    <p style={{ color: "#777182", lineHeight: 1.65, marginBottom: "28px" }}>Sign in to book your seats, discover offers and keep your tickets together.</p>
    <button type="button" style={buttonStyle} onClick={() => { setAuthPage("login"); setAuthError(""); setAuthSuccess(""); }}>Log in</button>
    <button type="button" style={{ ...buttonStyle, marginTop: "11px", background: "#eee8ff", color: "#5838a8" }} onClick={() => { setAuthPage("register"); setAuthError(""); setAuthSuccess(""); }}>Create an account</button>
    <p style={{ textAlign: "center", color: "#8b8597", fontSize: "12px", margin: "25px 0 0" }}>Simple booking. Better nights. All in one place.</p>
  </>;
}
