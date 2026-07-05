import React, { useState } from "react";
import {
  User,
  Youtube,
  Instagram,
  Twitter,
  MessageCircle,
  HelpCircle,
  Lock,
  LogOut,
  CheckCircle,
  XCircle,
  ChevronRight,
  Facebook,
  Plus,
} from "lucide-react";
import StartCreating from "./StartCreating";

// A simple placeholder component for the "My Projects" section
const MyProjects = ({ onCreateProject }) => {
  // New component for the floating "add" button
  const CreateProjectButton = () => {
    return (
      <button
        onClick={onCreateProject}
        className="fixed bottom-8  z-50 bg-pink-600 text-white rounded-full w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-lg hover:bg-pink-700 transform transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-opacity-50"
        title="Create a new project"
      >
        <Plus size={32} />
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-start p-4 md:p-8 min-h-full relative">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-4">
        Your Projects
      </h2>
      <p className="text-gray-400 text-sm sm:text-base max-w-xl text-center">
        This is where you'll see a list of your work in progress. Each project
        will have its own thumbnail and title.
      </p>
      {/* This div will eventually hold the grid of projects */}
      <div className="flex flex-wrap justify-center items-center w-full h-full mt-8">
        <div className="text-gray-500 text-lg">
          No projects yet. Start by creating one!
        </div>
      </div>

      <CreateProjectButton />
    </div>
  );
};

// A simple placeholder component for the "My Creations" section
const MyCreations = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-64">
      <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mb-4">
        Your Creations
      </h2>
      <p className="text-gray-400 text-sm sm:text-base max-w-xl">
        This section will display your finished and exported animations, ready
        to be shared with the world!
      </p>
      {/* You would eventually map over a list of creation data here */}
    </div>
  );
};

// Updated and more detailed UserProfile component
const UserProfile = () => {
  // Placeholder data for demonstration
  const user = {
    name: "Inky User",
    email: "user@example.com",
    profilePicUrl: "https://placehold.co/100x100/36393f/ffffff?text=U",
    subscribed: false,
    socials: {
      youtube: false,
      instagram: false,
      tiktok: false,
      facebook: false,
    },
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4 sm:p-8">
      <div className="w-full bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 border-2 border-purple-500 mb-4">
            <img
              src={user.profilePicUrl}
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-purple-400">
            {user.name}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            {user.email}
          </p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
          Account Settings
        </h3>
        <div className="flex flex-col space-y-4">
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <span className="flex items-center">
              <Lock size={20} className="mr-3 text-gray-400" />
              Change Password
            </span>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 transition-colors">
            <span className="flex items-center">
              <LogOut size={20} className="mr-3" />
              Log Out
            </span>
            <ChevronRight size={20} className="text-gray-200" />
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
          Subscription
        </h3>
        <div className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700">
          <span className="flex items-center">
            {user.subscribed ? (
              <CheckCircle size={20} className="mr-3 text-green-400" />
            ) : (
              <XCircle size={20} className="mr-3 text-red-400" />
            )}
            {user.subscribed ? "Premium Plan" : "Free Plan"}
          </span>
          <button className="text-sm text-blue-400 hover:underline">
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Social Connections */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
          Connect Accounts to Share
        </h3>
        <div className="flex flex-col space-y-4">
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <span className="flex items-center">
              <Youtube
                size={20}
                className={`mr-3 ${user.socials.youtube ? "text-red-500" : "text-gray-400"}`}
              />
              YouTube
            </span>
            {user.socials.youtube ? "Connected" : "Connect"}
          </button>
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <span className="flex items-center">
              <Instagram
                size={20}
                className={`mr-3 ${user.socials.instagram ? "text-pink-500" : "text-gray-400"}`}
              />
              Instagram
            </span>
            {user.socials.instagram ? "Connected" : "Connect"}
          </button>
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <span className="flex items-center">
              <Twitter
                size={20}
                className={`mr-3 ${user.socials.twitter ? "text-blue-400" : "text-gray-400"}`}
              />
              X (formerly Twitter)
            </span>
            {user.socials.twitter ? "Connected" : "Connect"}
          </button>
          <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <span className="flex items-center">
              <Facebook
                size={20}
                className={`mr-3 ${user.socials.facebook ? "text-blue-500" : "text-gray-400"}`}
              />
              Facebook
            </span>
            <span className="text-xs text-gray-500">Coming Soon</span>
          </button>
        </div>
      </div>

      {/* Community & Support */}
      <div className="w-full bg-gray-800 rounded-lg shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-gray-700 pb-2">
          Community & Support
        </h3>
        <div className="flex justify-around items-center space-x-4">
          <button className="flex flex-col items-center text-center p-2 hover:text-white transition-colors">
            <MessageCircle size={32} className="text-purple-400" />
            <span className="mt-1 text-sm text-gray-400">Discord</span>
          </button>
          <button className="flex flex-col items-center text-center p-2 hover:text-white transition-colors">
            <Youtube size={32} className="text-red-500" />
            <span className="mt-1 text-sm text-gray-400">YouTube</span>
          </button>
          <button className="flex flex-col items-center text-center p-2 hover:text-white transition-colors">
            <Instagram size={32} className="text-pink-500" />
            <span className="mt-1 text-sm text-gray-400">Instagram</span>
          </button>
          <button className="flex flex-col items-center text-center p-2 hover:text-white transition-colors">
            <Twitter size={32} className="text-blue-400" />
            <span className="mt-1 text-sm text-gray-400">X</span>
          </button>
          <button className="flex flex-col items-center text-center p-2 hover:text-white transition-colors">
            <HelpCircle size={32} className="text-gray-400" />
            <span className="mt-1 text-sm text-gray-400">Help</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// The main gallery component
const MyGallery = () => {
  // State to manage which content view is currently active.
  const [activeView, setActiveView] = useState("projects");
  // New state to manage visibility of the StartCreating page
  const [showStartCreating, setShowStartCreating] = useState(false);

  // Function to handle opening the StartCreating page
  const handleCreateNewProject = () => {
    setShowStartCreating(true);
  };

  // Function to handle closing the StartCreating page
  const handleCloseStartCreating = () => {
    setShowStartCreating(false);
  };

  // Conditional rendering based on the activeView state
  const renderContent = () => {
    if (showStartCreating) {
      return <StartCreating onClose={handleCloseStartCreating} />;
    }

    switch (activeView) {
      case "profile":
        return <UserProfile />;
      case "projects":
        return <MyProjects onCreateProject={handleCreateNewProject} />;
      case "creations":
        return <MyCreations />;
      default:
        return <MyProjects onCreateProject={handleCreateNewProject} />; // Fallback to MyProjects
    }
  };

  return (
    <div className="flex flex-col min-h-full h-fit bg-gray-900 text-white font-sans antialiased">
      {/* Main Header Section */}
      <header className="p-6 md:p-4 h-24 bg-gray-800 border-b border-gray-700 shadow-lg flex justify-center items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-500 tracking-wide">
          Inky
        </h1>
      </header>

      {/* Dynamic Navigation Bar */}
      <nav className="sticky top-0 z-10 bg-gray-800 shadow-md h-fit">
        <div className="container mx-auto max-w-5xl flex items-center justify-center sm:justify-between px-4 py-3 h-20">
          {/* The logo/title section (can be a link back to home) */}
          <div className="hidden sm:block mt-4 text-2xl font-bold text-gray-200">
            My Gallery
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            {/* User Profile Icon */}
            <button
              onClick={() => {
                setActiveView("profile");
                setShowStartCreating(false);
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer
                                ${activeView === "profile" ? "bg-purple-700" : "hover:bg-purple-700"}
                            `}
              title="User Profile"
            >
              <User
                className={`h-6 w-6 transition-colors ${activeView === "profile" ? "text-white" : "text-gray-400 hover:text-white"}`}
              />
            </button>

            {/* My Projects Link */}
            <button
              onClick={() => {
                setActiveView("projects");
                setShowStartCreating(false);
              }}
              className={`
                                font-semibold text-lg py-2 transition-all duration-300 ease-in-out
                                ${
                                  activeView === "projects"
                                    ? "text-blue-400 border-b-2 border-blue-400"
                                    : "text-gray-400 hover:text-white"
                                }
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                            `}
            >
              My Projects
            </button>

            {/* My Creations Link */}
            <button
              onClick={() => {
                setActiveView("creations");
                setShowStartCreating(false);
              }}
              className={`
                                font-semibold text-lg py-2 transition-all duration-300 ease-in-out
                                ${
                                  activeView === "creations"
                                    ? "text-green-400 border-b-2 border-green-400"
                                    : "text-gray-400 hover:text-white"
                                }
                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
                            `}
            >
              My Creations
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-5xl flex-grow p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default MyGallery;
