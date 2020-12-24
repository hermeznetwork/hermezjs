# HermezJS
Instructions to run HermezJS in the sandbox

1. Download and run sandbox. Follow [instructions](https://github.com/hermeznetwork/integration-testing/tree/feature/docker-config)

``` 
git clone https://github.com/hermeznetwork/integration-testing.git
cd integration-testing
make build
make start
```
2. Open new terminal and display sandbox logs
```
make log
```

3. Open new terminal and download coordinator repo
```
git clone https://github.com/hermeznetwork/sandbox-coordinator.git

```

4. Copy json below to file `config-coordinator.json` in `coordinator` repo root folder
```
{
    "mnemonic": "explain tackle mirror kit van hammer degree position ginger unfair soup bonus",
    "bootCoordinatorIndex": 4,
    "hermezAddress": "0x10465b16615ae36F350268eb951d7B0187141D3B",
    "ethNodeUrl": "http://localhost:8545",
    "port": 4242,
    "timeForges": 15,
    "SQL": {
        "user": "hermez",
        "host": "localhost",
        "password": "yourpasswordhere",
        "port": 5432,
        "database":"hermez"
    }
}
```

5. Correct  `buidler.config.js` so that circuits paths point to the correct contract folder.

```
 module.exports = {
     paths: {
        sources: "<ADD PATH>",
        tests: "<ADD PATH>",
        cache: "<ADD PATH>",
        artifacts: "<ADD PATH>"
     },
     defaultNetwork: "localhostMnemonic",
     networks: {
```

6. Start coordinator
```
node ./src/server/coordinator.js --pc config-coordinator.json
```

7. Open new terminal, download HermezJs repo and switch to sandbox branch
```
git clone https://github.com/hermeznetwork/hermezjs.git
cd hermezjs
git checkout feature/sandbox
``` 

**NOTE** To run all tests, type:
```
npm run test
```
