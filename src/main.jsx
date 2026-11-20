import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/immersive/theme.css";
import "./styles/immersive/motion.css";
import "./styles/immersive/workspace.css";
import "./styles/immersive/landing.css";
import "./lib/theme";
import "./lib/design";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { JournalProvider } from "./journals/JournalContext";
import { TooltipProvider } from "./components/ui/tooltip";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <TooltipProvider delayDuration={400}>
      <AuthProvider>
        <JournalProvider>
          <App />
        </JournalProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>,
);
