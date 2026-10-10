import { useEffect, useMemo, useState } from "react";
import { getEvents, getCategories, loginUser, registerUser, getShowsByEvent } from "./services/api";
import "./App.css";

const defaultCategoryIcons = {
  Movies: "🎬",
  Concerts: "🎤",
  Comedy: "🎭",
  Sports: "🏟️",
  Experiences: "🎡",
};

const fallbackImages = {
  Movies: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700",
  Concerts: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=700",
  Comedy: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=700",
  Sports: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=700",
  Experiences: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=700",
};

function formatEventDate(value) {
  if (!value) return "DATE TBA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  }).toUpperCase();
}

function normalizeEvent(raw, categoryRows) {
  const rawCategory =
    raw.category?.name ||
    raw.category?.categoryName ||
    raw.categoryName ||
    categoryRows.find((item) => String(item.id) === String(raw.categoryId))?.name ||
    categoryRows.find((item) => String(item.id) === String(raw.categoryId))?.categoryName ||
    "Events";

  const category = String(rawCategory);
  const title = raw.title || raw.name || "Untitled event";
  const language = raw.language || "";
  const description = raw.description || "";
  const subtitle =
    [raw.genre, language].filter(Boolean).join(" • ") ||
    description ||
    "Discover this event on NextShow";
  const price = Number(raw.price ?? raw.basePrice ?? raw.ticketPrice ?? 0);
  const rating = raw.rating ?? raw.averageRating ?? "—";
  const imageSource = raw.imageUrl || raw.image || "";

  return {
    ...raw,
    id: raw.id ?? raw.eventId ?? title,
    title,
    category,
    subtitle,
    date: formatEventDate(raw.eventDate || raw.date || raw.startDate),
    price,
    rating,
    tag: Number(rating) >= 4.7 ? "TOP RATED" : "FEATURED",
    image: imageSource.startsWith("http")
      ? imageSource
      : fallbackImages[category] || fallbackImages.Movies,
    color: category.toLowerCase().replace(/[^a-z]/g, "") || "movie",
  };
}

function App() {
  const [activeCategory, setActiveCategory] = useState("For You");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [shows, setShows] = useState([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState("");
  const [selectedShow, setSelectedShow] = useState(null);
  const [showSeats, setShowSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [seatsError, setSeatsError] = useState("");
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showsLoadedForEventId, setShowsLoadedForEventId] = useState(null);
  const [city, setCity] = useState("Hyderabad");
  const [backendEvents, setBackendEvents] = useState([]);
  const [backendCategories, setBackendCategories] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(
    Boolean(localStorage.getItem("nextshow_token"))
  );
  const [authPage, setAuthPage] = useState("welcome");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

  async function loadBackendData() {
    setLoadingEvents(true);
    setApiError("");

    const [eventsResult, categoriesResult] = await Promise.allSettled([
      getEvents(),
      getCategories(),
    ]);

    if (eventsResult.status === "fulfilled") {
      const result = eventsResult.value;
      setBackendEvents(
        Array.isArray(result) ? result : result?.content || result?.events || []
      );
    } else {
      setBackendEvents([]);
      const message = String(eventsResult.reason?.message || "");
      setApiError(
        message.includes("401") || message.toLowerCase().includes("unauthorized")
          ? "Please sign in to load events from your NextShow backend."
          : `Could not load events: ${message || "Check that Spring Boot is running on port 8080."}`
      );
    }

    if (categoriesResult.status === "fulfilled") {
      const result = categoriesResult.value;
      setBackendCategories(
        Array.isArray(result)
          ? result
          : result?.content || result?.categories || []
      );
    } else if (eventsResult.status === "fulfilled") {
      const message = String(categoriesResult.reason?.message || "");
      setApiError(`Could not load categories: ${message || "Please check the backend."}`);
    }

    setLoadingEvents(false);
  }

  useEffect(() => {
    if (localStorage.getItem("nextshow_token")) {
      loadBackendData();
    } else {
      setLoadingEvents(false);
    }
  }, []);

  const categories = useMemo(() => {
    const names = backendCategories
      .map((category) => category.name || category.categoryName || category.title)
      .filter(Boolean);

    return [
      { name: "For You", icon: "✦" },
      ...names.map((name) => ({
        name,
        icon: defaultCategoryIcons[name] || "✦",
      })),
    ];
  }, [backendCategories]);

  const events = useMemo(
    () => backendEvents.map((event) => normalizeEvent(event, backendCategories)),
    [backendEvents, backendCategories]
  );

  function openEvent(event) {
    setSelectedEvent(event);
    setShows([]);
    setShowsError("");
    setSelectedShow(null);
    setShowSeats([]);
    setSeatsError("");
    setSelectedSeatIds([]);
    setShowsLoadedForEventId(null);
    setShowsLoading(false);
  }

  function closeEventModal() {
    setSelectedEvent(null);
    setShows([]);
    setShowsError("");
    setSelectedShow(null);
    setShowSeats([]);
    setSeatsError("");
    setSelectedSeatIds([]);
    setShowsLoadedForEventId(null);
    setShowsLoading(false);
  }

  async function handleContinue() {
    if (!selectedEvent?.id || showsLoading) return;
    if (String(showsLoadedForEventId) === String(selectedEvent.id)) return;

    setShowsLoading(true);
    setShowsError("");
    setSelectedShow(null);

    try {
      const result = await getShowsByEvent(selectedEvent.id);
      const loadedShows = Array.isArray(result)
        ? result
        : result?.content || result?.shows || [];

      if (!Array.isArray(loadedShows)) {
        throw new Error("The backend returned showtimes in an unexpected format.");
      }

      setShows(loadedShows);
      setShowsLoadedForEventId(selectedEvent.id);
    } catch (error) {
      setShows([]);
      setShowsLoadedForEventId(null);
      setShowsError(error.message || "Could not load showtimes. Please try again.");
    } finally {
      setShowsLoading(false);
    }
  }

  async function handleSelectShow(show) {
    setSelectedShow(show);
    setShowSeats([]);
    setSelectedSeatIds([]);
    setSeatsError("");
    setSeatsLoading(true);
    try {
      const token = localStorage.getItem("nextshow_token");
      const response = await fetch(`/api/show-seats/show/${show.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const raw = await response.json().catch(() => []);
      if (!response.ok) {
        const message = raw?.message || raw?.error || `Could not load seats (HTTP ${response.status}).`;
        throw new Error(message);
      }
      const rows = Array.isArray(raw) ? raw : raw?.content || raw?.showSeats || raw?.seats || [];
      if (!Array.isArray(rows)) throw new Error("The backend returned seats in an unexpected format.");
      setShowSeats(rows);
      if (rows.length === 0) setSeatsError("No seats are configured for this show yet. Generate show seats in the backend first.");
    } catch (error) {
      setSeatsError(`${error.message || "Could not load seats."} Check that show seats are generated for this show.`);
    } finally {
      setSeatsLoading(false);
    }
  }

  function toggleSeat(seat) {
    const status = String(seat.status || seat.bookingStatus || "AVAILABLE").toUpperCase();
    if (status !== "AVAILABLE") return;
    setSelectedSeatIds((current) =>
      current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id]
    );
  }

  async function handleCreateBooking() {
    if (!selectedShow || selectedSeatIds.length === 0 || bookingLoading) return;
    const token = localStorage.getItem("nextshow_token");
    if (!token) {
      window.alert("Please sign in first. Booking requires your NextShow account.");
      return;
    }
    setBookingLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ showId: selectedShow.id, showSeatIds: selectedSeatIds, couponCode: null, silverRewards: 0, goldReward: false }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || result?.error || `Booking failed (HTTP ${response.status}).`);
      const bookingId = result.id ?? result.bookingId;
      const totalAmount = showSeats
        .filter((seat) => selectedSeatIds.includes(seat.id))
        .reduce((sum, seat) => sum + Number(seat.price || 0), 0);
      const seatLabels = showSeats
        .filter((seat) => selectedSeatIds.includes(seat.id))
        .map((seat) => seat.seat?.seatNumber || seat.seat?.name || seat.seatNumber || seat.name || `Seat ${seat.id}`);
      setCreatedBooking({
        bookingId,
        totalAmount,
        seatLabels,
        showDate: selectedShow.showDate,
        showTime: selectedShow.showTime,
        eventTitle: selectedEvent?.title || selectedShow.event?.title || "Your show",
        raw: result,
      });
      setCurrentPage("checkout");
    } catch (error) {
      window.alert(`Could not create booking: ${error.message || "Please try again."}`);
    } finally {
      setBookingLoading(false);
    }
  }

  function extractToken(result) {
    return result?.token || result?.jwt || result?.accessToken || result?.data?.token ||
      (typeof result === "string" ? result : "");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);
    try {
      const result = await loginUser(loginForm.email.trim(), loginForm.password);
      const token = extractToken(result);
      if (!token) {
        throw new Error("Login response did not contain a token. Check your login API response.");
      }
      localStorage.setItem("nextshow_token", token);
      setIsSignedIn(true);
      setAuthPage("welcome");
      setLoginForm({ email: "", password: "" });
      await loadBackendData();
    } catch (error) {
      setAuthError(error.message || "Login failed. Please check your details and try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (registerForm.password.length < 6) {
      setAuthError("Use a password with at least 6 characters.");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError("The passwords do not match.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await registerUser({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password,
      });
      const token = extractToken(result);
      if (token) {
        localStorage.setItem("nextshow_token", token);
        setIsSignedIn(true);
        setAuthPage("welcome");
        setRegisterForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
        await loadBackendData();
      } else {
        setLoginForm({ email: registerForm.email.trim(), password: "" });
        setRegisterForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
        setAuthPage("login");
        setAuthSuccess("Your account has been created. Please log in to continue.");
      }
    } catch (error) {
      setAuthError(error.message || "Registration failed. Please check your details and try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleSignIn() {
    if (isSignedIn) {
      localStorage.removeItem("nextshow_token");
      setIsSignedIn(false);
      setBackendEvents([]);
      setBackendCategories([]);
      setApiError("");
      setAuthError("");
      setAuthSuccess("");
      setAuthPage("welcome");
      setCurrentPage("home");
      closeEventModal();
      return;
    }
    setAuthError("");
    setAuthSuccess("");
    setAuthPage("login");
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "For You" || event.category === activeCategory;
      const searchableText =
        `${event.title} ${event.category} ${event.subtitle}`.toLowerCase();
      return matchesCategory && searchableText.includes(search.toLowerCase());
    });
  }, [events, activeCategory, search]);

  if (!isSignedIn) {
    const authInputStyle = {
      width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: "12px",
      border: "1px solid #dedbe8", background: "#fff", color: "#211d2b", fontSize: "15px",
      outline: "none", marginTop: "7px",
    };
    const authLabelStyle = { display: "block", color: "#4e485b", fontSize: "13px", fontWeight: 700, marginTop: "15px" };
    const authButtonStyle = {
      width: "100%", border: 0, borderRadius: "12px", padding: "14px", marginTop: "20px",
      background: "linear-gradient(110deg, #8b5cf6, #6840d9)", color: "white", fontSize: "15px",
      fontWeight: 800, cursor: authLoading ? "wait" : "pointer", opacity: authLoading ? 0.7 : 1,
    };
    return (
      <div className="nextshow-auth-grid" style={{ minHeight: "100vh", background: "radial-gradient(circle at 80% 15%, #34245c 0, #171322 38%, #100e17 78%)", color: "#fff", display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(320px, 0.95fr)", alignItems: "center", gap: "clamp(28px, 7vw, 100px)", padding: "clamp(24px, 7vw, 90px)", boxSizing: "border-box" }}>
        <section style={{ maxWidth: "570px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "25px", fontWeight: 900, letterSpacing: "-1px", marginBottom: "58px" }}>
            <span style={{ display: "grid", placeItems: "center", width: "38px", height: "38px", borderRadius: "12px", background: "#a78bfa", color: "#211536" }}>N</span>
            next<span style={{ color: "#b9a4ff", marginLeft: "-10px" }}>show</span><span style={{ color: "#a78bfa", marginLeft: "-10px" }}>.</span>
          </div>
          <div style={{ color: "#c0aaff", fontSize: "11px", fontWeight: 900, letterSpacing: "3px", marginBottom: "18px" }}>YOUR CITY. YOUR SHOW.</div>
          <h1 style={{ fontSize: "clamp(42px, 5.5vw, 72px)", lineHeight: 1.04, letterSpacing: "-3px", margin: "0 0 22px", fontWeight: 900 }}>Make room for<br /><span style={{ color: "#b9a4ff" }}>great moments.</span></h1>
          <p style={{ maxWidth: "430px", color: "#c6c1d1", lineHeight: 1.8, fontSize: "16px" }}>Discover movies, live concerts and experiences. Your next unforgettable night starts here.</p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "30px" }}>
            {["🎬 Movies", "🎤 Live music", "🎭 Experiences"].map((item) => <span key={item} style={{ border: "1px solid #484054", borderRadius: "999px", padding: "10px 14px", color: "#e3dcef", fontSize: "13px" }}>{item}</span>)}
          </div>
        </section>
        <section style={{ width: "100%", maxWidth: "430px", margin: "0 auto", background: "#fbfaff", color: "#211d2b", borderRadius: "24px", padding: "clamp(24px, 4vw, 38px)", boxSizing: "border-box", boxShadow: "0 28px 90px #0005" }}>
          {authPage === "welcome" ? (
            <>
              <div style={{ color: "#7955d9", fontSize: "11px", fontWeight: 900, letterSpacing: "2px" }}>WELCOME TO NEXTSHOW</div>
              <h2 style={{ fontSize: "31px", letterSpacing: "-1px", margin: "12px 0 8px" }}>Your next show awaits.</h2>
              <p style={{ color: "#777182", lineHeight: 1.65, marginBottom: "28px" }}>Sign in to book your seats, discover offers and keep your tickets together.</p>
              <button type="button" style={authButtonStyle} onClick={() => { setAuthPage("login"); setAuthError(""); setAuthSuccess(""); }}>Log in</button>
              <button type="button" style={{ ...authButtonStyle, marginTop: "11px", background: "#eee8ff", color: "#5838a8" }} onClick={() => { setAuthPage("register"); setAuthError(""); setAuthSuccess(""); }}>Create an account</button>
              <p style={{ textAlign: "center", color: "#8b8597", fontSize: "12px", margin: "25px 0 0" }}>Simple booking. Better nights. All in one place.</p>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setAuthPage("welcome"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#7354bd", padding: 0, cursor: "pointer", fontWeight: 800 }}>← Back</button>
              <h2 style={{ fontSize: "30px", letterSpacing: "-1px", margin: "18px 0 7px" }}>{authPage === "login" ? "Welcome back" : "Create your account"}</h2>
              <p style={{ color: "#777182", margin: "0 0 20px", lineHeight: 1.6 }}>{authPage === "login" ? "Log in to continue to your NextShow home page." : "Register once, then sign in to start booking."}</p>
              {authError && <div role="alert" style={{ background: "#fff0f0", border: "1px solid #ffd0d0", color: "#a52a2a", borderRadius: "10px", padding: "11px 12px", fontSize: "13px", marginBottom: "12px" }}>{authError}</div>}
              {authSuccess && <div role="status" style={{ background: "#edfff5", border: "1px solid #b9f0d0", color: "#176b43", borderRadius: "10px", padding: "11px 12px", fontSize: "13px", marginBottom: "12px" }}>{authSuccess}</div>}
              {authPage === "login" ? (
                <form onSubmit={handleLoginSubmit}>
                  <label style={authLabelStyle}>Email address<input required type="email" autoComplete="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="you@example.com" style={authInputStyle} /></label>
                  <label style={authLabelStyle}>Password<input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Enter your password" style={authInputStyle} /></label>
                  <button type="submit" disabled={authLoading} style={authButtonStyle}>{authLoading ? "Logging in…" : "Log in"}</button>
                  <p style={{ textAlign: "center", color: "#777182", fontSize: "13px", margin: "20px 0 0" }}>New to NextShow? <button type="button" onClick={() => { setAuthPage("register"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#6840d9", fontWeight: 800, cursor: "pointer" }}>Register</button></p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <label style={authLabelStyle}>Full name<input required autoComplete="name" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="Your name" style={authInputStyle} /></label>
                  <label style={authLabelStyle}>Email address<input required type="email" autoComplete="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="you@example.com" style={authInputStyle} /></label>
                  <label style={authLabelStyle}>Phone number<input required type="tel" autoComplete="tel" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="Your phone number" style={authInputStyle} /></label>
                  <label style={authLabelStyle}>Password<input required type="password" autoComplete="new-password" minLength={6} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="At least 6 characters" style={authInputStyle} /></label>
                  <label style={authLabelStyle}>Confirm password<input required type="password" autoComplete="new-password" minLength={6} value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} placeholder="Enter password again" style={authInputStyle} /></label>
                  <button type="submit" disabled={authLoading} style={authButtonStyle}>{authLoading ? "Creating account…" : "Create account"}</button>
                  <p style={{ textAlign: "center", color: "#777182", fontSize: "13px", margin: "20px 0 0" }}>Already registered? <button type="button" onClick={() => { setAuthPage("login"); setAuthError(""); setAuthSuccess(""); }} style={{ border: 0, background: "transparent", color: "#6840d9", fontWeight: 800, cursor: "pointer" }}>Log in</button></p>
                </form>
              )}
            </>
          )}
        </section>
        <style>{`@media (max-width: 760px) { .nextshow-auth-grid { grid-template-columns: 1fr !important; } }`}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home" onClick={() => setActiveCategory("For You")}>
          <span className="brand-icon">N</span>
          <span>next<span className="brand-light">show</span></span>
          <span className="brand-dot">.</span>
        </a>

        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movies, concerts, events..."
            aria-label="Search events"
          />
          {search && (
            <button className="clear-search" type="button" onClick={() => setSearch("")}>
              ×
            </button>
          )}
        </div>

        <button
          className="city-button"
          type="button"
          onClick={() => setCity(city === "Hyderabad" ? "Bengaluru" : "Hyderabad")}
          title="Demo city selector"
        >
          <span>⌖</span> {city} <span className="chevron">⌄</span>
        </button>

        <button className="login-button" type="button" onClick={handleSignIn}>
          {isSignedIn ? "Sign out" : "Sign in"}
        </button>
      </header>

      <nav className="category-nav">
        <div className="category-inner">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className={`category-item ${activeCategory === category.name ? "active" : ""}`}
              onClick={() => setActiveCategory(category.name)}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow"><span className="live-dot" />YOUR CITY. YOUR SHOW.</div>
            <h1>Life is better<br /><span>with a little</span> <span className="accent">show.</span></h1>
            <p>From the big screen to the front row.<br />Find your next unforgettable moment.</p>
            <button
              className="hero-button"
              type="button"
              onClick={() => {
                setActiveCategory("For You");
                document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore events <span>↗</span>
            </button>
            <div className="hero-note"><span className="hero-note-icon">✦</span>YOUR NEXT GREAT MEMORY STARTS HERE</div>
          </div>

          <div className="hero-art" aria-label="Featured movie and live event artwork">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-glow" />
            <div className="hero-ticket">
              <span className="ticket-label">NEXTSHOW PRESENTS</span>
              <div className="ticket-symbol">N<span>✦</span></div>
              <div className="ticket-title">MAKE IT<br />A NIGHT.</div>
              <div className="ticket-bottom"><span>GOOD TIMES AHEAD</span><span>NS / 001</span></div>
            </div>
            <div className="floating-chip chip-top">✦ &nbsp; Discover more</div>
            <div className="floating-chip chip-bottom">Your next show awaits ↗</div>
          </div>
          <div className="hero-index">01 <span>/</span> 05</div>
        </section>

        <section className="quick-info">
          <div><span className="info-icon">◈</span><span><strong>One place,</strong> endless plans</span></div>
          <div><span className="info-icon">✦</span><span><strong>Find your</strong> next favourite</span></div>
          <div><span className="info-icon">↗</span><span><strong>Make plans,</strong> make memories</span></div>
        </section>

        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <div className="section-kicker">HANDPICKED FOR YOU</div>
              <h2>{activeCategory === "For You" ? "Find your next show" : `Explore ${activeCategory}`}<span className="heading-period">.</span></h2>
              <p>
                {activeCategory === "Movies"
                  ? "Big stories. Bigger screens. Your perfect movie night."
                  : activeCategory === "Concerts"
                  ? "Feel the music. Find your crowd. Live every moment."
                  : activeCategory === "Comedy"
                  ? "Good laughs, great nights, unforgettable punchlines."
                  : activeCategory === "Sports"
                  ? "Feel the energy. Cheer for your team, live."
                  : activeCategory === "Experiences"
                  ? "Discover something new, exciting, and extraordinary."
                  : "The events everyone's talking about, all in one place."}
              </p>
            </div>
            <div className="section-controls">
              <span className="event-count">{filteredEvents.length} EVENTS</span>
              <button className="view-all" type="button" onClick={() => { setActiveCategory("For You"); setSearch(""); }}>
                View all <span>↗</span>
              </button>
            </div>
          </div>

          {loadingEvents && <div className="empty-state"><h3>Loading events…</h3><p>Connecting to your NextShow backend.</p></div>}

          {apiError && !loadingEvents && (
            <div className="empty-state">
              <h3>Backend connection</h3>
              <p>{apiError}</p>
              <button className="hero-button" type="button" onClick={handleSignIn}>{isSignedIn ? "Sign out" : "Sign in"}</button>
              <button className="view-all" type="button" onClick={loadBackendData}>Retry connection ↻</button>
            </div>
          )}

          {!loadingEvents && !apiError && (
            <div className="event-grid">
              {filteredEvents.map((event) => (
                <article className="event-card" key={event.id}>
                  <button className={`event-image ${event.color}`} type="button" onClick={() => openEvent(event)} aria-label={`View ${event.title}`}>
                    <img src={event.image} alt={event.title} />
                    <span className="event-tag">{event.tag}</span>
                    <span className="rating">★ {event.rating}</span>
                    <span className="image-arrow">↗</span>
                  </button>
                  <div className="event-details">
                    <div className="event-category">{event.category}</div>
                    <h3>{event.title}</h3>
                    <p>{event.subtitle}</p>
                    <div className="event-meta">
                      <span>▦ &nbsp;{event.date}</span>
                      <span><small>{event.price > 0 ? "FROM" : ""}</small> {event.price > 0 ? `₹${event.price}` : "View prices"}</span>
                    </div>
                    <button className="book-button" type="button" onClick={() => openEvent(event)}>Explore event <span>↗</span></button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loadingEvents && !apiError && filteredEvents.length === 0 && (
            <div className="empty-state">
              <span>⌕</span><h3>No events found</h3><p>Try another search or explore a different category.</p>
              <button className="hero-button" type="button" onClick={() => { setSearch(""); setActiveCategory("For You"); }}>Show all events</button>
            </div>
          )}
        </section>

        <section className="bottom-banner">
          <div><span className="section-kicker">THE WORLD IS YOUR PLAYGROUND</span><h2>Make room for<br /><span>more moments.</span></h2></div>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("Experiences");
              document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Discover experiences <span>↗</span>
          </button>
          <div className="banner-decoration">N<span>✦</span></div>
        </section>

        <footer className="footer">
          <a className="brand footer-brand" href="#home"><span className="brand-icon">N</span><span>next<span className="brand-light">show</span></span><span className="brand-dot">.</span></a>
          <span>YOUR NEXT GREAT MEMORY STARTS HERE.</span>
          <span>© 2026 NEXTSHOW</span>
        </footer>
      </main>

      {selectedEvent && (
        <div className="modal-backdrop" onClick={closeEventModal}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" type="button" onClick={closeEventModal} aria-label="Close">×</button>
            <img src={selectedEvent.image} alt={selectedEvent.title} />
            <div className="modal-content">
              <span className="section-kicker">{selectedEvent.category}</span>
              <h2>{selectedEvent.title}</h2>
              <p>{selectedEvent.subtitle}</p>
              <div className="modal-info">
                <span>▦ &nbsp;{selectedEvent.date}</span>
                <span>★ &nbsp;{selectedEvent.rating}</span>
                <strong>{selectedEvent.price > 0 ? `From ₹${selectedEvent.price}` : "View prices"}</strong>
              </div>
              <p className="demo-notice">Event details are loaded from your NextShow backend. Choose a showtime to continue toward seat selection.</p>
              <button className="hero-button modal-button" type="button" onClick={handleContinue} disabled={showsLoading}>
                {showsLoading ? "Loading showtimes..." : String(showsLoadedForEventId) === String(selectedEvent.id) ? "Showtimes loaded" : "View showtimes"} <span>↗</span>
              </button>

              {showsError && <p className="error-message">{showsError}</p>}

              {!showsLoading && !showsError && shows.length === 0 && String(showsLoadedForEventId) !== String(selectedEvent.id) && (
                <p className="demo-notice">Click “View showtimes” to load available sessions for this event.</p>
              )}

              {!showsLoading && !showsError && shows.length === 0 && String(showsLoadedForEventId) === String(selectedEvent.id) && (
                <p className="demo-notice">No showtimes are currently configured for this event.</p>
              )}

              {shows.length > 0 && String(showsLoadedForEventId) === String(selectedEvent.id) && (
                <div className="showtimes">
                  <h3>Available showtimes</h3>
                  <div className="showtimes-list">
                    {shows.map((show) => {
                      const isSelected = String(selectedShow?.id) === String(show.id);
                      return (
                        <button
                          key={show.id}
                          type="button"
                          aria-pressed={isSelected}
                          className={`showtime-button ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            console.log("Showtime clicked:", show);
                            handleSelectShow(show);
                          }}
                        >
                          <strong>{show.showTime ? String(show.showTime).slice(0, 5) : "Time TBA"}</strong>
                          <span>{show.showDate || "Date TBA"}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedShow && (
                    <div className="seat-selection-panel">
                      <p className="demo-notice">Selected show: {selectedShow.showDate || "Date TBA"} at {selectedShow.showTime ? String(selectedShow.showTime).slice(0, 5) : "Time TBA"}</p>
                      <h3>Choose your seats</h3>
                      {seatsLoading && <p className="demo-notice">Loading seats for this show…</p>}
                      {seatsError && <p className="error-message">{seatsError}</p>}
                      {!seatsLoading && showSeats.length > 0 && (
                        <>
                          <div className="seat-legend"><span><i className="seat-dot available" /> Available</span><span><i className="seat-dot chosen" /> Selected</span><span><i className="seat-dot unavailable" /> Unavailable</span></div>
                          <div className="screen-label">SCREEN THIS WAY</div>
                          <div className="seat-grid">
                            {showSeats.map((seat) => {
                              const seatName = seat.seat?.seatNumber || seat.seat?.name || seat.seatNumber || seat.name || seat.seat?.label || `Seat ${seat.id}`;
                              const status = String(seat.status || seat.bookingStatus || "AVAILABLE").toUpperCase();
                              const available = status === "AVAILABLE";
                              const chosen = selectedSeatIds.includes(seat.id);
                              const seatStyle = !available
                                ? { background: "#3f3f50", color: "#a5a5b5", borderColor: "#555568", cursor: "not-allowed" }
                                : chosen
                                ? { background: "#a88aff", color: "#211536", borderColor: "#a88aff", boxShadow: "0 0 0 2px rgba(168,138,255,.22)", fontWeight: 800 }
                                : { background: "#143d32", color: "#8df0c8", borderColor: "#2fb889" };
                              return <button key={seat.id} type="button" disabled={!available} onClick={() => toggleSeat(seat)} className={`seat-button ${chosen ? "chosen" : ""} ${!available ? "unavailable" : ""}`} style={seatStyle} title={`${seatName} · ${seat.price != null ? `₹${seat.price}` : "price TBA"} · ${status}`}>{seatName}</button>;
                            })}
                          </div>
                          <div className="seat-booking-footer">
                            <span>{selectedSeatIds.length} seat(s) selected · ₹{showSeats.filter((seat) => selectedSeatIds.includes(seat.id)).reduce((sum, seat) => sum + Number(seat.price || 0), 0)}</span>
                            <button className="hero-button modal-button" type="button" disabled={selectedSeatIds.length === 0 || bookingLoading} onClick={handleCreateBooking}>{bookingLoading ? "Booking your seats…" : "Book now ↗"}</button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentPage === "checkout" && createdBooking && (
        <div className="checkout-page" role="dialog" aria-modal="true" aria-label="Booking summary">
          <div className="checkout-topbar">
            <button type="button" className="checkout-back" onClick={() => { setCurrentPage("home"); closeEventModal(); }}>← Back to NextShow</button>
            <div className="checkout-brand"><span className="brand-icon">N</span> next<span>show</span><b>.</b></div>
          </div>
          <div className="checkout-content">
            <div className="checkout-kicker">YOUR NIGHT, YOUR WAY</div>
            <h1>Booking <span>summary.</span></h1>
            <p className="checkout-subtitle">Your booking has been created. Review the details before moving to payment.</p>
            <div className="checkout-card">
              <div className="checkout-success-icon">✓</div>
              <div className="checkout-confirmation-label">BOOKING CREATED</div>
              <h2>{createdBooking.eventTitle}</h2>
              <div className="checkout-details-grid">
                <div><small>DATE</small><strong>{createdBooking.showDate || "Date TBA"}</strong></div>
                <div><small>SHOWTIME</small><strong>{createdBooking.showTime ? String(createdBooking.showTime).slice(0, 5) : "Time TBA"}</strong></div>
                <div><small>SEATS</small><strong>{createdBooking.seatLabels.join(", ") || "Selected seats"}</strong></div>
                <div><small>BOOKING ID</small><strong>{createdBooking.bookingId ?? "Created"}</strong></div>
              </div>
              <div className="checkout-total"><span>Total amount</span><strong>₹{createdBooking.totalAmount.toFixed(2)}</strong></div>
              <p className="checkout-note">Next step: connect the demo payment flow, then generate your ticket and QR code.</p>
              <button className="hero-button checkout-primary" type="button" onClick={() => window.alert("Your booking is created. The payment page is the next feature to connect.")}>Proceed to payment ↗</button>
              <button className="checkout-secondary" type="button" onClick={() => setCurrentPage("home")}>Back to seat selection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
