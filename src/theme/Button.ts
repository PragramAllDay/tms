import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const brandPrimary = defineStyle({
  background: "brand.100",
  color: "#fff",
  fontFamily: "body",
  fontWeight: "bold",
  fontSize: "md",
  _hover: {
    background: "brand.300",
  },
});

export const buttonTheme = defineStyleConfig({
  variants: { brandPrimary },
});
