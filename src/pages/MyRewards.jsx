
import { useEffect, useState } from "react";
import "../App.css";

export default function MyRewards({ onBack }) {
  const [rewards, setRewards] = useState({
    bronze: 0,
    silver: 0,
    gold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRewards() {
      try {
        const token = localStorage.getItem("nextshow_token");

        const response = await fetch(
  `${import.meta.env.PROD ? "https://nextshow-backend.onrender.com/api" : "/api"}/rewards/me`,
  {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not load rewards.");
        }

        const data = await response.json();
        setRewards({
          bronze: data.bronze ?? 0,
          silver: data.silver ?? 0,
          gold: data.gold ?? 0,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, []);

  const cards = [
    {
      name: "Bronze",
      amount: rewards.bronze,
      description: "Collect 3 Bronze to get 1 Silver",
      symbol: "🥉",
    },
    {
      name: "Silver",
      amount: rewards.silver,
      description: "1 Silver = ₹20 off · 2 Silver = ₹50 off",
      symbol: "🥈",
    },
    {
      name: "Gold",
      amount: rewards.gold,
      description: "Redeem Gold for 50% off",
      symbol: "🥇",
    },
  ];

  return (
    <div className="checkout-page">
      <div className="checkout-content">
        <button
          className="hero-button"
          onClick={onBack}
          type="button"
        >
          ← Back to NextShow
        </button>

        <h1>My Rewards</h1>
        <p>Your rewards, your next experience.</p>

        {loading ? (
          <p>Loading your rewards...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          <div className="rewards-grid">
            {cards.map((card) => (
              <div className="checkout-card" key={card.name}>
                <div style={{ fontSize: "42px" }}>
                  {card.symbol}
                </div>
                <h2>{card.name}</h2>
                <h1>{card.amount}</h1>
                <p>{card.description}</p>
              </div>
            ))}
          </div>
        )}

        <p>
          Earn 1 Bronze reward after each successful booking.
        </p>
      </div>
    </div>
  );
}
