export function FrenchFlag({ className = "h-3 w-5" }: { className?: string }) {
  return (
    <span
      aria-label="Drapeau français"
      role="img"
      className={`inline-flex overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}
    >
      <span className="flex-1 bg-[#0055A4]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#EF4135]" />
    </span>
  );
}
