import { useLocation, Link } from "react-router-dom";
import { ScanLine, Leaf, Bell, Clock } from "lucide-react";

const tabs = [
  { path: "/", icon: ScanLine, label: "Scanner" },
  { path: "/plants", icon: Leaf, label: "Plantas" },
  { path: "/reminders", icon: Bell, label: "Lembretes" },
  { path: "/history", icon: Clock, label: "Historico" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5EBE5] safe-bottom"
      style={{ zIndex: 99999 }}
      data-testid="bottom-nav"
    >
      <div
        className="grid grid-cols-4 items-center max-w-lg mx-auto"
        style={{ height: "68px", position: "relative", zIndex: 99999 }}
      >
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center gap-0.5 h-full relative"
              style={{ zIndex: 99999 }}
              data-testid={`nav-${tab.label.toLowerCase()}-tab`}
            >
              {tab.path === "/" ? (
                <div
                  className={`rounded-full p-2.5 shadow-md transition-all duration-300 ${
                    isActive
                      ? "bg-[#1C3F2A] text-white scale-110"
                      : "bg-[#EEF2EB] text-[#1C3F2A]"
                  }`}
                >
                  <Icon size={20} />
                </div>
              ) : (
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={`transition-colors ${
                    isActive ? "text-[#1C3F2A]" : "text-[#8B9D8E]"
                  }`}
                />
              )}
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  isActive ? "text-[#1C3F2A]" : "text-[#8B9D8E]"
                }`}
              >
                {tab.label}
              </span>
              {isActive && tab.path !== "/" && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#1C3F2A]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
