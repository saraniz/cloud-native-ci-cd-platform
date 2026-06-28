// Import useState hook from React
// useState is used to store and update component state
import { useState } from "react";

// Import Login component (handles authentication)
import Login from "./Login";

// Import Dashboard component (main app after login)
import Dashboard from "./Dashboard";


function App() {

  // Create a state variable called "token"
  // setToken is used to update token value
  // Initial value is empty string → user is not logged in
  const [token, setToken] = useState("");


  return (
    <div>

      {/* Conditional rendering based on token state */}

      {/* If token is empty (user NOT logged in) */}
      {!token ? (

        // Show Login component
        // Pass setToken function as prop so Login can update token
        <Login setToken={setToken} />

      ) : (

        // If token exists (user logged in)
        // Show Dashboard component
        // Pass token as prop for authenticated API calls
        <Dashboard token={token} />

      )}

    </div>
  );
}

// Export App component so it can be used in index.js
export default App;