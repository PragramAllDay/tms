// 1. Import `extendTheme`
import { extendTheme } from "@chakra-ui/react";
import { buttonTheme as Button } from "./Button";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

// 2. Update the breakpoints as key-value pairs
const breakpoints = {
  sm: "320px",
  md: "768px",
  lg: "960px",
  xl: "1200px",
  "2xl": "1536px",
};

// 2. Call `extendTheme` and pass your custom values
const CustomTheme = extendTheme({
  colors: {
    brand: {
      100: "#8CD7DD",
      200: "#E1A0EB",
      300: "#9BB3D5",
    },
  },
  breakpoints,
  config,
  components: {
    Button,
  },
});

export default CustomTheme;
