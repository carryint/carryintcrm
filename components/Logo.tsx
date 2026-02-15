
import React from 'react';

interface LogoProps {
  className?: string;
  src?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-16", src }) => {
  // If a custom image URL is provided and it's not the default placeholder/empty
  if (src && src.startsWith('data:image') || (src && src.includes('http'))) {
    return (
      <img 
        src={src} 
        className={`${className} object-contain`} 
        alt="Company Logo" 
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Default Carryint SVG Logo
  return (
    <svg 
      viewBox="0 0 1000 300" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Orange Circle */}
      <circle cx="210" cy="150" r="140" fill="url(#paint0_linear)" />
      
      {/* Large Black 'C' */}
      <path 
        d="M260 90C245 75 225 68 200 68C145 68 105 105 105 150C105 195 145 232 200 232C225 232 245 225 260 210" 
        stroke="black" 
        strokeWidth="45" 
        strokeLinecap="round" 
      />
      
      {/* White Arrows - Bottom Arrow */}
      <path d="M265 150H315M315 150L295 130M315 150L295 170" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      {/* White Arrows - Top Arrow */}
      <path d="M295 115H335M335 115L315 95M335 115L315 135" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* "arryint" text */}
      <text 
        x="345" 
        y="190" 
        fontFamily="Inter, sans-serif" 
        fontSize="175" 
        fontWeight="800" 
        fill="black"
        letterSpacing="-8"
      >
        arryint
      </text>
      
      {/* ".com" text rotated */}
      <text 
        x="930" 
        y="190" 
        fontFamily="Inter, sans-serif" 
        fontSize="55" 
        fontWeight="600" 
        fill="black" 
        transform="rotate(-90, 930, 190)"
      >
        .com
      </text>
      
      <defs>
        <linearGradient id="paint0_linear" x1="70" y1="70" x2="350" y2="230" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA04D" />
          <stop offset="1" stopColor="#FF7A00" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
