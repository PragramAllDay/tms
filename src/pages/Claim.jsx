import { useState, useEffect } from "react";
import Nav from "../components/Header";
import { Box, Button, Input, Tag, TagLabel } from "@chakra-ui/react";
import { Card, CardHeader, CardBody, CardFooter } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { getAccount } from "@wagmi/core";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";
import useReadContract from "../hook/useReadContract";
import { whiteListedUsers } from "../config/Array";
import { ethers } from "ethers";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useAccount } from "wagmi";
import { CONFIG } from "../config/config";
import VestingAbi from "../config/Vesting.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parseEther, formatUnits } from "viem";
import { Spinner } from "@chakra-ui/react";

function Claim() {
  const [count, setCount] = useState(0);
  const { address, isConnected, status } = getAccount();

  const [stage, setStage] = useState();
  const [reloadDta, setReloadDta] = useState(false);

  //encode the data
  function encodeItem(item) {
    return ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256"],
      [item.address.toLowerCase(), parseInt(item.balance)]
    );
  }
  // create leaf nodes
  const leafNodes = whiteListedUsers.map((item) => encodeItem(item));
  //  create merkle tree
  const merkleTree = new MerkleTree(leafNodes, keccak256, {
    hashLeaves: true,
    sortPairs: true,
  });
  // get the root
  const root = merkleTree.getHexRoot();
  // get the index of the account
  const index = whiteListedUsers.findIndex((object) => {
    return object.address === address;
  });

  // get the proof
  let proof;
  proof = merkleTree.getHexProof(keccak256(leafNodes[index]));
  // verify the proof
  const verify = merkleTree.verify(proof, keccak256(leafNodes[index]), root);

  // fetch data
  const dataC = useReadContract();

  // console.log("claimingAddress", claimingAddress);

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
  // get the balance of the user
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    setBalance(0);
    let ad = whiteListedUsers.map((item) => item.address).includes(address);
    console.log(ad);
    if (address && ad) {
      setBalance(
        whiteListedUsers.find((item) => item.address === address).balance
      );
    }
    console.log(balance);
  }, [address, isConnected]);

  // get if verified from the contract =========================
  const { data: ifVerified } = useContractRead({
    address: CONFIG.VESTING_CONTRACT,
    abi: VestingAbi,
    functionName: "verifyInWhitelist",
    args: [proof, address, parseInt(balance)],
    onError(err) {
      console.log(err);
    },
  });
  console.log(address && ifVerified);

  // ===========================================================

  // get vesting logs from the contract =========================
  const { data: vestingLogs, refetch } = useContractRead({
    address: CONFIG.VESTING_CONTRACT,
    abi: VestingAbi,
    functionName: "vestingLogs",
    args: [address],
  });
  console.log(vestingLogs);

  // can claim
  const { data: canClaim, refetch: refetchClaim } = useContractRead({
    address: CONFIG.VESTING_CONTRACT,
    abi: VestingAbi,
    functionName: "canClaim",
    args: [address],
  });
  console.log("can Claim", canClaim);

  // ===========================================================
  // write to contract ==========================================
  // ===== prepare config for the contract write =======
  const finalBalance = parseInt(balance).toString();
  console.log("finalBalance", finalBalance);
  const grandFinal = parseEther(finalBalance);
  console.log("grandFinal", grandFinal);
  console.log("balance", balance);

  // claim function
  const { data, write } = useContractWrite({
    enabled: false,
    address: CONFIG.VESTING_CONTRACT,
    abi: VestingAbi,
    functionName: "getClaim",
    args: [address, proof, parseInt(balance)],
    onError(err) {
      toast.error(err.message);
    },
  });
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess(data) {
      toast.success("Transaction successful");
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  // ==================================================

  // const { data: returnData, write: claim } = useContractWrite({
  //   ...config,
  //   onError(err) {
  //     toast.error(err.message);
  //   },
  // });
  // const { isLoading, isSuccess } = useWaitForTransaction({
  //   hash: data?.hash,
  //   onSuccess(data) {
  //     toast.success("Transaction successful");
  //   },
  //   onError(error) {
  //     toast.error(error.message);
  //   },
  // });
  // ============================================================
  // handle the claim ================================================
  const handleClaim = () => {
    if (address === undefined || address === null) {
      toast.error("Please connect your wallet");
    } else if (verify) {
      if (stage === undefined) {
        toast.error("Please select a stage");
      } else {
        if (vestingLogs[0] === true) {
          if (canClaim) {
            write();
          } else {
            toast.error("You can't claim for one week after your latest claim");
          }
        } else {
          write();
        }
      }
    } else {
      toast.error("You are not in the whitelist");
    }
  };
  // =================================================================

  // if (address === undefined || address === null) {
  //   toast.error("Please connect your wallet");
  // } else {
  //   if (!verify) {
  //     toast.error("You are not in the whitelist");
  //   } else {
  //     if (stage === undefined) {
  //       toast.error("Please select a stage");
  //     } else {
  //       if (!canClaim) {
  //         toast.error("You can't claim for one week after your latest claim");
  //       } else {
  //         write();
  //       }
  //     }
  //   }
  // }

  console.log("isSuccess", isSuccess);
  console.log("address", address);
  console.log("root", root);
  useEffect(() => {
    if (isSuccess) {
      refetch();
    }
  }, [isSuccess]);
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        setReloadDta(!reloadDta);
      });
      window.ethereum.on("connect", () => {
        setReloadDta(!reloadDta);
      });
    }
  });

  useEffect(() => {
    if (address) {
      refetch();
    }
  }, [reloadDta, isConnected]);
  const account = useAccount({
    onConnect({ address, connector, isReconnected }) {
      console.log("Connected", { address, connector, isReconnected });
      refetch();
    },
  });

  return (
    <>
      <ToastContainer />
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
            <CardBody>
              {dataC?.data !== undefined
                ? formatUnits(dataC?.data?.[0].result, 18)
                : 0}
            </CardBody>
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
            <CardBody>
              {isConnected ? (
                vestingLogs && vestingLogs[0] !== true ? (
                  0.0
                ) : (
                  <>
                    {vestingLogs !== undefined
                      ? vestingLogs &&
                        vestingLogs[0] === true &&
                        formatUnits(vestingLogs[3], 18).includes(".")
                        ? formatUnits(vestingLogs[3], 18).split(".")[0] +
                          "." +
                          formatUnits(vestingLogs[3], 18)
                            .split(".")[1]
                            .slice(0, 2)
                        : formatUnits(vestingLogs[3], 18)
                      : 0}
                  </>
                )
              ) : (
                0.0
              )}
            </CardBody>
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
            <CardBody>
              {isConnected ? (
                vestingLogs && vestingLogs[0] !== true ? (
                  <>{balance && parseInt(balance)}</>
                ) : (
                  <>
                    {vestingLogs !== undefined
                      ? vestingLogs &&
                        vestingLogs[0] === true &&
                        formatUnits(vestingLogs[2], 18).includes(".")
                        ? formatUnits(vestingLogs[2], 18).split(".")[0] +
                          "." +
                          formatUnits(vestingLogs[2], 18)
                            .split(".")[1]
                            .slice(0, 2)
                        : formatUnits(vestingLogs[2], 18)
                      : 0}
                  </>
                )
              ) : (
                0.0
              )}
            </CardBody>
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
                  <option value="1">Stage 1</option>
                  <option value="2">Stage 2</option>
                  <option value="3">Stage 3</option>
                  <option value="4">Stage 4</option>
                  <option value="5">Stage 5</option>
                  <option value="6">Stage 6</option>
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
                placeholder={isConnected ? address : null}
                sx={{
                  height: "3rem",
                  width: "100%",
                  borderRadius: "0.5rem",
                  border: "1px solid #8CD7DD",
                }}
              ></Input>

              <Button
                variant="brandPrimary"
                width="100%"
                height="10"
                onClick={handleClaim}
              >
                {isLoading ? <Spinner /> : "Claim"}
              </Button>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </>
  );
}

export default Claim;
