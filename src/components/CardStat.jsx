// src/components/CardStat.jsx
const CardStat = ({ label, value, accent }) => {
  return (
    <div className="card-stat" data-accent={accent || "green"}>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
};

export default CardStat;
