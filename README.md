# 📘 CLOUD_IDE Documentation

## Overview

**CLOUD_IDE** is a cloud-based Integrated Development Environment (IDE) designed to run within a Kubernetes cluster. It leverages NGINX for load balancing and utilizes Prometheus and Grafana for monitoring and observability.

This project allows developers to create, compile, and run code in the cloud with scalable infrastructure.

---

## 🧰 Technologies Used

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js  
- **Containerization**: Docker  
- **Orchestration**: Kubernetes  
- **Load Balancer**: NGINX  
- **Monitoring**: Prometheus + Grafana  

---

## 🚀 Deployment Guide

### Prerequisites

Make sure you have the following installed and configured:

- Docker  
- Kubernetes cluster with `kubectl` access  
- Helm (for installing Prometheus and Grafana)  
- A container registry (e.g., Docker Hub)  

### Step 1: Clone the Repository

```bash
git clone https://github.com/1MalharPatel1/CLOUD_IDE.git
cd CLOUD_IDE
```

### Step 2: Build Docker Images

```bash
# Build frontend
cd client
docker build -t cloud_ide_client .

# Build backend
cd ../server
docker build -t cloud_ide_server .

# Build NGINX reverse proxy
cd ../nginx
docker build -t cloud_ide_nginx .
```

### Step 3: Push Images to Container Registry

```bash
docker tag cloud_ide_client your_registry/cloud_ide_client
docker push your_registry/cloud_ide_client

docker tag cloud_ide_server your_registry/cloud_ide_server
docker push your_registry/cloud_ide_server

docker tag cloud_ide_nginx your_registry/cloud_ide_nginx
docker push your_registry/cloud_ide_nginx
```

### Step 4: Deploy to Kubernetes

Create Kubernetes YAML files (if not already present) and apply them using `kubectl`:

```bash
kubectl apply -f k8s/client-deployment.yaml
kubectl apply -f k8s/server-deployment.yaml
kubectl apply -f k8s/nginx-deployment.yaml
```

### Step 5: Set Up Monitoring (Prometheus & Grafana)

Use Helm to install Prometheus and Grafana:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/prometheus
helm install grafana grafana/grafana
```

Access Grafana using the generated service URL and login with default credentials (`admin` / `prometheus`).

---

## 📊 Monitoring

Prometheus will scrape metrics from your deployed services. You need to expose `/metrics` endpoints in your backend if you want custom metrics.

Grafana can be configured to create dashboards for:

- CPU & Memory Usage
- HTTP request rates
- Error rates
- Container health