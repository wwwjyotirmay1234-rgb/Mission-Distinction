export function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none z-[9999] flex items-center justify-center dark:hidden"
    >
      <img
        src={`${import.meta.env.BASE_URL}md-logo.jpeg`}
        alt=""
        draggable={false}
        style={{
          width: "min(55vw, 420px)",
          opacity: 0.06,
          filter: "grayscale(30%)",
          userSelect: "none",
        }}
      />
    </div>
  );
}
