#!/bin/bash 

deployContracts(){

    tmux has-session -t ${tmuxSessionName} 2>/dev/null
    if [ $? == 0 ]; then
       logInfo "tmux session already exists"
       tmux kill-session
       #exit
    fi

    # Check if buidler node is running. If it is, kill it
    node=$(netstat -tulpn 2>/dev/null | grep LISTEN | grep ${nodePort} | awk '{print $7}')
    if [ ! -z "${node}" ]; then
       nodePid=${node%/*}
       kill -9 ${nodePid}
    fi

    # launch test node
    logInfo "Starting new tmux session"
    tmux new-session -d -s contracts
    tmux send-keys -t contracts "npx buidler --config buidler.config.cjs node" Enter

    # check if contracts exist
    if [ ! -d "${contractsFolder}" ]; then
      logDebug "Downloading contracts ${contractsFolder}"
      downloadRepo  https://github.com/hermeznetwork/contracts.git contracts ${contractsFolder}
    fi
    # deploy contracts
    mkdir -p auxdata
    logDebug "Deploying contracts"
    npm run deploy
}


logInfo() {
  echo "[INFO]: $1"
}

logDebug() {
  echo "[DEBUG]: $1"
}

downloadRepo() {
  repo=$1
  src=$2
  dst=$3
  if [ -z "${repo}" ] || [ -z "${dst}" ] || [ -z "${src}" ]; then
     logInfo "Invalid parameters in downloadRepo call (${repo}, ${src}, ${dst}"
     exit
  fi
  retries=3
  cdir=$PWD
  cd /tmp
  fname=$(basename ${repo})
  folder=${fname%.*} 
  rm -rf ${folder}
  while true; do
     status=$(git clone \
        ${repo} 2>&1 | grep "Invalid")
     if [ -z "$status" ];then
           break
     elif [ $retries -eq 3 ]; then
         logInfo "Too many retries downloading ${repo} repo."
         exit
     fi
     retries=$(($retries + 1))
  done
  cd $cdir
  mkdir -p ${dst}
  cp -r /tmp/${folder}/${src}/* ${dst}
}


tmuxSessionName="contracts"
contractsFolder="./contracts"
nodePort=8545

deployContracts


