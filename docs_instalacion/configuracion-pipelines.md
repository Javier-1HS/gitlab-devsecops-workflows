# 🔄 GUÍA DE CONFIGURACIÓN DE PIPELINES
## GitLab CI/CD Multi-Language para Crezcamos

**Versión:** 1.0.0  
**Fecha:** 29 de marzo de 2026  
**Tiempo estimado:** 3-4 horas

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Variables de Entorno](#variables-de-entorno)
3. [Configuración de Templates](#configuración-de-templates)
4. [Pipeline Single Language](#pipeline-single-language)
5. [Pipeline Multi-Language](#pipeline-multi-language)
6. [Configuración de Runners](#configuración-de-runners)
7. [Testing y Validación](#testing-y-validación)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuración Inicial

### Estructura de carpetas

```
proyecto-gitlab-cicd-crezcamos/
├── .gitlab-ci.yml                    # Pipeline single-language
├── .gitlab-ci-multilanguage.yml      # Pipeline multi-language
├── .gitlab/
│   └── templates/
│       ├── security.yml              # Jobs de seguridad
│       ├── build.yml                 # Jobs de build
│       ├── deploy.yml                # Jobs de deploy
│       ├── springboot.yml            # Jobs Spring Boot (Java)
│       ├── angular.yml               # Jobs Angular (TypeScript)
│       ├── flutter.yml               # Jobs Flutter (Dart)
│       └── typescript.yml            # Jobs TypeScript Node.js
├── infrastructure/kubernetes/        # Manifests K8s
│   ├── dev/
│   ├── staging/
│   └── prod/
├── docker/
│   └── Dockerfile                    # Multi-stage Dockerfile
└── scripts/
    └── detect-project-type.sh        # Script de detección
```

### Verificar Acceso a GitLab

```bash
# Clonar proyecto
git clone https://gitlab.crezcamos.com/crezcamos/proyecto-gitlab-cicd-crezcamos.git
cd proyecto-gitlab-cicd-crezcamos

# Verificar archivos de pipeline
ls -la | grep gitlab
cat .gitlab-ci.yml | head -20
```

---

## 📝 Variables de Entorno

### Configurar a nivel de Proyecto

En GitLab: **Settings → CI/CD → Variables**

#### Variables Globales Requeridas

```
GCP_PROJECT_ID: crezcamos-prod
GCP_REGION: us-central1
GCP_SERVICE_ACCOUNT_KEY: [base64-encoded JSON key]
DOCKER_REGISTRY: gcr.io/crezcamos-prod
DOCKER_REGISTRY_USER: _json_key
DOCKER_REGISTRY_PASSWORD: [base64-encoded service account JSON]
KUBE_CONFIG_DEV: [base64-encoded kubectl config]
KUBE_CONFIG_STAGING: [base64-encoded kubectl config]
KUBE_CONFIG_PROD: [base64-encoded kubectl config]
```

#### Variables por Entorno

**DEV:**
```
GKE_CLUSTER: crezcamos-dev-cluster
GKE_ZONE: us-central1-a
DEPLOYMENT_IMAGE_TAG: dev-latest
KUBE_NAMESPACE: development
REPLICA_COUNT: 2
```

**STAGING:**
```
GKE_CLUSTER: crezcamos-staging-cluster
GKE_ZONE: us-central1-a
DEPLOYMENT_IMAGE_TAG: staging-latest
KUBE_NAMESPACE: staging
REPLICA_COUNT: 3
```

**PRODUCTION:**
```
GKE_CLUSTER: crezcamos-prod-cluster
GKE_ZONE: us-central1-a
DEPLOYMENT_IMAGE_TAG: v${CI_COMMIT_TAG}
KUBE_NAMESPACE: production
REPLICA_COUNT: 5
REQUIRE_APPROVAL: "true"
```

### Script para codificar Service Account Key

```bash
# Codificar en base64 (sin saltos de línea)
cat gke-sa-key.json | base64 -w 0

# Guardar en archivo (Windows)
# Copiar el output y pegarlo en GitLab Variables
```

---

## 📋 Configuración de Templates

### Paso 1: Crear estructura de plantillas

```bash
# Crear carpeta templates si no existe
mkdir -p .gitlab/templates

# Verificar que existen todos los templates
ls -la .gitlab/templates/
```

### Paso 2: Template de Seguridad (security.yml)

Referencia: `.gitlab/templates/security.yml`

```yaml
# This file contains security-related jobs

secret_scan:
  image: "registry.gitlab.com/gitlab-org/security-products/secret-detection:latest"
  stage: security
  script:
    - /entrypoint detect
  artifacts:
    reports:
      sast: gl-secret-detection-report.json
  allow_failure: true

dependency_check:
  image: "registry.gitlab.com/gitlab-org/dependency-check:latest"
  stage: security
  script:
    - /entrypoint
  artifacts:
    reports:
      dependency_scanning: dependency-check-report.json
  allow_failure: true

container_scan:
  image: aquasec/trivy:latest
  stage: security
  services:
    - docker:dind
  script:
    - trivy image --format json --output trivy-report.json ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA}
  artifacts:
    reports:
      container_scanning: trivy-report.json
  allow_failure: true
  only:
    - merge_requests
    - main
    - tags

sonarqube:
  image: sonarsource/sonar-scanner-cli:latest
  stage: quality
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: "0"
  cache:
    key: "${CI_JOB_NAME}"
    directories:
      - .sonar/cache
  script:
    - sonar-scanner -Dsonar.projectKey=${CI_PROJECT_NAME} -Dsonar.sources=. -Dsonar.host.url=https://sonarqube.crezcamos.com
  allow_failure: true
  only:
    - merge_requests
    - main
    - tags
```

### Paso 3: Template de Build (build.yml)

```yaml
# Referencia: .gitlab/templates/build.yml
build_image:
  image: docker:20.10.16
  stage: build
  services:
    - docker:20.10.16-dind
  before_script:
    - echo $DOCKER_REGISTRY_PASSWORD | docker login -u $DOCKER_REGISTRY_USER --password-stdin $DOCKER_REGISTRY
  script:
    - docker build -t ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA} .
    - docker tag ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA} ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_REF_SLUG}
    - docker push ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA}
    - docker push ${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_REF_SLUG}
    - docker images
  after_script:
    - docker logout
  only:
    - main
    - develop
    - merge_requests
    - tags
```

### Paso 4: Template de Deploy (deploy.yml)

```yaml
# Referencia: .gitlab/templates/deploy.yml
deploy_kubernetes:
  image: bitnami/kubectl:latest
  stage: deploy
  before_script:
    - mkdir -p ~/.kube
    - echo $KUBE_CONFIG | base64 -d > ~/.kube/config
    - kubectl config use-context ${GKE_CLUSTER}
  script:
    - |
      kubectl set image deployment/${CI_PROJECT_NAME} \
        ${CI_PROJECT_NAME}=${DOCKER_REGISTRY}/${CI_PROJECT_NAME}:${CI_COMMIT_SHA} \
        -n ${KUBE_NAMESPACE} \
        --record
    - kubectl rollout status deployment/${CI_PROJECT_NAME} -n ${KUBE_NAMESPACE}
  environment:
    name: ${ENVIRONMENT_NAME}
    kubernetes:
      namespace: ${KUBE_NAMESPACE}
  only:
    - main
    - tags
```

---

## 🔧 Pipeline Single Language

### Configuración básica (.gitlab-ci.yml)

```bash
# Ver archivo actual
cat .gitlab-ci.yml
```

### Estructura completa del pipeline

```yaml
# .gitlab-ci.yml - Single Language Pipeline
stages:
  - security
  - build
  - test
  - quality
  - deploy

variables:
  DOCKER_TLS_CERTDIR: "/certs"
  FF_USE_FASTZIP: "true"

include:
  - local: .gitlab/templates/security.yml
  - local: .gitlab/templates/build.yml
  - local: .gitlab/templates/deploy.yml

# Definir jobs adicionales según necesario

build_test:
  image: ${BUILD_IMAGE}
  stage: build
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist/
      - node_modules/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

unit_tests:
  image: ${BUILD_IMAGE}
  stage: test
  script:
    - npm install
    - npm run test:unit
  coverage: '/All files.*?(\d+.\d+)/'
  artifacts:
    when: always
    paths:
      - coverage/
    reports:
      junit: test-results.xml
  only:
    - merge_requests
    - main
    - develop

e2e_tests:
  image: ${BUILD_IMAGE}
  stage: test
  script:
    - npm install
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - cypress/videos/
      - cypress/screenshots/
  allow_failure: true
  only:
    - merge_requests
    - main
```

---

## 🌍 Pipeline Multi-Language

### Estructura del Multi-Language Pipeline

```bash
# Ver archivo
cat .gitlab-ci-multilanguage.yml
```

### Configuración completa

```yaml
# .gitlab-ci-multilanguage.yml - Auto-detecting Multi-Language Pipeline
stages:
  - detect
  - security
  - build
  - test
  - quality
  - scan
  - deploy

variables:
  DOCKER_TLS_CERTDIR: "/certs"
  FF_USE_FASTZIP: "true"

include:
  - local: .gitlab/templates/security.yml
  - local: .gitlab/templates/build.yml
  - local: .gitlab/templates/deploy.yml

# Stage: Detect project type
detect_project_type:
  image: alpine:latest
  stage: detect
  before_script:
    - apk add --no-cache bash
  script:
    - bash scripts/detect-project-type.sh > project_type.txt
    - PROJECT_TYPE=$(cat project_type.txt)
    - echo "PROJECT_TYPE=$PROJECT_TYPE" >> build.env
    - echo "Detected project type: $PROJECT_TYPE"
  artifacts:
    reports:
      dotenv: build.env
  only:
    - merge_requests
    - main
    - develop
    - tags

# Include language-specific templates
include:
  - local: .gitlab/templates/springboot.yml
  - local: .gitlab/templates/angular.yml
  - local: .gitlab/templates/flutter.yml
  - local: .gitlab/templates/typescript.yml
  - local: .gitlab/templates/security.yml
  - local: .gitlab/templates/build.yml
  - local: .gitlab/templates/deploy.yml

# Rules para ejecución condicional
.rules_springboot:
  rules:
    - if: '$PROJECT_TYPE == "springboot"'

.rules_angular:
  rules:
    - if: '$PROJECT_TYPE == "angular"'

.rules_flutter:
  rules:
    - if: '$PROJECT_TYPE == "flutter"'

.rules_typescript:
  rules:
    - if: '$PROJECT_TYPE == "typescript"'
```

### Script de Detección (scripts/detect-project-type.sh)

```bash
#!/bin/bash

# Detectar tipo de proyecto
if [ -f "pom.xml" ]; then
  echo "springboot"
elif [ -f "build.gradle" ]; then
  echo "springboot"
elif [ -f "angular.json" ]; then
  echo "angular"
elif [ -f "pubspec.yaml" ]; then
  echo "flutter"
elif [ -f "tsconfig.json" ] && [ -f "package.json" ]; then
  echo "typescript"
else
  echo "unknown"
fi
```

### Ejecutar el script manualmente

```bash
# Hacer ejecutable
chmod +x scripts/detect-project-type.sh

# Probar
bash scripts/detect-project-type.sh
```

---

## 🖥️ Configuración de Runners

### Verificar Runners Registrados

```bash
# En el servidor GitLab Runner
sudo gitlab-runner verify

# En GitLab UI: Admin → Runners

# Ver lista detallada
gitlab-runner list
```

### Configuración de Docker executor

```bash
# Ver configuración actual
cat /etc/gitlab-runner/config.toml
```

### Configurar Docker executor correctamente

```bash
# Instalar docker si no lo está
sudo apt-get update
sudo apt-get install docker.io -y

# Dar permisos a gitlab-runner
sudo usermod -aG docker gitlab-runner

# Reiniciar servicio
sudo systemctl restart gitlab-runner

# Verificar
sudo gitlab-runner verify
```

### Registrar nuevo runner si necesario

```bash
# Obtener registration token en GitLab
# Admin → Runners → Copy Registration Token

# Registrar
sudo gitlab-runner register \
  --url=https://gitlab.crezcamos.com/ \
  --registration-token=<REGISTRATION_TOKEN> \
  --executor=docker \
  --docker-image=ubuntu:22.04 \
  --docker-privileged \
  --docker-volumes=/var/run/docker.sock:/var/run/docker.sock \
  --tag-list="docker,gcp,security" \
  --locked=false \
  --run-untagged=true \
  --description="Crezcamos Main Docker Runner"

# Ver el config.toml generado
sudo cat /etc/gitlab-runner/config.toml
```

---

## 🧪 Testing y Validación

### Test 1: Validar sintaxis YAML

```bash
# Instalar yq si no lo tienes
sudo apt-get install yq -y

# Validar YAML
yq '.' .gitlab-ci.yml > /dev/null && echo "YAML válido" || echo "YAML inválido"
yq '.' .gitlab-ci-multilanguage.yml > /dev/null && echo "YAML válido" || echo "YAML inválido"

# Validar templates
for file in .gitlab/templates/*.yml; do
  yq '.' "$file" > /dev/null && echo "$file: OK" || echo "$file: ERROR"
done
```

### Test 2: Lint en GitLab

```bash
# Usar CI Lint de GitLab
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  -X POST \
  -F 'content=@.gitlab-ci.yml' \
  https://gitlab.crezcamos.com/api/v4/projects/<PROJECT_ID>/ci/lint
```

### Test 3: Crear rama de prueba

```bash
# Crear rama test
git checkout -b test/pipeline-validation

# Hacer commit simple
echo "test" > test.txt
git add test.txt
git commit -m "Test pipeline"

# Pushear
git push -u origin test/pipeline-validation

# Ver en GitLab Pipelines (aguardar a que corra)
```

### Test 4: Verificar ejecución de jobs

```bash
# En GitLab: CI/CD → Pipelines
# Hacer click en el pipeline más reciente
# Verificar que:
# ✅ detect_project_type completó sin errores
# ✅ security jobs ejecutaron
# ✅ build jobs ejecutaron correctamente
# ✅ test jobs pasaron
# ✅ deploy jobs completaron (si aplica)
```

### Test 5: Monitorear logs en tiempo real

```bash
# Ver logs del runner (en servidor)
sudo gitlab-runner -debug run

# Ver logs del sistema
sudo journalctl -u gitlab-runner -f

# Ver logs de Docker
docker logs $(docker ps | grep gitlab-runner | awk '{print $1}')
```

---

## 📊 Monitoreo de Pipelines

### Comandos útiles en GitLab

```bash
# Listar pipelines de un proyecto
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  https://gitlab.crezcamos.com/api/v4/projects/<PROJECT_ID>/pipelines

# Obtener detalles de pipeline específico
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  https://gitlab.crezcamos.com/api/v4/projects/<PROJECT_ID>/pipelines/<PIPELINE_ID>

# Listar jobs de un pipeline
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  https://gitlab.crezcamos.com/api/v4/projects/<PROJECT_ID>/pipelines/<PIPELINE_ID>/jobs

# Obtener logs de un job
curl --header "PRIVATE-TOKEN: <TOKEN>" \
  https://gitlab.crezcamos.com/api/v4/projects/<PROJECT_ID>/jobs/<JOB_ID>/trace
```

### Métricas de Pipeline

```bash
# Ver estadísticas
# En GitLab: Analytics → CI/CD Analytics
# Monitorear:
# - Pipeline duration
# - Job duration
# - Success rate
# - Failure reasons
```

---

## 🔍 Troubleshooting

### Pipeline no ejecuta

```bash
# Verificar si runner está registrado
gitlab-runner list

# Verificar que el runner tenga los tags correctos
# En GitLab: Settings → CI/CD → Runners
# Comparar tags del pipeline con tags del runner

# Verificar privilegios de Docker
dockerVolumeCheck() {
  docker ps
}
dockerVolumeCheck
```

### Error: "Docker: command not found"

```bash
# Instalar Docker
sudo apt-get update
sudo apt-get install docker.io -y

# Dar permisos
sudo usermod -aG docker gitlab-runner

# Reiniciar
sudo systemctl restart gitlab-runner
```

### Error: "Cannot pull image"

```bash
# Verificar que la imagen existe
docker pull ubuntu:22.04

# Verificar credenciales de registry
echo $DOCKER_REGISTRY_PASSWORD | docker login -u $DOCKER_REGISTRY_USER --password-stdin gcr.io

# Verificar variables en GitLab
# Settings → CI/CD → Variables
```

### Error: "Kubernetes API error"

```bash
# Verificar kubeconfig
echo $KUBE_CONFIG | base64 -d > test-config
kubectl cluster-info --kubeconfig=test-config

# Verificar credenciales
kubectl auth can-i get pods -n $KUBE_NAMESPACE

# Verificar que el namespace existe
kubectl get namespaces
```

### Job se queda "pending"

```bash
# Verificar si el runner tiene recursos disponibles
df -h                    # Espacio en disco
free -m                  # Memoria RAM
docker ps                # Contenedores en ejecución

# Limpiar Docker si hay problemas de espacio
docker system prune -a

# Incrementar timeouts si es necesario
# En config.toml: timeout = 3600
sudo nano /etc/gitlab-runner/config.toml
```

---

## 🔗 Estructura de Referencia

### Jerarquía de includes

```
.gitlab-ci.yml (o .gitlab-ci-multilanguage.yml)
├── .gitlab/templates/security.yml
├── .gitlab/templates/build.yml
├── .gitlab/templates/deploy.yml
├── .gitlab/templates/springboot.yml
├── .gitlab/templates/angular.yml
├── .gitlab/templates/flutter.yml
└── .gitlab/templates/typescript.yml
```

### Variables disponibles en jobs

```yaml
# Predefinidas por GitLab:
- CI_PROJECT_NAME           # Nombre del proyecto
- CI_PROJECT_ID             # ID del proyecto
- CI_COMMIT_SHA             # SHA del commit
- CI_COMMIT_REF_SLUG        # Nombre de branch sanitizado
- CI_PIPELINE_ID            # ID del pipeline
- CI_JOB_ID                 # ID del job
- CI_MERGE_REQUEST_IID      # ID de merge request

# Customizadas (en GitLab):
- GCP_PROJECT_ID
- DOCKER_REGISTRY
- KUBE_CONFIG_DEV
- etc.
```

---

## ✅ Checklist Final

- [ ] Todos los templates están en `.gitlab/templates/`
- [ ] Variables están configuradas en GitLab
- [ ] Runner está registrado y funciona
- [ ] `.gitlab-ci.yml` valida sintaxis YAML
- [ ] `.gitlab-ci-multilanguage.yml` valida sintaxis YAML
- [ ] Script `detect-project-type.sh` es ejecutable
- [ ] Kubeconfig está codificado en base64
- [ ] Service account key está codificada en base64
- [ ] Primer pipeline ejecutó sin errores
- [ ] Security jobs ejecutaron correctamente
- [ ] Build job generó imagen Docker
- [ ] Deploy job puede conectarse a clusters

---

## 📚 Documentos Relacionados

- [Instalación de Infraestructura](instalacion-infraestructura.md)
- [Configuración de Monitoreo](configuracion-monitoreo.md)
- [QUICK-START.md](../QUICK-START.md)

---

**Documento:** configuracion-pipelines.md  
**Versión:** 1.0.0  
**Última actualización:** 29 de marzo de 2026
