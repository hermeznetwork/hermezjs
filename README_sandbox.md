# HermezJS
Instructions to run HermezJS in the sandbox

1. Download and run sandbox. Follow [instructions](https://github.com/hermeznetwork/integration-testing/tree/feature/docker-config)

``` 
git clone https://github.com/hermeznetwork/integration-testing.git
cd integration-testing
git checkout feature/doker-config
make build
make start
```
2. Open new terminal and display sanbox logs
```
make log
```

3. Open new terminal and donwload coordinator repo
```
git clone https://github.com/hermeznetwork/sandbox-coordinator.git

```

3. Copy json below to file `config-coordinator.json` in `coordinator` repo root folder
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

4. Start coordinator
```
node ./src/server/coordinator.js --pc config-coordinator.json
```

5. Open new terminal, download HermezJs repo and switch to sandbox branch
```
git clone https://github.com/hermeznetwork/hermezjs.git
cd hermezjs
git checkout feature/sandbox
```

6. In HermezJs root folder, run hermez-example.mjs test
```
npm test hermez-sandbox.test.mjs
```
