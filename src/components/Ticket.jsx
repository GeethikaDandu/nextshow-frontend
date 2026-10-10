
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import "../App.css";

export default function Ticket({ booking, onBack }) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!booking) return null;

  const bookingReference = booking.bookingId ?? "Created";

  const qrData = JSON.stringify({
    bookingId: bookingReference,
    event: booking.eventTitle,
    date: booking.showDate,
    time: booking.showTime,
    seats: booking.seatLabels || [],
  });

  async function downloadTicket() {
    if (!ticketRef.current || downloading) return;

    setDownloading(true);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `NextShow-Ticket-${bookingReference}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Ticket download failed:", error);
      window.alert("Could not download the ticket. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-content">
        <div className="checkout-card" ref={ticketRef}>
          <div className="checkout-success-icon">✓</div>

          <h1>Your ticket is ready!</h1>
          <h2>{booking.eventTitle}</h2>

          <p>
            <strong>Booking ID:</strong> {bookingReference}
          </p>

          <p>
            <strong>Date:</strong> {booking.showDate || "Date TBA"}
          </p>

          <p>
            <strong>Time:</strong>{" "}
            {booking.showTime
              ? String(booking.showTime).slice(0, 5)
              : "Time TBA"}
          </p>

          <p>
            <strong>Seats:</strong>{" "}
            {booking.seatLabels?.join(", ") || "Selected seats"}
          </p>

          
<div className="ticket-price-breakdown">
  <p>
    <strong>Original price:</strong>{" "}
    ₹{Number(booking.originalAmount ?? booking.original_amount ?? 0).toFixed(2)}
  </p>

  {Number(booking.freeTicketDiscount ?? booking.free_ticket_discount ?? 0) > 0 && (
    <p>
      <strong>Free ticket discount:</strong> −₹
      {Number(booking.freeTicketDiscount ?? booking.free_ticket_discount).toFixed(2)}
    </p>
  )}

  {Number(booking.rewardDiscount ?? booking.reward_discount ?? 0) > 0 && (
    <p>
      <strong>Rewards discount:</strong> −₹
      {Number(booking.rewardDiscount ?? booking.reward_discount).toFixed(2)}
    </p>
  )}

  <p>
    <strong>Final amount:</strong>{" "}
    ₹{Number(booking.totalAmount ?? booking.total_amount ?? 0).toFixed(2)}
  </p>
</div>


          <div style={{ textAlign: "center", margin: "24px 0" }}>
            <QRCodeSVG value={qrData} size={180} level="M" />
            <p>Scan QR code for booking details</p>
          </div>
        </div>

        <button
          className="hero-button"
          type="button"
          onClick={downloadTicket}

          disabled={downloading}
        >

          {downloading ? "Preparing ticket..." : "Download Ticket ↓"}
        </button>


<button
  className="hero-button"
  type="button"
  onClick={onBack}
  style={{
    display: "block",
    marginTop: "20px",
    width: "100%"
  }}
>
  Back to NextShow
</button>
</div>
    </div>
  );
}
