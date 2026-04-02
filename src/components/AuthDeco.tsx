interface AuthDecoProps {
  title: string;
  subtitle: string;
}

export default function AuthDeco({ title, subtitle }: AuthDecoProps) {
  return (
    <div className="hidden lg:flex items-center justify-center bg-secondary p-12">
      <div className="max-w-md text-center">
        {/* Decorative grid */}
        <div className="grid grid-cols-3 gap-3 mb-8 mt-5">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`auth-square ${
                i % 2 === 0
                  ? "bg-primary/5 animate-pulse"
                  : "bg-accent-foreground/5"
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4 text-foreground">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
