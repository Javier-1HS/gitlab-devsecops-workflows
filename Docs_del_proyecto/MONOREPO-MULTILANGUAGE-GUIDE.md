# 🏗️ Arquitectura de Monorepo Multi-Lenguaje

## Visión General

Esta arquitectura permite gestionar múltiples proyectos de diferentes lenguajes y frameworks en un único repositorio GitLab, con pipelines específicos que se detectan automáticamente según el tipo de proyecto.

**Lenguajes soportados:**
- ✅ Spring Boot (Java/Maven)
- ✅ Angular (TypeScript/Node.js)
- ✅ Flutter (Dart)
- ✅ TypeScript Backend (Node.js)
- ✅ Node.js genérico

## Estructura de Monorepo

```
proyecto-gitlab-cicd-crezcamos/
│
├── 📁 proyecto-spring-boot/        # Proyecto Spring Boot
│   ├── pom.xml                     # Detecta automáticamente
│   ├── src/
│   ├── docker/spring-boot/
│   └── .gitlab-ci.yml (opcional)
│
├── 📁 proyecto-angular/            # Proyecto Angular
│   ├── angular.json                # Detecta automáticamente
│   ├── package.json
│   ├── src/
│   ├── docker/angular/
│   └── .gitlab-ci.yml (opcional)
│
├── 📁 proyecto-flutter/            # Proyecto Flutter
│   ├── pubspec.yaml                # Detecta automáticamente
│   ├── lib/
│   ├── docker/flutter/
│   └── .gitlab-ci.yml (opcional)
│
├── 📁 proyecto-typescript/         # Proyecto TypeScript Backend
│   ├── tsconfig.json               # Detecta automáticamente
│   ├── package.json
│   ├── src/
│   ├── docker/typescript/
│   └── .gitlab-ci.yml (opcional)
│
├── .gitlab-ci-multilanguage.yml    # Pipeline PRINCIPAL
├── .gitlab/
│   ├── ci/                         # Pipelines específicos por rama
│   │   ├── develop-pipeline.yml
│   │   ├── release-pipeline.yml
│   │   └── main-pipeline.yml
│   └── templates/                  # Templates reutilizables
│       ├── security.yml
│       ├── build.yml
│       ├── deploy.yml
│       ├── springboot.yml
│       ├── angular.yml
│       ├── flutter.yml
│       └── typescript.yml
│
└── docker/                         # Dockerfiles específicos
    ├── spring-boot/Dockerfile
    ├── angular/Dockerfile
    ├── flutter/Dockerfile
    └── typescript/Dockerfile
```

## 🔍 Cómo Funciona la Detección Automática

### Job: `detect-project-type`

Se ejecuta **primero** en cada pipeline y detecta el tipo de proyecto basado en archivos clave:

```yaml
Spring Boot    → pom.xml o build.gradle
Angular        → angular.json
Flutter        → pubspec.yaml o pubspec.lock
TypeScript     → tsconfig.json + package.json
Node.js        → package.json
```

El resultado se guarda en una variable `PROJECT_TYPE` que luego se usa en los `rules` de otros jobs.

### Flujo de Ejecución

```
1. detect-project-type  ← Se detecta el tipo
                   ↓
2. Los jobs específicos usan rules basadas en PROJECT_TYPE
                   ↓
3. Solo ejecutan los jobs relevantes para ese lenguaje
                   ↓
4. Despliegue específico según el tipo
```

## 📝 Configurar un Nuevo Proyecto

### Opción 1: Proyecto Spring Boot

```bash
# En carpeta proyecto-spring-boot/
mkdir -p proyecto-spring-boot/src/main/java/com/crezcamos
cd proyecto-spring-boot

# Crear pom.xml
cat > pom.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/maven-v4_0_0.xsd">
  <modelVersion>4.0.0</modelVersion>
  
  <groupId>com.crezcamos</groupId>
  <artifactId>mi-aplicacion</artifactId>
  <version>1.0.0</version>
  
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.1.0</version>
  </parent>
  
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
  </dependencies>
</project>
EOF
```

**Resultado:** Pipeline detecta `pom.xml` → Ejecuta jobs `.springboot-*`

### Opción 2: Proyecto Angular

```bash
# En carpeta proyecto-angular/
cd proyecto-angular

# Crear angular.json (si no existe)
ng new . --routing --style=scss

# O si ya exists:
# Los archivos presentes:
# - angular.json
# - package.json
# - tsconfig.json
```

**Resultado:** Pipeline detecta `angular.json` → Ejecuta jobs `.angular-*`

### Opción 3: Proyecto Flutter

```bash
# En carpeta proyecto-flutter/
cd proyecto-flutter

# Crear pubspec.yaml
flutter create .

# Los archivos presentes:
# - pubspec.yaml
# - lib/
# - test/
```

**Resultado:** Pipeline detecta `pubspec.yaml` → Ejecuta jobs `.flutter-*`

### Opción 4: Proyecto TypeScript Backend

```bash
# En carpeta proyecto-typescript/
cd proyecto-typescript

# Crear estructura
npm init -y
npx tsc --init

# Los archivos presentes:
# - tsconfig.json
# - package.json
# - src/
```

**Resultado:** Pipeline detecta `tsconfig.json` + `package.json` → Ejecuta jobs `.typescript-*`

## 🚀 Ejecutar el Pipeline Multilang

### Opción A: Usar `.gitlab-ci-multilanguage.yml` Directamente

Renombrar el archivo principal:

```bash
# Respaldar original
mv .gitlab-ci.yml .gitlab-ci-single-project.yml

# Activar multilanguage
mv .gitlab-ci-multilanguage.yml .gitlab-ci.yml

# O crear symlink
ln -s .gitlab-ci-multilanguage.yml .gitlab-ci.yml
```

### Opción B: Incluirlo como Template (Recomendado)

En tu `.gitlab-ci.yml` principal:

```yaml
include:
  - local: '.gitlab-ci-multilanguage.yml'
```

## 🔄 Estructura de Carpetas por Proyecto

### Para cada proyecto (ejemplo Angular):

```
proyecto-angular/
├── angular.json                    # ← DETECTA PROJECT_TYPE
├── package.json
├── tsconfig.json
├── src/
│   ├── app/
│   ├── styles/
│   └── environments/
├── cypress/
│   └── e2e/
├── Dockerfile                      # (opcional)
├── kubernetes/
│   └── manifests/                  # (opcional)
└── .gitlab-ci.yml                  # (opcional, override)
```

**Importante:** El archivo de detección (`pom.xml`, `angular.json`, `pubspec.yaml`, `tsconfig.json`) debe estar en la **raíz de la carpeta del proyecto**.

## 📦 Variables Específicas por Proyecto

### Agregar en `.gitlab/ci/develop-pipeline.yml` (para cada rama):

```yaml
# Para proyectos Angular
variables:
  NODE_VERSION: "18"

# Para proyectos Flutter
variables:
  FLUTTER_VERSION: "3.13.0"

# Para proyectos Spring Boot
variables:
  MAVEN_OPTS: "-Xmx512m"
```

## 🎯 Ejemplos de Uso

### Deploy Spring Boot a dev:

```bash
git checkout develop
git add proyecto-spring-boot/
git commit -m "feat: add new feature"
git push origin develop

# Pipeline detecta pom.xml → Ejecuta .springboot-* jobs
```

### Deploy Angular a staging:

```bash
git checkout release
git add proyecto-angular/
git commit -m "release: version 1.1.0"
git push origin release

# Pipeline detecta angular.json → Ejecuta .angular-* jobs
# Requiere aprobación manual
```

### Deploy Flutter a producción:

```bash
git checkout main
git add proyecto-flutter/
git commit -m "version: 2.0.0"
git push origin main

# Pipeline detecta pubspec.yaml → Ejecuta .flutter-* jobs
# Requiere aprobaciones múltiples
# Blue-Green deployment
```

## 🔐 Seguridad

**Seguridad ejecuta en todos los proyectos:**

1. `secret-scanning` - Detecta credenciales en código
2. `dependency-check` - Analiza vulnerabilidades en dependencias
3. `vulnerability-scan` - Escanea imagen Docker final
4. `sonarqube-*` - Análisis de código específico por lenguaje

## 📊 Monitoreo & Logs

Ver logs específicos del tipo de proyecto:

```bash
# GitLab Pipeline → Stage → Job

# Spring Boot logs
kubectl logs -l app=crezcamos -n development | grep "Spring Boot"

# Angular logs
kubectl logs -l app=crezcamos -n development | grep "Angular"

# Flutter logs
kubectl logs -l app=crezcamos -n development | grep "Flutter"
```

## ⚠️ Troubleshooting

### El pipeline no detecta el tipo

1. Verificar que el **archivo clave** está **en la raíz del proyecto**
   ```bash
   ls -la pom.xml angular.json pubspec.yaml tsconfig.json
   ```

2. Verificar el job `detect-project-type` en la UI de GitLab
   ```
   Pipeline → detect → detect-project-type → Logs
   ```

3. Re-ejecutar el pipeline
   ```
   GitLab UI → Pipeline → Play ▶️
   ```

### El job correcto no ejecuta

1. Verificar que `PROJECT_TYPE` está correcta
   ```yaml
   # En artifacts del job detect-project-type
   PROJECT_TYPE=springboot  # or angular, flutter, typescript
   ```

2. Verificar los `rules` en el template correspondiente
   ```yaml
   rules:
     - if: '$PROJECT_TYPE == "springboot"'
   ```

3. Renovación de pipeline
   ```bash
   git push --force origin develop  # Fuerza re-ejecución
   ```

### Conflicto con variables globales

Si hay conflicto con `.gitlab-ci.yml` existente:

```yaml
# En .gitlab/ci/develop-pipeline.yml
variables:
  NODE_VERSION: "18"  # Override variable global
  OVERRIDE_ME: "value"
```

## 🔗 Integración con Monorepo

Para un verdadero monorepo con múltiples repositorios:

**Opción 1: Submodules**
```bash
git submodule add <repo-angular> proyecto-angular
git submodule add <repo-spring> proyecto-spring
```

**Opción 2: Workspaces (npm/yarn)**
```json
{
  "private": true,
  "workspaces": [
    "proyecto-angular",
    "proyecto-typescript"
  ]
}
```

**Opción 3: Separate pipelines per folder**
```yaml
trigger:
  include:
    - local: 'proyecto-angular/.gitlab-ci.yml'
      strategy: depend
    - local: 'proyecto-spring-boot/.gitlab-ci.yml'
      strategy: depend
```

## 📚 Documentación Enlaces

- [GitLab Dynamic Includes](https://docs.gitlab.com/ee/ci/yaml/dynamic_includes.html)
- [GitLab Rules](https://docs.gitlab.com/ee/ci/yaml/rules.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Última actualización:** Marzo 2026  
**Versión:** 1.0.0  
**Autor:** Crezcamos DevOps Team
