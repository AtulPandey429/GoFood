import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./screens/Home";
import Login from "./screens/Login";
import SignUp from "./screens/SignUp";
import MyOrder from "./screens/MyOrder";
import Checkout from "./screens/Checkout";
import OrderSuccess from "./screens/OrderSuccess";
import NotificationSettings from "./screens/NotificationSettings";
import AdminDashboard from "./screens/AdminDashboard";
import AuthCallback from "./screens/AuthCallback";
import { CartProvider } from "./components/ContextReducer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/order/success/:orderId" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
            <Route path="/myOrder" element={<ProtectedRoute><MyOrder /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
