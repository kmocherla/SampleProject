pragma solidity ^0.4.8;

import "./Storage.sol";
import "./usingOraclize.sol";

contract Twitter is usingOraclize {

  string public tweet;
  string public score;
  uint24 public accountScore;

  bytes32 _id;
  string _userId;
  bool _verify;

  address owner;

  modifier owneronly { if (msg.sender == owner) _; }

  function setOwner(address addr) owneronly {
    owner = addr;
  }

  function Twitter() {
    owner = msg.sender;
  }

  mapping (bytes32 => bytes32) expectedId;

  mapping (bytes32 => bool) isVerification;

  function __callback(bytes32 myid, string result, bytes proof) {
    if (msg.sender != oraclize_cbAddress()) throw;

    if(_verify) {
      tweet = result;
    }
    else {
      score = result;
    }
  }

  function getScore(bytes32 id, string userId) payable {
    bytes memory _userId = bytes(userId);
    string memory head = "html(https://twitter.com/";
    bytes memory _head = bytes(head);
    string memory tail = ").xpath(//*[contains(@data-nav, 'followers')]/*[contains(@class, 'ProfileNav-value')]/@data-count)";
    bytes memory _tail = bytes(tail);
    string memory query = new string(_head.length + _userId.length + _tail.length);
    bytes memory _query = bytes(query);
    uint i = 0;
    for (uint j = 0; j < _head.length; j++)
      _query[i++] = _head[j];
    for (j = 0; j < _userId.length; j++)
      _query[i++] = _userId[j];
    for (j = 0; j < _tail.length; j++)
      _query[i++] = _tail[j];

    _verify = false;
    oraclize_query("URL", query);
  }

  function verifyUrl(string userId, string proofLocation) internal returns (bool) {
    bytes memory _userId = bytes(userId);
    string memory twitterPrefix = "://twitter.com/";
    bytes memory _twitterPrefix = bytes(twitterPrefix);
    string memory urlHead = new string(_twitterPrefix.length + _userId.length + 1);
    bytes memory _urlHead = bytes(urlHead);
    uint i = 0;
    for (uint j = 0; j < _twitterPrefix.length; j++)
      _urlHead[i++] = _twitterPrefix[j];
    for (j = 0; j < _userId.length; j++)
      _urlHead[i++] = _userId[j];
    _urlHead[i++] = byte("/");

    if (indexOf(proofLocation, string(_urlHead)) == -1)
      return false;

    return true;
  }

  function verify(bytes32 id, string userId, string proofLocation) payable {

    if (!verifyUrl(userId, proofLocation)) throw;

    string memory head = "html(";
    bytes memory _head = bytes(head);
    string memory tail = ").xpath(//*[contains(@class, 'tweet-text')]/text())";
    bytes memory _tail = bytes(tail);

    bytes memory _tweetUrl = bytes(proofLocation);

    string memory query = new string(_head.length + _tail.length + _tweetUrl.length + 2);
    bytes memory _query = bytes(query);
    uint i = 0;
    for (uint j = 0; j < _head.length; j++)
      _query[i++] = _head[j];
    for (j = 0; j < _tweetUrl.length; j++)
      _query[i++] = _tweetUrl[j];
    for (j = 0; j < _tail.length; j++)
      _query[i++] = _tail[j];
    _query[i++] = 0;

    _verify = true;
    _id = id;
    _userId = userId;
    oraclize_query("URL", query);
  }
}
