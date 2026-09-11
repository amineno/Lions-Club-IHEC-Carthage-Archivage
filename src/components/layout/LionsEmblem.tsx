import Image from "next/image";

const LionsEmblem = ({ size = 44 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      background: "#051C3B",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 0 0 2px rgba(224,169,32,0.7), 0 4px 14px rgba(0,0,0,0.18)",
      border: "1.5px solid #C99A10",
    }}
    aria-label="Lions Club IHEC Carthage"
  >
    <Image
      src="/lions-logo.jpeg"
      alt="Lions Club IHEC Carthage"
      width={size}
      height={size}
      style={{ objectFit: "cover", width: "100%", height: "100%" }}
      priority={false}
      unoptimized
    />
  </div>
);

export default LionsEmblem;
