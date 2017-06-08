pragma solidity ^0.4.2;
import "./usingOraclize.sol";

contract OraclizeTest is usingOraclize {
    
    string public oraclizeResult;

    function OraclizeTest() payable {
        update();
    }

    function __callback(bytes32 myid, string result) {
        if (msg.sender != oraclize_cbAddress()) throw;
        oraclizeResult = result;
    }
    
    function update() payable {
        oraclize_query("URL", "xml(https://www.fueleconomy.gov/ws/rest/fuelprices).fuelPrices.diesel");
    }
}