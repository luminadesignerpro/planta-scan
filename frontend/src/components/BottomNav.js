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
      className="fixed bottom-0 w-full backdrop-blur-xl bg-white/85 border-t border-[#E5EBE5] z-50 safe-bottom"
      data-testid="bottom-nav"
    >
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
          const Icon = tab.icon;

          if (tab.path === "/") {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center gap-0.5 relative"
                data-testid="nav-scanner-tab"
              >
                <div
                  className={`rounded-full p-3 -mt-5 shadow-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[#1C3F2A] text-white scale-110"
                      : "bg-[#EEF2EB] text-[#1C3F2A]"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide ${
                    isActive ? "text-[#1C3F2A]" : "text-[#8B9D8E]"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 transition-all duration-200 relative ${
                isActive ? "text-[#1C3F2A]" : "text-[#8B9D8E]"
              }`}
              data-testid={`nav-${tab.label.toLowerCase()}-tab`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#1C3F2A]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
