import React, { useState, useEffect } from "react";
import { CONFIG } from "../config/config";
import VestingAbi from "../config/Vesting.json";
import TestTokenAbi from "../config/TestTokenAbi.json";
import { useContractReads } from "wagmi";
import { getAccount } from "@wagmi/core";

const vestingContract = {
  address: CONFIG.VESTING_CONTRACT,
  abi: VestingAbi,
};

const useFetchData = (address) => {
  const account = getAccount();
  const data = useContractReads({
    contracts: [
      {
        ...vestingContract,
        functionName: "vestingLogs",
        args: [address],
      },
      //   {
      //     ...vestingContract,
      //     functionName: "verifyInWhitelist",
      //     args: [proof, address, amount],
      //   },
    ],
    onSuccess(data) {
      console.log("data", data);
    },
    onError(error) {
      console.log("error", error);
    },
  });
  return data;
};

export default useFetchData;
