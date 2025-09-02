import React from "react";

function FlipCard({ img, title, delay, animation }) {
  return (
    <div
      className="group relative w-full h-32 md:h-40 perspective"
      data-aos={animation}
      data-aos-delay={delay}
    >
      {/* Inner Card */}
      <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-hover:rotate-y-180">
        
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
