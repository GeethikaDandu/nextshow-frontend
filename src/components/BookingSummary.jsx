
import "../App.css";

export default function BookingSummary({ booking, onBack, onPayment }) {
  if (!booking) return null;

  return (
    <div
      className="checkout-page"
      role="dialog"
      aria-modal="true"
      aria-label="Booking summary"
    >
      <div className="checkout-topbar">
        <button
          type="button"
          className="checkout-back"
          onClick={onBack}
        >
          ← Back to NextShow
        </button>

        <div className="checkout-brand">
          <span className="brand-icon">N</span> next<span>show</span><b>.</b>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-kicker">YOUR NIGHT, YOUR WAY</div>
        <h1>
          Booking <span>summary.</span>
        </h1>
        <p className="checkout-subtitle">
          Your booking has been created. Review the details before moving to payment.
        </p>

        <div className="checkout-card">
          <div className="checkout-success-icon">✓</div>
          <div className="checkout-confirmation-label">BOOKING CREATED</div>
          <h2>{booking.eventTitle}</h2>

          <div className="checkout-details-grid">
            <div>
              <small>DATE</small>
              <strong>{booking.showDate || "Date TBA"}</strong>
            </div>
            <div>
              <small>SHOWTIME</small>
              <strong>
                {booking.showTime
                  ? String(booking.showTime).slice(0, 5)
                  : "Time TBA"}
              </strong>
            </div>
            <div>
              <small>SEATS</small>
              <strong>{booking.seatLabels?.join(", ") || "Selected seats"}</strong>
            </div>
            <div>
              <small>BOOKING ID</small>
              <strong>{booking.bookingId ?? "Created"}</strong>
            </div>
          </div>


<div className="checkout-price-breakdown">
  <div className="checkout-total">
    <span>Original price</span>
    <strong>
      ₹{Number(booking.originalAmount ?? booking.raw?.originalAmount ?? booking.raw?.original_amount ?? 0).toFixed(2)}
    </strong>
  </div>

  {Number(booking.freeTicketDiscount ?? booking.raw?.freeTicketDiscount ?? booking.raw?.free_ticket_discount ?? 0) > 0 && (
    <div className="checkout-total">
      <span>Free ticket discount</span>
      <strong>
        −₹{Number(booking.freeTicketDiscount ?? booking.raw?.freeTicketDiscount ?? booking.raw?.free_ticket_discount).toFixed(2)}
      </strong>
    </div>
  )}

  {Number(booking.rewardDiscount ?? booking.raw?.rewardDiscount ?? booking.raw?.reward_discount ?? 0) > 0 && (
    <div className="checkout-total">
      <span>Rewards discount</span>
      <strong>
        −₹{Number(booking.rewardDiscount ?? booking.raw?.rewardDiscount ?? booking.raw?.reward_discount).toFixed(2)}
      </strong>
    </div>
  )}

  <div className="checkout-total">
    <span>Final amount</span>
    <strong>
      ₹{Number(booking.totalAmount ?? booking.raw?.totalAmount ?? booking.raw?.total_amount ?? 0).toFixed(2)}
    </strong>
  </div>
</div>


          <p className="checkout-note">
            Next step: connect the payment flow, then generate your ticket and QR code.
          </p>

          <button
            className="hero-button checkout-primary"
            type="button"
            onClick={onPayment}
          >
            Proceed to payment ↗
          </button>

          <button
            className="checkout-secondary"
            type="button"
            onClick={onBack}
          >
            Back to seat selection
          </button>
        </div>
      </div>
    </div>
  );
}
