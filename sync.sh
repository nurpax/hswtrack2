#!/bin/bash
set -e

# synchronize build results to a remote server for deployment

# see https://unix.stackexchange.com/a/50515 for the ssh -Nf trick

DST=web/hswtrack2
tunnel_opts="-o ControlPath=$HOME/.ssh/ctl/%L-%r@%h:%p"
echo tunnel
ssh -o ControlMaster=yes $tunnel_opts -Nf $REMOTE
opts="ssh -o 'ControlPath=$HOME/.ssh/ctl/%L-%r@%h:%p'"
rsync -e "$opts" -avz `stack path --local-install-root`/bin $REMOTE:$DST
rsync -e "$opts" -Ravz ./snaplets $REMOTE:$DST
rsync -e "$opts" -Ravz ./static/build $REMOTE:$DST
ssh $tunnel_opts -O exit $REMOTE
