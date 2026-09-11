import Image from "next/image";

const LionsEmblem = ({ size = 44 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      overflow: "hidden",
      background: "#0A1F3D",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Image
      src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=Lions%20Club%20IHEC%20Carthage%20official%20logo%20circular%20emblem%20with%20two%20lion%20heads%20facing%20outward%2C%20central%20letter%20L%20in%20blue%20and%20gold%20yellow%20colors%2C%20text%20LIONS%20INTERNATIONAL%20around%20circle%2C%20dark%20navy%20blue%20background%20with%20golden%20laurel%20wreath%2C%20clean%20vector%20style%20emblem%2C%20professional&image_size=square_hd"
      alt="Lions Club IHEC Carthage"
      width={size}
      height={size}
      style={{ objectFit: "cover", width: "100%", height: "100%" }}
      priority
    />
  </div>
);

export default LionsEmblem;
