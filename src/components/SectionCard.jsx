function SectionCard({ children, className = '' }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export default SectionCard;
