import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <div>Hello world!</div>,
    },

    {
      path: "/login",
      element: <div>Login page</div>,
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
