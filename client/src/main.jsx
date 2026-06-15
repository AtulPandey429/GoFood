import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from "./contexts/WalletContext";
import { CryptoProvider } from "./contexts/CryptoContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <WalletProvider>
        <CryptoProvider>
          <App />
        </CryptoProvider>
      </WalletProvider>
    </AuthProvider>
  </React.StrictMode>
);
