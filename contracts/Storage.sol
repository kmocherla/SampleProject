pragma solidity ^0.4.8;

contract Storage {
  address owner;

  modifier owneronly { if (msg.sender == owner) _; }

  function setOwner(address addr) owneronly {
    owner = addr;
  }

  function Storage() {
    owner = msg.sender;
  }

  // quick lookup index based on ethereum addresses
  mapping (address => bytes32) public addressToPersonId;
  // well, this can be removed if we assume id != 0
  mapping (address => bool) public addressPresent;

  function bindEthereumAddress(address _addr, bytes32 _id) internal {
    addressPresent[_addr] = true;
    addressToPersonId[_addr] = _id;
  }

  function unbindEthereumAddress(address _addr, bytes32 _id) internal {
    delete addressPresent[_addr];
    delete addressToPersonId[_addr];
  }

  function addressToString(address x) returns (string) {
      bytes memory b = new bytes(20);
      for (uint i = 0; i < 20; i++)
          b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
      return string(b);
  }

  function addressToBytes(address x) returns (bytes b) {
      b = new bytes(20);
      for (uint i = 0; i < 20; i++)
          b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
  }

  function stringToBytes32(string memory source) returns (bytes32 result) {
      assembly {
          result := mload(add(source, 32))
      }
  }

  function bytes32ToString(bytes32 x) constant returns (string) {
      bytes memory bytesString = new bytes(32);
      uint charCount = 0;
      for (uint j = 0; j < 32; j++) {
          byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
          if (char != 0) {
              bytesString[charCount] = char;
              charCount++;
          }
      }
      bytes memory bytesStringTrimmed = new bytes(charCount);
      for (j = 0; j < charCount; j++) {
          bytesStringTrimmed[j] = bytesString[j];
      }
      return string(bytesStringTrimmed);
  }

  function register() {
    if (addressPresent[msg.sender]) return;
    bytes32 id = sha3(msg.sender, block.number);
    bindEthereumAddress(msg.sender, id);
  }

  function getPersonId() returns (bytes32) {
    return addressToPersonId[msg.sender];
  }
}
