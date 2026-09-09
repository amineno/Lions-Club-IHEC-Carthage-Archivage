import Link from "next/link";

const LionsEmblem = ({ size = 44 }: { size?: number }) => (
  <svg
    viewBox="0 0 44 44"
    width={size}
    height={size}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22 4l4.5 9 10 1.5-7.2 7 1.7 9.9L22 27l-9 4.4 1.7-9.9L7.5 14.5l10-1.5z" />
    <circle
      cx="22"
      cy="22"
      r="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export default LionsEmblem;
