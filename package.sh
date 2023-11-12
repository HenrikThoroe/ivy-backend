#!/bin/bash

version () {
    echo $(cat "$1/package.json" | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
}

build () {
    name=$1
    path=$2 
    ver=$(version $2)

    echo "Building $name@$ver at '$path'"
    docker build -t heth03/ivy:$name-latest -t heth03/ivy:$name-$ver -f $path/Dockerfile .
}

push () {
    name=$1
    path=$2 
    ver=$(version $2)

    echo "Pushing $name@$ver at '$path'"
    docker push heth03/ivy:$name-latest
    docker push heth03/ivy:$name-$ver
}

package () {
    build $1 $2
    push $1 $2
}

package 'evc' './apps/engine-version-control'
package 'auth' './apps/authentication'
package 'gm' './apps/game-manager'
package 'replays' './apps/replays'
package 'stats' './apps/stats'
package 'test' './apps/test-driver'
