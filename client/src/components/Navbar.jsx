import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="navbar bg-base-100 shadow-md px-4 sticky top-0 z-10">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl">
          Ticket Booking System
        </Link>
      </div>
      <div className="flex-none gap-2">
        {user ? (
          <>
            <Link to="/my-tickets" className="btn btn-ghost">
              My Tickets
            </Link>
            <span className="hidden sm:inline text-sm opacity-70">
              {user.name}
            </span>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}