import "./App.css";
import Nav from "./components/Header";
import { Box, Button, Input, Tag, TagLabel } from "@chakra-ui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import Claim from "./pages/Claim";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Claim />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
