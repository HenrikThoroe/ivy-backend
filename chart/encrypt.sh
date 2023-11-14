#!/bin/bash

gpg --output ./secrets-prod.yaml.sec --symmetric --cipher-algo AES256 ./secrets-prod.yaml 
gpg --output ./kubecfg.sec --symmetric --cipher-algo AES256 ./kubecfg
