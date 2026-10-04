import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BranchProvider } from "@/context/BranchContext";
import { ToastContainer } from "@/components/Toast";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <BranchProvider>
            <BrowserRouter basename={__BASE_PATH__}>
              <AppRoutes />
              <ToastContainer />
            </BrowserRouter>
          </BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
