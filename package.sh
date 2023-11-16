#!/bin/bash

exists () {
    local code=$(curl -s -o /dev/null -w "%{http_code}" "https://hub.docker.com/v2/repositories/heth03/ivy/tags/$1")
    
    if [ $code -eq 200 ]; then
        return 0
    else
        return 1
    fi
}

version () {
    echo $(cat "$1/package.json" | grep '"version"' | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
}

build () {
    name=$1
    path=$2 
    ver=$(version $2)

    echo "Building $name@$ver at '$path'"
    docker build --platform linux/arm64 -t heth03/ivy:$name-latest -t heth03/ivy:$name-$ver -f $path/Dockerfile .
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
    local ver=$(version $2)
    local tag=$1-$ver

    if exists $tag; then
        echo "Tag $tag already exists"
        return 0
    fi

    echo "Packaging $1@$ver at '$2'"

    build $1 $2
    push $1 $2
}

package 'evc' './apps/engine-version-control'
package 'auth' './apps/authentication'
package 'gm' './apps/game-manager'
package 'replays' './apps/replays'
package 'stats' './apps/stats'
package 'test' './apps/test-driver'
