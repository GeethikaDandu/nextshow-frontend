import { buttonStyle, inputStyle, labelStyle } from "./authStyles";
export default function Register({ registerForm, setRegisterForm, handleRegisterSubmit, authLoading, setAuthPage, setAuthError, setAuthSuccess }) {
  const field = (label, name, type="text", autoComplete=name) => <label style={labelStyle} key={name}>{label}<input required type={type} autoComplete={autoComplete} minLength={name.includes("password") ? 6 : undefined} value={registerForm[name]} onChange={e => setRegisterForm({ ...registerForm, [name]: e.target.value })} placeholder={name === "confirmPassword" ? "Enter password again" : name === "password" ? "At least 6 characters" : label} style={inputStyle} /></label>;
  return <>
    <button type="button" onClick={() => { setAuthPage("welcome"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#7354bd", padding: 0, cursor: "pointer", fontWeight: 800 }}>← Back</button>
    <h2 style={{ fontSize: "30px", letterSpacing: "-1px", margin: "18px 0 7px" }}>Create your account</h2>
    <p style={{ color: "#777182", margin: "0 0 20px", lineHeight: 1.6 }}>Register once, then sign in to start booking.</p>
    <form onSubmit={handleRegisterSubmit}>
      {field("Full name","name","text","name")}
      {field("Email address","email","email","email")}
      {field("Phone number","phone","tel","tel")}
      {field("Password","password","password","new-password")}
      {field("Confirm password","confirmPassword","password","new-password")}
      <button type="submit" disabled={authLoading} style={{ ...buttonStyle, opacity: authLoading ? .7 : 1 }}>{authLoading ? "Creating account…" : "Create account"}</button>
      <p style={{ textAlign: "center", color: "#777182", fontSize: "13px", margin: "20px 0 0" }}>Already registered? <button type="button" onClick={() => { setAuthPage("login"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#6840d9", fontWeight: 800, cursor: "pointer" }}>Log in</button></p>
    </form>
  </>;
}
