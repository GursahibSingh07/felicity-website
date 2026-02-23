import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import BrowseEvents from "./pages/BrowseEvents";
import EventDetails from "./pages/EventDetails";
import ClubsOrganizers from "./pages/ClubsOrganizers";
import OrganizerDetail from "./pages/OrganizerDetail";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import AdminAnalytics from "./pages/AdminAnalytics";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import OrganizerEventDetail from "./pages/OrganizerEventDetail";
import OngoingEvents from "./pages/OngoingEvents";
import ManageOrganizers from "./pages/ManageOrganizers";
import QRScanner from "./pages/QRScanner";



function App() {
  return (
    <>
      <Navbar />  

      <Routes>
        <Route path="/" element={<Home />} />

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
          path="/events/:id"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clubs"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <ClubsOrganizers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clubs/:id"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <OrganizerDetail />
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

        <Route
          path="/organizer/events/:id"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerEventDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/ongoing"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OngoingEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/scanner/:eventId"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <QRScanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAnalytics />
              </ProtectedRoute>
          }
        />

        <Route
          path="/admin/organizers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageOrganizers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["participant", "organizer", "admin"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;

