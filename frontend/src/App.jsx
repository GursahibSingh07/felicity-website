import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BrowseEvents from "./pages/BrowseEvents";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";



function App() {
  return (
    <>
      <Navbar />  

      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant/dashboard"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <BrowseEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/create"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <EditEvent />
            </ProtectedRoute>
          }
        />


      </Routes>
    </>
  );
}

export default App;

