import React from "react";

export const IconLogoUmami: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  ...props
}) => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g clipPath="url(#clip0_22_26)">
        <circle
          cx="49.5"
          cy="46.5"
          r="38.5"
          fill="white"
          stroke="#979797"
          strokeWidth="6"
        />
        <path
          d="M100 45C100 72.6142 77.6143 95 50 95C22.3858 95 0.000319788 72.6142 3.57403e-07 45C-2.51813e-05 42.7922 0 39 0.500012 38C1.13111 36.824 1.09748 36.5243 2.49999 36C9.00001 36 23.002 36 50 36C80.0843 36 93.5 36.0805 97 36.0805C100.903 37.0113 100 39.4001 100 45Z"
          fill="#979797"
        />
      </g>
      <defs>
        <clipPath id="clip0_22_26">
          <rect width="100" height="100" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
