import { buttonStyle, inputStyle, labelStyle } from "./authStyles";
export default function Login({ loginForm, setLoginForm, handleLoginSubmit, authLoading, setAuthPage, setAuthError, setAuthSuccess }) {
  return <>
    <button type="button" onClick={() => { setAuthPage("welcome"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#7354bd", padding: 0, cursor: "pointer", fontWeight: 800 }}>← Back</button>
    <h2 style={{ fontSize: "30px", letterSpacing: "-1px", margin: "18px 0 7px" }}>Welcome back</h2>
    <p style={{ color: "#777182", margin: "0 0 20px", lineHeight: 1.6 }}>Log in to continue to your NextShow home page.</p>
    <form onSubmit={handleLoginSubmit}>
      <label style={labelStyle}>Email address<input required type="email" autoComplete="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="you@example.com" style={inputStyle} /></label>
      <label style={labelStyle}>Password<input required type="password" autoComplete="current-password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Enter your password" style={inputStyle} /></label>
      <button type="submit" disabled={authLoading} style={{ ...buttonStyle, opacity: authLoading ? .7 : 1 }}>{authLoading ? "Logging in…" : "Log in"}</button>
      <p style={{ textAlign: "center", color: "#777182", fontSize: "13px", margin: "20px 0 0" }}>New to NextShow? <button type="button" onClick={() => { setAuthPage("register"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#6840d9", fontWeight: 800, cursor: "pointer" }}>Register</button></p>
    </form>
  </>;
}
