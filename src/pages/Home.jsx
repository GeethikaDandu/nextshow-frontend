import { useEffect, useMemo, useState } from "react";
import { getEvents, getCategories, loginUser, registerUser, getShowsByEvent } from "../services/api";
import AuthPages from "../components/AuthPages";
import "../App.css";
import BookingSummary from "../components/BookingSummary";
import Ticket from "../components/Ticket";
import Payment from "../components/Payment";
import MyRewards from "./MyRewards";
const defaultCategoryIcons = {
  Movies: "🎬",
  Concerts: "🎤",
  Comedy: "🎭",
  Sports: "🏟️",
  Experiences: "🎡",
};

const fallbackImages = {
  Movies:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700",
  Concerts:
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=700",
  Comedy:
    "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=700",
  Sports:
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=700",
  Experiences:
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=700",
  Theatre:
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=700",
};

const eventImages = {
  "hyderabad cricket showdown":
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=700",
  "hyderabad football cup":
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=700",
};

function getSeatPrice(seat) {
  const value =
    seat.price ??
    seat.pricePerSeat ??
    seat.seat?.price;

  const price = Number(value);

  return Number.isFinite(price) && value !== null && value !== undefined && value !== ""
    ? price
    : 0;
}


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
   image:
  eventImages[title.toLowerCase().trim()] ||
  (imageSource.startsWith("http") && category !== "Sports"
    ? imageSource
    : fallbackImages[category] || fallbackImages.Movies),
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
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const quantityCategories = ["Concerts", "Comedy", "Experiences"];

const isQuantityEvent = quantityCategories.some(
  (category) =>
    selectedEvent?.category?.toLowerCase() === category.toLowerCase()
);
const [couponCode, setCouponCode] = useState("");
const [silverRewards, setSilverRewards] = useState(0);
const [goldReward, setGoldReward] = useState(false);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
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
const response = await fetch(
  `${import.meta.env.PROD ? "https://nextshow-backend.onrender.com/api" : "/api"}/show-seats/show/${show.id}`,
  {        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  if (!selectedShow || bookingLoading) return;

  const quantityCategories = ["Concerts", "Comedy", "Experiences"];
  const isQuantityEvent = quantityCategories.some(
    (category) =>
      selectedEvent?.category?.toLowerCase() === category.toLowerCase()
  );

  const availableSeats = showSeats.filter(
    (seat) => (seat.status || "").toUpperCase() === "AVAILABLE"
  );

  const bookingSeatIds = isQuantityEvent
    ? availableSeats.slice(0, Number(ticketQuantity)).map((seat) => seat.id)
    : selectedSeatIds;

  if (bookingSeatIds.length === 0) {
    window.alert(
      isQuantityEvent
        ? "No tickets are available for this show."
        : "Please select at least one seat."
    );
    return;
  }

  if (isQuantityEvent && bookingSeatIds.length < Number(ticketQuantity)) {
    window.alert("Not enough tickets are available.");
    return;
  }

  setBookingLoading(true);

  try {
    const token = localStorage.getItem("nextshow_token");

    if (!token) {
      throw new Error("Please log in again before booking.");
    }

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        showId: selectedShow.id,
        showSeatIds: bookingSeatIds,
        couponCode: couponCode.trim() || null,
        silverRewards: Number(silverRewards),
        goldReward: Boolean(goldReward),
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        `Booking failed (HTTP ${response.status}).`
      );
    }

    const bookingId = result.id ?? result.bookingId;

    const totalAmount = Number(
      result.totalAmount ??
      result.total_amount ??
      result.finalAmount ??
      result.final_amount ??
      result.amount ??
      0
    );

    const originalAmount = Number(
      result.originalAmount ?? result.original_amount ?? 0
    );

    const freeTicketDiscount = Number(
      result.freeTicketDiscount ?? result.free_ticket_discount ?? 0
    );

    const rewardDiscount = Number(
      result.rewardDiscount ?? result.reward_discount ?? 0
    );

    const seatLabels = showSeats
      .filter((seat) => bookingSeatIds.includes(seat.id))
      .map(
        (seat) =>
          seat.seat?.seatNumber ||
          seat.seat?.name ||
          seat.seatNumber ||
          seat.name ||
          `Ticket ${seat.id}`
      );

    setCreatedBooking({
      bookingId,
      totalAmount,
      originalAmount,
      freeTicketDiscount,
      rewardDiscount,
      seatLabels,
      showDate: selectedShow.showDate,
      showTime: selectedShow.showTime,
      eventTitle:
        selectedEvent?.title ||
        selectedShow.event?.title ||
        "Your show",
      raw: result,
    });

    setCurrentPage("checkout");
  } catch (error) {
    window.alert(
      `Could not create booking: ${error.message || "Please try again."}`
    );
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
    return (
      <AuthPages
        authPage={authPage}
        setAuthPage={setAuthPage}
        authLoading={authLoading}
        authError={authError}
        setAuthError={setAuthError}
        authSuccess={authSuccess}
        setAuthSuccess={setAuthSuccess}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        registerForm={registerForm}
        setRegisterForm={setRegisterForm}
        handleLoginSubmit={handleLoginSubmit}
        handleRegisterSubmit={handleRegisterSubmit}
      />
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

<button
  className="login-button"
  type="button"
  onClick={() => setCurrentPage("rewards")}
>
  🏆 My Rewards
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
<span>
  {selectedSeatIds.length} seat(s) selected · ₹
  {showSeats
    .filter((seat) => selectedSeatIds.includes(seat.id))
    .reduce((sum, seat) => sum + getSeatPrice(seat), 0)}
</span>

<div className="rewards-section">
  <h3>Coupons & Rewards</h3>

<label htmlFor="couponCode">Coupon Code</label>
<input
  id="couponCode"
  type="text"
  placeholder="Enter coupon code"
  value={couponCode}
  onChange={(e) => setCouponCode(e.target.value)}
/>

<label htmlFor="silverRewards">Silver Rewards</label>
<select
  id="silverRewards"
  value={silverRewards}
  onChange={(e) => {
    setSilverRewards(Number(e.target.value));
    setGoldReward(false);
  }}
>

    <option value={0}>Don't use rewards</option>
    <option value={1}>1 Silver — ₹20 off</option>
    <option value={2}>2 Silver — ₹50 off</option>
  </select>

  <label className="reward-checkbox">
    <input
      type="checkbox"
      checked={goldReward}
      onChange={(e) => {
        setGoldReward(e.target.checked);
        if (e.target.checked) setSilverRewards(0);
      }}
    />
    Redeem 1 Gold reward — 50% off
  </label>
</div>

<button
  className="hero-button modal-button"
  type="button"
  disabled={selectedSeatIds.length === 0 || bookingLoading}
  onClick={handleCreateBooking}
>
  {bookingLoading ? "Booking your seats…" : "Book now ↗"}
</button>
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
  <BookingSummary
    booking={createdBooking}
    onBack={() => {
      setCurrentPage("home");
      closeEventModal();
    }}
    onPayment={() => setCurrentPage("payment")}
  />
)}

{currentPage === "rewards" && (
  <MyRewards
    onBack={() => setCurrentPage("home")}
  />
)}

{currentPage === "payment" && createdBooking && (
  <Payment
    booking={createdBooking}
    onBack={() => setCurrentPage("checkout")}
    onSuccess={(method) => {
      window.alert(
        `Demo payment successful using ${method}. No real money was charged.`
      );
      setCurrentPage("ticket");
    }}
  />
)}

{currentPage === "ticket" && createdBooking && (
  <Ticket
    booking={createdBooking}
    onBack={() => {
      setCurrentPage("home");
      closeEventModal();
    }}
  />
)}
    </div>
  );
}
export default App;
