import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import PortalClientes from "./PortalClientes.jsx";

const esPortalClientes = window.location.pathname.startsWith("/clientes");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {esPortalClientes ? <PortalClientes /> : <App />}
  </React.StrictMode>
);
