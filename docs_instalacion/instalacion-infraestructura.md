# 🏗️ GUÍA DE INSTALACIÓN DE INFRAESTRUCTURA
## Crezcamos CI/CD - Setup Completo de GCP y Kubernetes

**Versión:** 1.0.0  
**Fecha:** 29 de marzo de 2026  
**Tiempo estimado:** 4-6 horas

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Preparación de GCP](#preparación-de-gcp)
3. [Creación de Clusters GKE](#creación-de-clusters-gke)
4. [Configuración de Service Accounts](#configuración-de-service-accounts)
5. [Setup de GitLab Runner](#setup-de-gitlab-runner)
6. [Configuración de Namespaces](#configuración-de-namespaces)
7. [Configuración de RBAC](#configuración-de-rbac)
8. [Validación de Instalación](#validación-de-instalación)

---

## ✅ Requisitos Previos

### Software Requerido
```bash
# Instalar Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Instalar kubectl
gcloud components install kubectl

# Instalar Helm (opcional pero recomendado)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verificar instalaciones
gcloud --version
kubectl version --client
helm version
```

### Cuenta GCP
- ✅ Cuenta de GCP con billing habilitado
- ✅ Project ID: `crezcamos-prod` (o similar)
- ✅ Rol: Editor o superior

### Máquina GitLab Runner
- ✅ Mínimo 2 CPUs, 4GB RAM
- ✅ Docker instalado
- ✅ Acceso a internet sin restricciones
- ✅ Port 443 habilitado para GitLab

---

## 🔧 Preparación de GCP

### Paso 1: Configurar Google Cloud SDK

```bash
# Inicializar gcloud y autenticarse
gcloud init --skip-diagnostics

# Seleccionar proyecto
gcloud config set project crezcamos-prod

# Configurar región por defecto
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-a

# Verificar configuración
gcloud config list
```

### Paso 2: Habilitar APIs Necesarias

```bash
# Habilitar Kubernetes Engine API
gcloud services enable container.googleapis.com

# Habilitar Cloud Logging API
gcloud services enable logging.googleapis.com

# Habilitar Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Habilitar Container Registry API
gcloud services enable containerregistry.googleapis.com

# Habilitar Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# Habilitar Compute Engine API
gcloud services enable compute.googleapis.com

# Verificar APIs habilitadas
gcloud services list --enabled
```

### Paso 3: Crear VPC (Virtual Private Cloud)

```bash
# Crear VPC
gcloud compute networks create crezcamos-vpc \
  --subnet-mode=custom \
  --bgp-routing-mode=regional

# Crear subnets por región
gcloud compute networks subnets create crezcamos-dev \
  --network=crezcamos-vpc \
  --region=us-central1 \
  --range=10.10.0.0/20 \
  --enable-flow-logs

gcloud compute networks subnets create crezcamos-staging \
  --network=crezcamos-vpc \
  --region=us-central1 \
  --range=10.20.0.0/20 \
  --enable-flow-logs

gcloud compute networks subnets create crezcamos-prod \
  --network=crezcamos-vpc \
  --region=us-central1 \
  --range=10.30.0.0/20 \
  --enable-flow-logs

# Listar subnets
gcloud compute networks subnets list --network=crezcamos-vpc
```

### Paso 4: Crear Firewall Rules

```bash
# Permitir tráfico interno entre subnets
gcloud compute firewall-rules create allow-internal-crezcamos \
  --network=crezcamos-vpc \
  --allow=tcp,udp,icmp \
  --source-ranges=10.10.0.0/20,10.20.0.0/20,10.30.0.0/20

# Permitir tráfico de salida
gcloud compute firewall-rules create allow-external-crezcamos \
  --network=crezcamos-vpc \
  --allow=tcp:443,tcp:80 \
  --source-ranges=0.0.0.0/0

# Listar reglas
gcloud compute firewall-rules list --filter="network:crezcamos-vpc"
```

---

## 🎯 Creación de Clusters GKE

### Cluster DEV

```bash
# Crear cluster DEV
gcloud container clusters create crezcamos-dev-cluster \
  --region=us-central1 \
  --node-locations=us-central1-a \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --disk-size=50 \
  --disk-type=pd-standard \
  --network=crezcamos-vpc \
  --subnetwork=crezcamos-dev \
  --enable-ip-alias \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=4 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-vertical-pod-autoscaling \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM,WORKLOAD \
  --addons=HttpLoadBalancing,HorizontalPodAutoscaling \
  --workload-pool=crezcamos-prod.svc.id.goog \
  --enable-stackdriver-kubernetes \
  --labels=environment=dev,project=crezcamos

# Obtener credenciales
gcloud container clusters get-credentials crezcamos-dev-cluster --region=us-central1

# Verificar cluster
kubectl cluster-info
kubectl get nodes
```

### Cluster STAGING

```bash
# Crear cluster STAGING
gcloud container clusters create crezcamos-staging-cluster \
  --region=us-central1 \
  --node-locations=us-central1-a \
  --num-nodes=2 \
  --machine-type=e2-standard-2 \
  --disk-size=50 \
  --disk-type=pd-standard \
  --network=crezcamos-vpc \
  --subnetwork=crezcamos-staging \
  --enable-ip-alias \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=6 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-vertical-pod-autoscaling \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM,WORKLOAD \
  --addons=HttpLoadBalancing,HorizontalPodAutoscaling \
  --workload-pool=crezcamos-prod.svc.id.goog \
  --enable-stackdriver-kubernetes \
  --labels=environment=staging,project=crezcamos

# Obtener credenciales
gcloud container clusters get-credentials crezcamos-staging-cluster --region=us-central1

# Verificar cluster
kubectl cluster-info --context=gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl get nodes
```

### Cluster PROD (Multi-zona)

```bash
# Crear cluster PROD con múltiples zonas
gcloud container clusters create crezcamos-prod-cluster \
  --region=us-central1 \
  --node-locations=us-central1-a,us-central1-b,us-central1-c \
  --num-nodes=2 \
  --machine-type=e2-standard-4 \
  --disk-size=100 \
  --disk-type=pd-ssd \
  --network=crezcamos-vpc \
  --subnetwork=crezcamos-prod \
  --enable-ip-alias \
  --enable-autoscaling \
  --min-nodes=3 \
  --max-nodes=10 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-vertical-pod-autoscaling \
  --enable-cloud-logging \
  --enable-cloud-monitoring \
  --logging=SYSTEM,WORKLOAD,API_SERVER \
  --monitoring=SYSTEM,WORKLOAD \
  --addons=HttpLoadBalancing,HorizontalPodAutoscaling \
  --workload-pool=crezcamos-prod.svc.id.goog \
  --enable-stackdriver-kubernetes \
  --enable-network-policy \
  --labels=environment=prod,project=crezcamos \
  --enable-shielded-nodes

# Obtener credenciales
gcloud container clusters get-credentials crezcamos-prod-cluster --region=us-central1

# Verificar cluster multi-zona
kubectl cluster-info --context=gke_crezcamos-prod_us-central1_crezcamos-prod-cluster
kubectl get nodes
```

### Verificar Todos los Clusters

```bash
# Listar contextos disponibles
kubectl config get-contexts

# Listar clusters en GCP
gcloud container clusters list --region=us-central1
```

---

## 👤 Configuración de Service Accounts

### Crear Google Service Account

```bash
# Crear service account
gcloud iam service-accounts create crezcamos-gitlab \
  --display-name="Crezcamos GitLab CI/CD Service Account"

# Obtener email del SA
export SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:crezcamos-gitlab" --format='value(email)')
echo $SA_EMAIL

# Asignar roles necesarios
gcloud projects add-iam-policy-binding crezcamos-prod \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/container.developer

gcloud projects add-iam-policy-binding crezcamos-prod \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/containerregistry.servicegent

gcloud projects add-iam-policy-binding crezcamos-prod \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/logging.logWriter

gcloud projects add-iam-policy-binding crezcamos-prod \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/monitoring.metricWriter

# Crear y descargar JSON key
gcloud iam service-accounts keys create gke-sa-key.json \
  --iam-account=$SA_EMAIL

# Codificar en base64 para GitLab variables
cat gke-sa-key.json | base64 -w 0 > sa-key-base64.txt
echo "" >> sa-key-base64.txt

# Ver el contenido (para copiar a GitLab)
cat sa-key-base64.txt
```

### Crear Service Accounts en Kubernetes

```bash
# DEV Cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster
kubectl create serviceaccount crezcamos-deployer -n default
kubectl create clusterrolebinding crezcamos-deployer-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:crezcamos-deployer

# STAGING Cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl create serviceaccount crezcamos-deployer -n default
kubectl create clusterrolebinding crezcamos-deployer-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:crezcamos-deployer

# PROD Cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster
kubectl create serviceaccount crezcamos-deployer -n default
kubectl create clusterrolebinding crezcamos-deployer-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=default:crezcamos-deployer
```

---

## 🚀 Setup de GitLab Runner

### En Máquina GitLab (VM1)

```bash
# Instalar GitLab Runner (Linux)
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# Verificar instalación
gitlab-runner --version

# Registrar GitLab Runner con GitLab
sudo gitlab-runner register \
  --url=https://gitlab.crezcamos.com/ \
  --registration-token=<YOUR_RUNNER_TOKEN> \
  --executor=docker \
  --docker-image=ubuntu:22.04 \
  --docker-privileged \
  --docker-volumes=/var/run/docker.sock:/var/run/docker.sock \
  --docker-tlsverify=false \
  --run-untagged=false \
  --tag-list="docker,gcp" \
  --description="Crezcamos Docker Runner" \
  --locked=false

# Iniciar servicio
sudo systemctl start gitlab-runner
sudo systemctl enable gitlab-runner

# Verificar runner
sudo gitlab-runner status
sudo gitlab-runner list
```

### Verificar conexión

```bash
# Ver logs
sudo gitlab-runner -debug run

# Listar runners registrados
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  https://gitlab.crezcamos.com/api/v4/runners
```

---

## 📦 Configuración de Namespaces

```bash
# Namespaces DEV
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster

# Crear namespace development
kubectl create namespace development
kubectl label namespace development environment=dev
kubectl annotate namespace development crezcamos.io/environment=development

# Crear namespace para herramientas (monitoring, logging, etc)
kubectl create namespace monitoring
kubectl create namespace logging
kubectl create namespace ingress-nginx

# Namespaces STAGING
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-staging-cluster

kubectl create namespace staging
kubectl label namespace staging environment=staging
kubectl create namespace monitoring
kubectl create namespace logging
kubectl create namespace ingress-nginx

# Namespaces PROD
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster

kubectl create namespace production
kubectl label namespace production environment=prod
kubectl create namespace monitoring
kubectl create namespace logging
kubectl create namespace ingress-nginx

# Verificar
kubectl get namespaces --show-labels
```

---

## 🔐 Configuración de RBAC

### DEV Cluster - RBAC

```bash
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster

# Crear Role para developers
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: development
  name: developer
rules:
- apiGroups: [""]
  resources: ["pods", "pods/logs", "pods/exec"]
  verbs: ["get", "list", "watch", "create"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["services"]
  verbs: ["get", "list"]
EOF

# Crear RoleBinding para developers
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: development
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: developer
subjects:
- kind: ServiceAccount
  name: crezcamos-deployer
  namespace: default
EOF
```

### PROD Cluster - RBAC más restrictivo

```bash
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster

# Crear Role restringido para producción
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: deployer
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "deployments/scale"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "pods/logs"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
EOF

# Crear RoleBinding
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: deployer-binding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployer
subjects:
- kind: ServiceAccount
  name: crezcamos-deployer
  namespace: default
EOF
```

---

## ✅ Validación de Instalación

### Checklist de Validación

```bash
# 1. Verificar GCP Project
gcloud config list --properties=core/project

# 2. Verificar APIs habilitadas
gcloud services list --enabled | grep -E "container|logging|monitoring|artifact|compute"

# 3. Verificar VPC y Subnets
gcloud compute networks subnets list --network=crezcamos-vpc

# 4. Verificar Clusters
gcloud container clusters list --region=us-central1

# 5. Verificar contextos kubectl
kubectl config get-contexts

# 6. Verificar conexión a cada cluster
for context in \
  "gke_crezcamos-prod_us-central1_crezcamos-dev-cluster" \
  "gke_crezcamos-prod_us-central1_crezcamos-staging-cluster" \
  "gke_crezcamos-prod_us-central1_crezcamos-prod-cluster"
do
  echo "Verificando $context..."
  kubectl cluster-info --context=$context
  kubectl get nodes --context=$context
  kubectl get namespaces --context=$context
done

# 7. Verificar Service Accounts
gcloud iam service-accounts list | grep crezcamos

# 8. Verificar GitLab Runner
gitlab-runner status
gitlab-runner list
```

### Test de Deployment

```bash
# Usar un cluster (ej. DEV)
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster

# Crear un test deployment
kubectl run test-pod --image=nginx:latest --namespace=development

# Verificar
kubectl get pods -n development
kubectl describe pod test-pod -n development

# Limpiar
kubectl delete pod test-pod -n development
```

---

## 🔗 Variables de GitLab CI/CD

Después de completar esta instalación, necesitas configurar estas variables en GitLab:

```
GCP_PROJECT_ID: crezcamos-prod
GCP_SERVICE_ACCOUNT_KEY: [contenido de sa-key-base64.txt]
GCP_REGION: us-central1
GKE_DEV_CLUSTER: crezcamos-dev-cluster
GKE_STAGING_CLUSTER: crezcamos-staging-cluster
GKE_PROD_CLUSTER: crezcamos-prod-cluster
DOCKER_REGISTRY: gcr.io/crezcamos-prod
```

---

## 📞 Troubleshooting

### Cluster no conecta
```bash
# Verificar credenciales
gcloud auth list
gcloud config get-value project

# Re-obtener credenciales
gcloud container clusters get-credentials crezcamos-dev-cluster \
  --region=us-central1

# Verificar permisos
kubectl auth can-i get nodes
```

### GitLab Runner no se conecta
```bash
# Ver logs
sudo gitlab-runner -debug run

# Verificar conectividad
curl -I https://gitlab.crezcamos.com

# Re-registrar si necesario
sudo gitlab-runner unregister --all-runners
sudo gitlab-runner register ...
```

### Error de permisos en Kubernetes
```bash
# Verificar RBAC
kubectl auth can-i create deployments --as=system:serviceaccount:default:crezcamos-deployer

# Actualizar roles si necesario
kubectl edit rolebinding crezcamos-deployer-admin
```

---

## 📊 Resumen Final

| Componente | Status | Verificación |
|-----------|--------|-------------|
| GCP Project | ✅ | `gcloud config list` |
| APIs Habilitadas | ✅ | `gcloud services list --enabled` |
| VPC Networks | ✅ | `gcloud compute networks list` |
| EKE Clusters | ✅ | `gcloud container clusters list` |
| kubectl contextos | ✅ | `kubectl config get-contexts` |
| Service Accounts | ✅ | `gcloud iam service-accounts list` |
| GitLab Runner | ✅ | `gitlab-runner status` |
| Namespaces | ✅ | `kubectl get namespaces` |
| RBAC | ✅ | `kubectl get roles --all-namespaces` |

---

## 📚 Documentos Relacionados

- [Configuración de Pipelines](configuracion-pipelines.md)
- [Configuración de Monitoreo](configuracion-monitoreo.md)
- [DEPLOYMENT-CHECKLIST.md](../DEPLOYMENT-CHECKLIST.md)

---

**Documento:** instalacion-infraestructura.md  
**Versión:** 1.0.0  
**Última actualización:** 29 de marzo de 2026
