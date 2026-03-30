# 🚀 Crezcamos - Plataforma de Gestión
## Sistema Completo de CI/CD en GitLab con Despliegue en GCP

[![GitFlow](https://img.shields.io/badge/GitFlow-Gobernado-brightgreen)](https://gitflow.io)
[![GCP](https://img.shields.io/badge/Cloud-GCP%20GKE-blue)](https://cloud.google.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-success)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Proyecto empresarial completo** que implementa una solución integral de CI/CD para Crezcamos con despliegue automatizado en Google Kubernetes Engine (GKE) siguiendo mejores prácticas de DevOps.

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración Inicial](#configuración-inicial)
- [Pipelines CI/CD](#pipelines-cicd)
- [Despliegue](#despliegue)
- [Testing](#testing)
- [Seguridad](#seguridad)
- [Monitoreo](#monitoreo)
- [Troubleshooting](#troubleshooting)

## 📖 Descripción General

Este proyecto proporciona una solución **production-ready** de CI/CD que automatiza completamente el ciclo de vida del software, desde el desarrollo hasta la producción. Implementa:

✅ **GitFlow Gobernado** con protecciones y aprobaciones  
✅ **Pipelines automatizados** con escaneo de seguridad  
✅ **Despliegue en Kubernetes** con Blue-Green strategy  
✅ **Observabilidad completa** con Google Cloud Operations  
✅ **Testing multicapa** (unitarias, integración, E2E, rendimiento)  
✅ **Infraestructura como código** (IaC) con Kubernetes manifests  

## 🌟 Características

### 🔐 Seguridad Integrada
- ✓ Detección de secretos (TruffleHog)
- ✓ Análisis de dependencias (OWASP Dependency Check)
- ✓ Escaneo de vulnerabilidades en imágenes (Trivy)
- ✓ Pruebas de seguridad (OWASP ZAP)
- ✓ Análisis de calidad de código (SonarQube)

### 🧪 Testing Completo
- ✓ Pruebas unitarias con cobertura
- ✓ Pruebas de integración
- ✓ Pruebas E2E con Cypress
- ✓ Pruebas de rendimiento con k6
- ✓ Health checks automatizados
- ✓ Smoke tests post-despliegue

### 🚀 Despliegue Avanzado
- ✓ Despliegue azul-verde (Blue-Green) en producción
- ✓ Rolling updates en staging y desarrollo
- ✓ Auto-scaling horizontal (HPA)
- ✓ Rollback automático o manual
- ✓ Soporte multi-ambiente (DEV, STAGING, PROD)

### 📊 Observabilidad
- ✓ Logs centralizados (Google Cloud Logging)
- ✓ Métricas con Prometheus
- ✓ Dashboards con Grafana
- ✓ Alertas y notificaciones (Slack)
- ✓ Trazabilidad distribuida

### 📦 DevOps Moderno
- ✓ Dockerización automatizada
- ✓ Manifiestos Kubernetes parametrizados
- ✓ GitOps ready
- ✓ Infrastructure as Code
- ✓ Secrets management

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitLab (VM1)                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GitLab Self-Managed                                        │ │
│  │ ├── GitLab Runner (Docker Executor)                        │ │
│  │ ├── Container Registry                                     │ │
│  │ └── Pipeline Automation                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────▼─────────────────────────────────────────────┘
                      │
                      ▼ Build & Test
┌─────────────────────────────────────────────────────────────────┐
│                  Google Cloud Platform                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Google Kubernetes Engine (GKE) Clusters                    │ │
│  │                                                            │ │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │ │   DEV    │  │ STAGING  │  │   PROD   │                 │ │
│  │ │ Cluster  │  │ Cluster  │  │ Cluster  │                 │ │
│  │ │ Auto     │  │ 2-3 Nodos│  │ HA Multi │                 │ │
│  │ │ 2 Nodos  │  │ Manifest │  │ Zone 3-5 │                 │ │
│  │ └──────────┘  └──────────┘  │ Nodos    │                 │ │
│  │                              └──────────┘                 │ │
│  │    vert│Rolling  Rolling              Blue-Green         │ │
│  │    Auto│Updates   Updates  Manual  Approval │ Traffic    │ │
│  │        │Approval  Approval Switch   Validation           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Google Cloud Operations Suite                              │ │
│  │ ├── Cloud Logging (Logs Centralizados)                    │ │
│  │ ├── Cloud Monitoring (Métricas e Alertas)                 │ │
│  │ ├── Cloud Trace (Trazabilidad Distribuida)                │ │
│  │ └── Error Reporting                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
proyecto-gitlab-cicd-crezcamos/
├── 📄 README.md                      # Este archivo
├── 📄 LICENSE                        # Licencia del proyecto
├── 📄 package.json                   # Dependencias Node.js
├── 📄 sonar-project.properties       # Configuración SonarQube
├── 📄 cypress.config.js              # Configuración Cypress
├── 📄 .dockerignore                  # Archivos ignorados en Docker
│
├── 📁 .gitlab/                       # Configuración GitLab
│   ├── 📁 ci/                        # Pipelines específicos por rama
│   │   ├── develop-pipeline.yml      # Pipeline para rama develop
│   │   ├── release-pipeline.yml      # Pipeline para rama release
│   │   └── main-pipeline.yml         # Pipeline para rama main
│   │
│   └── 📁 templates/                 # Templates reutilizables
│       ├── security.yml              # Jobs de seguridad
│       ├── build.yml                 # Jobs de construcción
│       └── deploy.yml                # Jobs de despliegue
│
├── 📁 docker/                        # Dockerización
│   └── Dockerfile                    # Multi-stage Dockerfile
│
├── 📁 infrastructure/                # Infraestructura como código
│   └── 📁 kubernetes/                # Manifiestos Kubernetes
│       └── 📁 apps/                  # Aplicación
│           ├── 📁 dev/               # Manifiestos para DEV
│           │   ├── deployment.yaml
│           │   ├── service.yaml
│           │   └── configmap.yaml
│           ├── 📁 staging/           # Manifiestos para STAGING
│           │   ├── deployment.yaml
│           │   ├── service.yaml
│           │   ├── configmap.yaml
│           │   └── hpa.yaml
│           └── 📁 prod/              # Manifiestos para PROD
│               ├── deployment.yaml
│               ├── service.yaml
│               └── configmap.yaml
│
├── 📁 scripts/                       # Scripts y herramientas
│   └── 📁 performance/               # Tests de rendimiento
│       └── load-test.js              # Test de carga con k6
│
├── 📁 src/                           # Código fuente (ejemplo)
│   └── index.js                      # Entry point
│
├── 📁 tests/                         # Pruebas
│   ├── unit/                         # Pruebas unitarias
│   └── integration/                  # Pruebas de integración
│
└── 📁 cypress/                       # Tests E2E
    ├── e2e/                          # Especificaciones E2E
    ├── support/                      # Helpers y configuración
    └── fixtures/                     # Datos de prueba
```

## ⚙️ Configuración Inicial

### Prerequisitos

- **Node.js** 18+ 
- **Docker** 24+
- **kubectl** 1.24+
- **git**
- Acceso a **GitLab** (instancia self-managed)
- Acceso a **Google Cloud Platform**
- Acceso a **SonarQube** (opcional pero recomendado)

### 1. Clonar Repositorio

```bash
git clone <URL_REPOSITORIO>
cd proyecto-gitlab-cicd-crezcamos
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

**En GitLab > Settings > CI/CD > Variables** agregar:

```yaml
# GCP Configuration
GCP_PROJECT_ID: "crezcamos-prod"
GCP_REGION: "us-central1"
GCP_SERVICE_ACCOUNT_KEY: <base64_encoded_service_account>

# GKE Clusters
GKE_CLUSTER_DEV: "crezcamos-dev-cluster"
GKE_CLUSTER_STAGING: "crezcamos-staging-cluster"
GKE_CLUSTER_PROD: "crezcamos-prod-cluster"

# Registry
CI_REGISTRY_USER: <gitlab_username>
CI_REGISTRY_PASSWORD: <gitlab_token>

# Database
DATABASE_URL_STAGING: "postgresql://user:pass@host/db"
DATABASE_URL_PROD: "postgresql://user:pass@host/db"

# API Keys
API_KEY_STAGING: <staging_api_key>
API_KEY_PROD: <prod_api_key>

# SonarQube
SONAR_HOST_URL: "https://sonarqube.crezcamos.com"
SONAR_TOKEN: <sonarqube_token>

# Slack Notifications
SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/..."
```

### 4. Verificar Conexión a GKE

```bash
# Autenticar con GCP
gcloud auth activate-service-account --key-file=service-account.json
gcloud config set project crezcamos-prod

# Obtener credenciales de cluster
gcloud container clusters get-credentials crezcamos-dev-cluster --region us-central1

# Verificar conexión
kubectl cluster-info
kubectl get nodes
```

## 🔄 Pipelines CI/CD

### Pipeline para `develop` (Automático)

Ejecuta automáticamente en cada push a `develop`:

```
┌─ security-scan ─┐
│ • Secret scanning
│ • Dependency check     ┌─ test ─┐
│                        │ • Unit tests
│                        │ • Integration tests
├─── build ──┤
│ • Docker build        ├─ quality ─┐
│ • Image push          │ • SonarQube analysis
│
├─ vulnerability ─┐
│ • Trivy scan
│
└─ deploy ──────────────┐
  • Deploy a DEV        ├─ post-deploy ───┐
  • Health check        │ • Health checks
  • Smoke tests         │ • E2E tests
  • Performance tests   │ • Performance tests
```

**Características:**
- ✅ Despliegue automático a DEV
- ✅ No requiere aprobaciones
- ✅ Useful para desarrollo rápido
- ⏹️ Se detiene en vulnerabilidades críticas

### Pipeline para `release` (Con Aprobaciones)

Ejecuta automáticamente en cada push a `release`:

```
┌─ security-scan ──┐
│ • Secret scanning
│ • Dependency check    ┌─ test ────┐
│                      │ • E2E tests
├─── build ──┤ • Security tests  ├─ approval ─┐
│ • Docker build      │              │ QA Approval
│ • Image push        │
│
├─ vulnerability ─┐
│ • Trivy scan
│
┌─ approval ──────────────┐
│ • Líder Técnico         ├─ deploy ────┐
│ • Comité de Cambios     │ • Staging
│                         ├─ post-deploy ──┐
│                         │ • Smoke tests
│                         │ • E2E tests
```

**Características:**
- ✅ Requiere aprobación de QA
- ✅ Requiere aprobación de Líder Técnico
- ✅ Despliegue a Staging
- ✅ Tagging automático de imagen
- ✅ Capacidad de rollback

### Pipeline para `main` (Blue-Green Deployment)

Ejecuta automáticamente en cada push a `main`:

```
┌─ security-scan ─┐
│ • Secret scanning
│ • Dependency check      ┌─ approval ────────────┐
│                        │ • Líder Técnico
├─ build ──┤ • Comité de Cambios
│ • Docker build
│ • Image tagging
│
├─ vulnerability ─┐
│ • Trivy scanning (CRÍTICA)
│
├─ deploy ────────────────────┐  ┌─ approval ──────────────┐
│ • Create release tag        │  │ • Validar smoke tests
│ • Blue-Green prep           ├──┤ • Validar métricas
│ • Deploy Green              │  │ • Aprobación final
│ • Smoke tests Green         │  │
│ • Traffic switch approval   │
│
└─ post-deploy ──────────────┐
  • Valproduction metrics
  • Cleanup Blue
  • Notificaciones
```

**Características:**
- ✅ Despliegue azul-verde sin downtime
- ✅ Aprobación de Líder Técnico
- ✅ Aprobación de Comité de Cambios
- ✅ Validaciones de salud
- ✅ Monitoreo post-switch
- ✅ Rollback disponible

### Estrategia de Branching (GitFlow)

```
main (Producción)
  │
  ├─ release/v1.0.0 (QA/Staging)
  │   │
  │   └─ hotfix/bug-fix (Correcciones urgentes)
  │
develop (Integración)
  │
  ├─ feature/new-feature
  ├─ feature/another-feature
  │
  └─ bugfix/issue-123
```

**Reglas:**
- `main`: Protegida, requiere PR y todas las reviews
- `release/*`: Persistente, branch pre-producción
- `develop`: Protegida, base para features
- `feature/*`, `bugfix/*`: Temporal, desde `develop`
- `hotfix/*`: Desde `main`, merge a `main` y `develop`

## 🚀 Despliegue

### Despliegue a Development

**Automático** en cada push a `develop`

```bash
# Ver estado del despliegue
kubectl get pods -n development -w

# Ver logs
kubectl logs -l app=crezcamos -n development -f

# URL de acceso
kubectl get svc -n development
```

### Despliegue a Staging

**Manual** tras aprobación en pipeline de `release`

1. Push a rama `release`
2. Pipelines ejecutan automáticamente
3. Esperar aprobación manual: **QA Approval** ✋
4. Despliegue automático a Staging
5. Ejecutar E2E tests y validaciones

```bash
kubectl get pods -n staging -w
kubectl get svc -n staging
```

### Despliegue a Producción (Blue-Green)

**Controlado** en rama `main` con múltiples aprobaciones

**Proceso:**
1. Crear PR de `release` → `main`
2. Pipelinelines ejecutan validaciones
3. Aprobación 1: **Líder Técnico** ✅
4. Aprobación 2: **Comité de Cambios** ✅
5. Tag de release creado automáticamente
6. Deployment Green desplegado
7. Smoke tests en Green
8. Aprobación manual: **Traffic Switch** ✋
9. Switch de tráfico de Blue a Green
10. Cleanup de Blue (después de 30 min)

```bash
# Monitorear despliegue Blue-Green
kubectl get deployments -n production

# Ver tráfico actual
kubectl get svc crezcamos -n production -o jsonpath='{.spec.selector.deployment}'

# Verificar logs
kubectl logs -l app=crezcamos -n production -f

# Switch de tráfico (si se necesita manualmente)
kubectl patch service crezcamos -n production -p '{"spec":{"selector":{"deployment":"green"}}}'
```

## 🧪 Testing

### Pruebas Unitarias

```bash
# Ejecutar pruebas unitarias
npm run test:unit

# Con cobertura
npm test

# Ver reporte de cobertura
open coverage/index.html
```

### Pruebas de Integración

```bash
npm run test:integration
```

### Pruebas E2E (Cypress)

```bash
# Interfaz interactiva
npm run test:e2e:open

# Modo headless
npm run test:e2e

# Usuarios específicos
npx cypress run --spec "cypress/e2e/login/**"
```

### Pruebas de Rendimiento (k6)

```bash
# Test de carga local
k6 run scripts/performance/load-test.js

# Test en Cloud
k6 cloud scripts/performance/load-test.js

# Con variables custom
k6 run --vus 30 --duration 30s -e BASE_URL=https://staging.crezcamos.com scripts/performance/load-test.js
```

## 🔒 Seguridad

### Análisis de Seguridad en Pipeline

Ejecuta automáticamente en todos los pipelines:

1. **Secret Scanning** - TruffleHog
   - Detecta credenciales hardcodeadas
   - Falla el pipeline si encuentra secretos

2. **Dependency Check** - OWASP
   - Analiza vulnerabilidades en dependencias
   - Reporte detallado de CVEs

3. **Container Scanning** - Trivy
   - Escanea imagen Docker
   - Bloquea vulnerabilidades críticas
   - Detallado en release/main

4. **SAST** - SonarQube
   - Análisis estático de código
   - Detecta bugs y code smells
   - Quality gate

5. **DAST** - OWASP ZAP
   - Testing dinámico de seguridad
   - Atacontra aplicación viva
   - Genera reporte HTML

### Mejores Prácticas

```bash
# Nunca hardcodear secretos
❌ const apiKey = "sk_live_123456"
✅ const apiKey = process.env.API_KEY

# Usar .env para variables locales
echo "API_KEY=secret" > .env.local

# Verificar antes de commit
npm run lint
git pre-commit hook
```

### Rotación de Credenciales

- Secretos: Rotar cada 90 días
- Tokens: Rotar cada 30 días
- Passwords: Cambiar en IAM
- Service accounts: Manejar via GCP

## 📊 Monitoreo

### Google Cloud Logging

```bash
# Ver logs de aplicación
gcloud logging read "resource.type=k8s_container AND resource.labels.pod_name=crezcamos" --limit=50

# Filtrar por nivel
gcloud logging read "severity=ERROR" --limit=50

# Crear log sink para BigQuery
gcloud logging sinks create crezcamos-sink bigquery.googleapis.com/projects/crezcamos-prod/datasets/logs
```

### Prometheus & Grafana

Métricas automáticamente recolectadas:

```
/metrics endpoint en puerto 9090

Métricas disponibles:
- http_requests_total (contador)
- http_request_duration_seconds (histograma)
- process_cpu_seconds_total
- process_resident_memory_bytes
- nodejs_version_info
```

### Alertas

**Alertas automáticas configuradas:**

- CPU > 80% (5 min)
- Memoria > 85% (5 min)
- Error rate > 5% (2 min)
- Latencia p95 > 1000ms (5 min)
- Pod restart > 3 (1 hora)
- Disk > 90% (continuo)

**Notificaciones:**
- Slack en #crezcamos-alerts
- Email a oncall@crezcamos.com
- PagerDuty para P0/P1

## 🔧 Troubleshooting

### Pipeline fallido

**Problema:** Pipeline detiene en stage de "build"

```bash
# Ver logs del job
# En GitLab: Pipeline > Job > Logs

# Validar Dockerfile
docker build -f docker/Dockerfile -t crezcamos:test .

# Verificar dependencias
npm ci --verbose
```

### Pod no inicia en Kubernetes

```bash
# Describir pod para ver error
kubectl describe pod <pod-name> -n <namespace>

# Ver logs
kubectl logs <pod-name> -n <namespace>

# Ejecutar comando en pod
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# Status del deployment
kubectl get deployment <deployment> -n <namespace> -o wide
kubectl rollout status deployment/<deployment> -n <namespace>
```

### Imagen no se descarga del registry

```bash
# Verificar credenciales de registry
kubectl get secret regcred -n <namespace> -o yaml

# Crear secret si falta
kubectl create secret docker-registry regcred \
  --docker-server=$CI_REGISTRY \
  --docker-username=$CI_REGISTRY_USER \
  --docker-password=$CI_REGISTRY_PASSWORD \
  -n <namespace>

# Test de acceso
docker login $CI_REGISTRY
```

### Falló el health check

```bash
# Test manual del endpoint
curl http://<pod-ip>:8080/health

# Ver probe configuration en manifest
kubectl get deployment <deployment> -n <namespace> -o yaml | grep -A5 livenessProbe

# Aumentar initialDelaySeconds si la app tarda en iniciar
```

### Database connection error

```bash
# Verificar secret
kubectl get secret app-secrets -n <namespace> -o yaml

# Test de conexión manual
kubectl run -it --rm debug --image=postgres:13 --restart=Never -- \
  psql -h <db-host> -U <user> -d <database>
```

### Clean up de recursos

```bash
# Limpiar namespace completo
kubectl delete namespace <namespace> --ignore-not-found

# Limpiar solo deployments
kubectl delete deployment -l app=crezcamos -n <namespace>

# Rescan de imágenes viejas
docker rmi $(docker images | grep crezcamos | awk '{print $3}')
```

## 📚 Documentación Adicional

- [GitFlow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Google Cloud GKE](https://cloud.google.com/kubernetes-engine/docs)
- [GitLab Pipelines](https://docs.gitlab.com/ee/ci/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🤝 Contribución

Para contribuir al proyecto:

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Commit changes**
   ```bash
   npm run lint  # Linting
   npm test      # Tests
   git commit -m "feat: add my feature"
   ```

3. **Push y crear PR**
   ```bash
   git push origin feature/my-feature
   ```

4. **Esperar aprobaciones** en GitLab MR

5. **Merge** cuando todas las pruebas pasen

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

## 👥 Contacto & Soporte

- **Slack:** #crezcamos-devops
- **Email:** devops@crezcamos.com
- **Issues:** GitLab Issues
- **Docs:** Wiki interno

---

**Última actualización:** Marzo 2026  
**Versión del Sistema:** 1.0.0  
**Mantenedor:** Crezcamos DevOps Team

#### Stack de Monitoreo en GKE
- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización de dashboards
- **Alertmanager**: Gestión de alertas
- **Loki**: Agregación de logs (opcional)

#### Alertas Configuradas
- CPU/Memoria > 80%
- Pods en estado CrashLoopBackOff
- Deployments fallidos
- Latencia de respuesta > umbral
- Errores HTTP 5xx > tasa aceptable
- Disponibilidad de servicios < 99.5%

## Estructura del Repositorio

```
proyecto-gitlab-cicd-crezcamos/
├── .gitlab-ci.yml                          # Pipeline principal
├── .gitlab/
│   ├── ci/
│   │   ├── develop-pipeline.yml           # Jobs para develop
│   │   ├── release-pipeline.yml           # Jobs para release
│   │   └── main-pipeline.yml              # Jobs para main
│   └── templates/
│       ├── security.yml                   # Templates de seguridad
│       ├── build.yml                      # Templates de build
│       └── deploy.yml                     # Templates de deploy
├── infrastructure/
│   ├── terraform/                         # IaC para GCP
│   │   ├── gitlab-vm/                     # Terraform para VM GitLab
│   │   ├── gke-clusters/                  # Terraform para GKE
│   │   └── monitoring/                    # Terraform para Monitoring
│   └── kubernetes/
│       ├── namespaces/                    # Definiciones de namespaces
│       ├── rbac/                          # Roles y permisos
│       ├── monitoring/                    # Stack de monitoreo
│       │   ├── prometheus/
│       │   ├── grafana/
│       │   └── alertmanager/
│       └── apps/                          # Manifiestos de aplicaciones
│           ├── dev/
│           ├── staging/
│           └── prod/
├── scripts/
│   ├── security/
│   │   ├── secret-scan.sh                 # Detección de secretos
│   │   └── dependency-check.sh            # Análisis de dependencias
│   ├── build/
│   │   └── docker-build.sh                # Script de build
│   ├── deploy/
│   │   ├── deploy-to-gke.sh              # Deploy a GKE
│   │   └── rollback.sh                   # Script de rollback
│   └── monitoring/
│       └── health-check.sh               # Health checks
├── docker/
│   ├── Dockerfile                        # Dockerfile de aplicación
│   └── .dockerignore
├── docs/
│   ├── arquitectura.md                   # Documentación de arquitectura
│   ├── pipelines.md                      # Guía de pipelines
│   ├── deployment.md                     # Guía de despliegue
│   └── monitoring.md                     # Guía de monitoreo
└── README.md                             # Este archivo
```

## Requisitos Previos

1. **Cuenta de GCP** con permisos para:
   - Compute Engine
   - Kubernetes Engine
   - Container Registry
   - Cloud Monitoring
   - Cloud Logging

2. **GitLab Self-Managed** instalado en VM1 o GitLab.com

3. **Herramientas locales**:
   - gcloud CLI
   - kubectl
   - terraform
   - docker

## Instalación y Configuración

Ver las guías detalladas en:
- [Guía de Instalación de Infraestructura](docs/instalacion-infraestructura.md)
- [Configuración de Pipelines](docs/configuracion-pipelines.md)
- [Configuración de Monitoreo](docs/configuracion-monitoreo.md)

## Seguridad

### Controles Implementados
- ✅ Secret scanning en cada commit
- ✅ Análisis de vulnerabilidades con Trivy
- ✅ Escaneo de dependencias
- ✅ Protección de ramas (main, release, develop)
- ✅ Aprobaciones obligatorias en Pull Requests
- ✅ RBAC en Kubernetes
- ✅ Network Policies en GKE
- ✅ Encriptación de secretos con Google Secret Manager

### Cumplimiento Normativo
- Trazabilidad completa de cambios
- Auditoría de despliegues
- Segregación de ambientes
- Control de accesos basado en roles
- Registro de aprobaciones

## Monitoreo y Alertas

### Dashboards Disponibles
1. **Pipeline Health**: Estado de pipelines y frecuencia de fallos
2. **Application Performance**: Latencia, throughput, errores
3. **Infrastructure**: CPU, memoria, disco, red
4. **Security**: Vulnerabilidades detectadas, secrets expuestos
5. **Business Metrics**: Métricas de negocio personalizadas

### Canales de Notificación
- Email
- Slack
- PagerDuty (opcional)
- Google Chat (opcional)

## Proceso de Despliegue

### Desarrollo (develop → DEV)
1. Crear feature branch desde develop
2. Desarrollar y hacer commits
3. Crear Pull Request a develop
4. Revisión de código (mínimo 1 aprobación)
5. Merge a develop
6. Pipeline automático despliega a DEV

### QA/Staging (develop → release → QA)
1. Crear Pull Request de develop a release
2. Revisión de código (mínimo 2 aprobaciones)
3. Merge a release
4. Pipeline ejecuta pruebas automatizadas
5. Aprobación manual de QA
6. Despliegue automático a QA/Staging
7. Certificación de calidad

### Producción (release → main → PROD)
1. Crear Pull Request de release a main
2. Revisión de código (mínimo 2 aprobaciones: técnica y funcional)
3. Merge a main
4. Pipeline ejecuta análisis de seguridad
5. Aprobación de Líder Técnico
6. Aprobación de Comité de Cambios
7. Despliegue a producción
8. Verificación automática
9. Notificación a stakeholders

## Rollback

En caso de problemas en producción:

```bash
# Opción 1: Rollback desde la UI de GitLab
# Ir al pipeline → Rollback

# Opción 2: Rollback manual
cd scripts/deploy
./rollback.sh <version-anterior>

# Opción 3: Rollback de Kubernetes
kubectl rollout undo deployment/<app-name> -n production
```

## Soporte y Contacto

- **Equipo DevSecOps**: devops@crezcamos.com
- **Documentación**: confluence.crezcamos.com/devops
- **Incidentes**: jira.crezcamos.com

## Licencia

Confidencial - Uso interno exclusivo de Crezcamos.

---

**Versión**: 1.0
**Fecha**: Marzo 2026
**Autor**: Equipo DevSecOps Crezcamos
