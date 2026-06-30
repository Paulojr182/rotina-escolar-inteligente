import { CATEGORIES } from "@/lib/rotina";

export function Legend() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <div
            key={cat.id}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", cat.id);
            }}
            className={`flex items-start gap-2 rounded-xl border border-${cat.color}/20 bg-${cat.color}/10 p-2.5 cursor-grab active:cursor-grabbing hover:bg-${cat.color}/20 transition-colors`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-${cat.color} text-white`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold leading-tight text-${cat.color}`}>
                {cat.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                {cat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
