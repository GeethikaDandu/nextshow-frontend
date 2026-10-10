import React from "react";
import "../App.css";

export default function Payment({ booking, onBack, onSuccess }) {
  const [method, setMethod] = React.useState("UPI");

  if (!booking) return null;

  return (
    <div className="checkout-page">
      <div className="checkout-content">
        <div className="checkout-kicker">SECURE CHECKOUT · DEMO</div>
        <h1>Complete your <span>payment.</span></h1>

        <div className="checkout-card">
          <h2>{booking.eventTitle}</h2>
          <p>Booking ID: {booking.bookingId ?? "Created"}</p>
          <p>Seats: {booking.seatLabels?.join(", ")}</p>

          <div className="checkout-total">
            <span>Amount to pay</span>
            <strong>
              ₹{Number(booking.totalAmount || 0).toFixed(2)}
            </strong>
          </div>

          <h3>Select payment method</h3>

          {["UPI", "Card", "Net Banking"].map((item) => (
            <label
              key={item}
              style={{
                display: "block",
                padding: "12px",
                margin: "8px 0",
                border: "1px solid #ccc",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="payment"
                value={item}
                checked={method === item}
                onChange={() => setMethod(item)}
              />{" "}
              {item}
            </label>
          ))}

          <p className="checkout-note">
            Demo only. No real money will be charged.
          </p>

          <button
            className="hero-button checkout-primary"
            type="button"
            onClick={() => onSuccess(method)}
          >
            Pay ₹{Number(booking.totalAmount || 0).toFixed(2)}
          </button>

          <button
            className="checkout-secondary"
            type="button"
            onClick={onBack}
          >
            Back to summary
          </button>
        </div>
      </div>
    </div>
  );
}


