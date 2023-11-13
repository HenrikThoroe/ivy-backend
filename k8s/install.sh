#!/bin/bash

# Apply configs 
kubectl apply -f ./configs

# Apply secrets
kubectl apply -f ./secrets

# Apply volumes 
kubectl apply -f ./volumes

# Apply DB services
kubectl apply -f ./db/redis
kubectl apply -f ./db/minio
kubectl apply -f ./db/redis-insight

# Apply app services
kubectl apply -f ./apps/evc
kubectl apply -f ./apps/auth
kubectl apply -f ./apps/replays
kubectl apply -f ./apps/stats
kubectl apply -f ./apps/gm
kubectl apply -f ./apps/test-driver

# Apply ingress
kubectl apply -f ./ingress
