interface MandateSelectorProps {
  mandats: { id: string; libelle: string; actif?: boolean }[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function MandateSelector({
  mandats,
  selectedId,
  onChange,
}: MandateSelectorProps) {
  return (
    <div className="mandate-selector">
      <span className="ms-label">Mandat :</span>
      {mandats.map((m) => (
        <span
          key={m.id}
          className={`mandate-pill ${selectedId === m.id ? "mp-active" : "mp-inactive"}`}
          onClick={() => onChange(m.id)}
          style={{ cursor: "pointer" }}
        >
          {m.libelle}
        </span>
      ))}
    </div>
  );
}
