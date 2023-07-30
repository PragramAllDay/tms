import React, { useState, useEffect } from "react";
import { CONFIG } from "../config/config";
import VestingAbi from "../config/Vesting.json";
import TestTokenAbi from "../config/TestTokenAbi.json";
import { useContractRead } from "wagmi";
import { getAccount } from "@wagmi/core";

const useReadContract = () => {
  const account = getAccount();
  const data = useContractRead({
    contracts: [
      {
        address: CONFIG.TEST_TOKEN,
        abi: TestTokenAbi,
        functionName: "totalSupply",
      },
      {
        address: CONFIG.VESTING_CONTRACT,
        abi: VestingAbi,
        functionName: "vestingLogs",
        args: [account.address],
      },
    ],
    onSuccess(data) {
      console.log("data", data);
    },
  });
  return data;
};

export default useReadContract;
