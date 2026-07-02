// // Import axios library (used for making HTTP requests from frontend)
import axios from "axios";

export const authAPI = axios.create({
  baseURL: "http://localhost:5001"
});

export const studyAPI = axios.create({
  baseURL: "http://localhost:5002"
});


// // Create a custom axios instance for AUTH SERVICE
// export const authAPI = axios.create({

//   // baseURL is the root URL for all API requests in this instance
//   // All requests using authAPI will automatically prefix this URL
//   baseURL: "http://localhost:5001"
// });


// // Create a custom axios instance for STUDY SERVICE
// export const studyAPI = axios.create({

//   // This is a separate backend service running on another port
//   // So we define a different baseURL
//   baseURL: "http://localhost:5002"
// });