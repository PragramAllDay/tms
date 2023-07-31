// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Vesting is Ownable, ReentrancyGuard {
    bytes32 private root;
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using SafeMath for uint;
    address public tokenAddress;
    address public Vowner;

    uint256 public totalClaimed;
    // uint public startDate;

    bool private _hasBegun = false;

    struct VestingSchedule {
        bool initialized; // false initially
        address beneficiary;
        uint256 totalAmount; //total amount of tokens to be released at the end of the vesting
        uint256 released; // amount of tokens released, 0 initially,
        uint256 lockedAmount;
        uint remaingSets;
        uint lastRevoked; //Unix epoch format
        uint multipleRemainingSet;
        uint setsLeft;
    }
    struct claimed {
        bool exists;
    }
    mapping(address => claimed) public hasClaimed;
    mapping(address => VestingSchedule) public vestingLogs;
    event ScheduleCreated(address benficiary, uint256 amount);
    event TokenClaimed(
        address benficiary,
        uint256 amount,
        uint256 remainingAmount
    );

    // =============================================================
    //                            Constructor
    // =============================================================
    constructor(address _tokenAddress) {
        require(_tokenAddress != address(0x0));
        Vowner = msg.sender;
        tokenAddress = _tokenAddress;
    }

    // =============================================================
    //                           Create Vesting Schedule
    // =============================================================
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount
    ) internal {
        VestingSchedule memory schedule = VestingSchedule(
            false, // false initially
            _beneficiary,
            _amount,
            0,
            _amount,
            6,
            0,
            0,
            0
        );
        vestingLogs[_beneficiary] = schedule;
        hasClaimed[_beneficiary].exists = false;
        emit ScheduleCreated(_beneficiary, _amount);
    }

    // =============================================================
    //                           Get Claim
    // =============================================================

    function getClaim(
        address _beneficiary,
        bytes32[] calldata _merkleProof,
        uint256 _amount
    ) external nonReentrant {
        require(_hasBegun, "Claiming has not begun");
        require(!hasClaimed[_beneficiary].exists, "Already claimed");
        VestingSchedule memory schedule;
        if (vestingLogs[_beneficiary].beneficiary == _beneficiary) {
            schedule = vestingLogs[_beneficiary];
        } else {
            uint256 parsedAmount = _amount * 10 ** 18;
            createVestingSchedule(_beneficiary, parsedAmount);
            schedule = vestingLogs[_beneficiary];
        }
        require(
            verifyInWhitelist(_merkleProof, _beneficiary, _amount),
            "Unverified proof"
        );
        require(schedule.totalAmount > 0, "Amount must be greater than 0");
        if (schedule.multipleRemainingSet > 0) {
            schedule.multipleRemainingSet = schedule.multipleRemainingSet - 1;
        } else if (schedule.lastRevoked > 0) {
            // check if last revoked and current time is more than a week ago
            require(
                block.timestamp >= schedule.lastRevoked + 604800,
                "One week hasn't passed by"
            );
            uint weeksPassed = weeksSince(schedule.lastRevoked);
            if (weeksPassed > 1) {
                schedule.multipleRemainingSet = weeksPassed - 1;
            }
        } else {
            schedule.initialized = true;
        }
        updateSchedule(_beneficiary, schedule);
    }

    // =============================================================
    //                         Update Schedule
    // =============================================================
    function updateSchedule(
        address _beneficiary,
        VestingSchedule memory schedule
    ) internal {
        uint remSets = schedule.remaingSets;
        uint256 totalAmt = schedule.totalAmount;
        uint256 amount_to_release = totalAmt / remSets;
        schedule.remaingSets = remSets - 1;
        schedule.released = schedule.released + amount_to_release;
        schedule.totalAmount = schedule.totalAmount - amount_to_release;
        schedule.lastRevoked = block.timestamp;
        vestingLogs[_beneficiary] = schedule;
        if (schedule.totalAmount <= 1) {
            hasClaimed[_beneficiary].exists = true;
        }
        claim(amount_to_release, _beneficiary);
        emit TokenClaimed(
            _beneficiary,
            amount_to_release,
            schedule.totalAmount
        );
    }

    // =============================================================
    //                          Claim Functions
    // =============================================================
    function claim(uint256 amount, address beneficiary) internal {
        require(
            IERC20(tokenAddress).balanceOf(Vowner) > amount,
            "No token to release by owner"
        );
        IERC20(tokenAddress).safeTransferFrom(Vowner, beneficiary, amount);
        totalClaimed = totalClaimed + amount;
    }

    // =============================================================
    //                            Helper Functions
    // =============================================================
    function weeksSince(uint256 timestamp) internal view returns (uint256) {
        uint256 currentTimestamp = block.timestamp; // Get the current block timestamp
        uint256 secondsPassed = currentTimestamp - timestamp;
        uint256 remainingWeeks = secondsPassed / 604800;
        return remainingWeeks;
    }

    // =============================================================
    //                           Setters
    // =============================================================
    function setBegin() external onlyOwner {
        _hasBegun = true;
    }

    function verifyInWhitelist(
        bytes32[] calldata _merkleProof,
        address _address,
        uint256 amount
    ) internal view returns (bool result) {
        bytes32 leaf = keccak256(abi.encode(_address, amount));
        result = MerkleProof.verify(_merkleProof, root, leaf);
    }

    function getRoot() public view returns (bytes32) {
        return root;
    }

    function setRoot(bytes32 _root) public returns (bytes32) {
        return root = _root;
    }

    // =============================================================
    //                          Getters
    // =============================================================
    function canClaim(address _beneficiary) public view returns (bool) {
        if (vestingLogs[_beneficiary].beneficiary == _beneficiary) {
            VestingSchedule memory schedule = vestingLogs[_beneficiary];
            return (
                block.timestamp >= schedule.lastRevoked + 604800 ? true : false
            );
        } else {
            return false;
        }
    }

    fallback() external {}
}
