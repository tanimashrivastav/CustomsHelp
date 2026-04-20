import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Index from "./pages/Index";
import Metrics from "./pages/Metrics";
import NotFound from "./pages/NotFound";
import { ScanSearch, BarChart3 } from "lucide-react";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <div className="flex h-screen flex-col bg-background">
        {/* Top Navigation */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
          <ScanSearch className="h-5 w-5 text-primary" />
          <h1 className="text-sm font-bold tracking-wide text-foreground">
            X-RAY ITEM DETECTOR
          </h1>
          <nav className="ml-6 flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <ScanSearch className="h-3.5 w-3.5" /> Detector
            </NavLink>
            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <BarChart3 className="h-3.5 w-3.5" /> Metrics
            </NavLink>
          </nav>
        </header>

        {/* Routes */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
