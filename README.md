## Project Requirements

- node (v6.9.1)

- npm (v4.6.1)

- truffle (v3.2.0)

- testrpc (v3.0.0)

- ethereum-bridge (v0.5.3)

## How To

### Install Dependencies
```
npm install -g truffle@3.2.0
```

```
npm install -g ethereumjs-testrpc
```

```
cd ~; git clone https://github.com/oraclize/ethereum-bridge
cd ~/ethereum-bridge
npm install
```

```
cd ~; git clone https://github.com/kmocherla/SampleProject
cd ~/SampleProject
npm install
```

### Start TestRPC Server
```
testrpc -u 0 -u 1 -u 2 -u 3
```

### Start Ethereum Bridge for Oraclize API
Open another terminal and execute the below
```
cd ~/ethereum-bridge
node bridge -H localhost:8545 -a 1
```

### Build Project and Start Decentralized App (DApp)
Open another terminal and execute the below
```
cd ~/SampleProject
truffle compile
truffle migrate
npm run build
truffle serve
```
View DApp at http://localhost:8080
