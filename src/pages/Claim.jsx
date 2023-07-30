import { useState, useEffect } from "react";
import Nav from "../components/Header";
import { Box, Button, Input, Tag, TagLabel } from "@chakra-ui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { getAccount } from "@wagmi/core";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";
import useReadContract from "../hook/useReadContract";

const whiteListedAddress = [
  { address: "0x33213333332320002ds22123333344rfd3235353", balance: 10000 },
  { address: "0xd057C25E4Ef0f8B5f2809e452A958999EAEbc766", balance: 10000 },
  { address: "0x332133333323200022222123333344rfdd214452", balance: 10020 },
  { address: "0x33d1d333332320002222212sd33344rfd2325461", balance: 10000 },
  { address: "0x332133333323200122222123333344rfddd12333", balance: 10000 },
  { address: "0x332133333323200022222123333344rfdfdt3431", balance: 10000 },
  { address: "0x332133333323200022222123333344rfd22123r2", balance: 120000 },
  { address: "0x3321333333232000222221w2333334rf1223321d", balance: 90000 },
];

function Claim() {
  const [count, setCount] = useState(0);
  const account = getAccount();
  const [stage, setStage] = useState();
  const leafNodes = whiteListedAddress.map((item) => keccak256(item.address));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  const root = merkleTree.getHexRoot();
  const proof = merkleTree.getHexProof(keccak256(account.address));
  const verify = merkleTree.verify(proof, keccak256(account.address), root);
  const claimingAddress = account.address;

  // fetch data from the api

  const data = useReadContract();
  useEffect(() => {
    console.log(data);
  }, [data]);
  // consoles
  console.log("account", account);
  console.log("root", root);
  console.log("proof", proof);
  console.log("verify", verify);
  console.log("claimingAddress", claimingAddress);

  // check if the screen size is less than 768px then set isMobile to true else false
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // add event listener to check if the screen size is less than 768px
  useEffect(() => {
    window.addEventListener(
      "resize",
      () => {
        const ismobile = window.innerWidth < 768;
        if (ismobile !== isMobile) setIsMobile(ismobile);
      },
      false
    );
  }, [isMobile]);

  useEffect(() => {
    console.log(stage);
  }, [stage]);

  return (
    <>
      <Box width="100vw" height="100%">
        <Nav />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            margin: isMobile ? "0rem" : "3rem",
            marginTop: isMobile ? "3rem" : "3rem",
            flexWrap: isMobile ? "wrap" : "nowrap",
          }}
        >
          <Card
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              borderTop: "3px solid #8CD7DD",
              width: isMobile ? "90%" : "100%",
            }}
          >
            <CardHeader>Total Supply</CardHeader>
            <hr />
            <CardBody>0.0</CardBody>
          </Card>
          <Card
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              borderTop: "3px solid #8CD7DD",
              width: isMobile ? "90%" : "100%",
            }}
          >
            <CardHeader>Total Token Claimed</CardHeader>
            <hr />
            <CardBody>0.0</CardBody>
          </Card>
          <Card
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              borderTop: "3px solid #8CD7DD",
              width: isMobile ? "90%" : "100%",
            }}
          >
            <CardHeader>No of Tokens to be Claimed</CardHeader>
            <hr />
            <CardBody>0.0</CardBody>
          </Card>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginTop: "4rem",
          }}
        >
          <Card
            sx={{
              display: "flex",
              justifyContent: "center",
              width: isMobile ? "90%" : "50%",
              borderTop: "3px solid #8CD7DD",
            }}
          >
            <CardHeader
              sx={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <h3>Claiming Stage:</h3>
              </Box>
              <Box>
                <Select
                  placeholder="Select option"
                  sx={{
                    height: "3rem",
                  }}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="option1">Stage 1</option>
                  <option value="option2">Stage 2</option>
                  <option value="option3">Stage 3</option>
                  <option value="option3">Stage 4</option>
                  <option value="option3">Stage 5</option>
                  <option value="option3">Stage 6</option>
                </Select>
              </Box>
            </CardHeader>
            <hr />
            <CardBody
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                alignItems: "start",
                gap: "1rem",
              }}
            >
              <Tag>
                <TagLabel>Your Address</TagLabel>
              </Tag>
              <Input
                disabled
                placeholder={account.address}
                sx={{
                  height: "3rem",
                  width: "100%",
                  borderRadius: "0.5rem",
                  border: "1px solid #8CD7DD",
                }}
              ></Input>

              <Button variant="brandPrimary" width="100%" height="10">
                Claim
              </Button>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </>
  );
}

export default Claim;
