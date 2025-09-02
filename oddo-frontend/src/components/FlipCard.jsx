import React, { useState, useEffect } from "react";

function FlipCard({ img, title, delay, animation, autoFlip = false }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (autoFlip) {
      // Each card flips at a random interval between 2–6s
      const interval = setInterval(() => {
        setFlipped((prev) => !prev);
      }, Math.floor(Math.random() * 4000) + 2000);

      return () => clearInterval(interval);
    }
  }, [autoFlip]);

  return (
    <div
      className="relative w-full h-32 md:h-40 perspective"
      data-aos={animation}
      data-aos-delay={delay}
      // fallback hover control (works even with autoFlip)
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      {/* Inner wrapper */}
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          flipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front - Image */}
        <div className="absolute inset-0 backface-hidden">
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover rounded-xl shadow"
          />
        </div>

        {/* Back - Text */}
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white rounded-xl rotate-y-180 backface-hidden shadow">
          <span className="text-lg font-semibold">{title}</span>
        </div>
      </div>
    </div>
  );
}

export default FlipCard;
