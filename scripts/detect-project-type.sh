#!/bin/bash
# Script de detección de tipo de proyecto
# Determina el tipo de proyecto según archivos clave

PROJECT_TYPE=""

# Detectar Spring Boot (Java/Maven)
if [ -f "pom.xml" ] || [ -f "build.gradle" ]; then
    PROJECT_TYPE="springboot"
    echo "Spring Boot project detected"
    exit 0
fi

# Detectar Flutter
if [ -f "pubspec.yaml" ] || [ -f "pubspec.lock" ]; then
    PROJECT_TYPE="flutter"
    echo "Flutter project detected"
    exit 0
fi

# Detectar Angular
if [ -f "angular.json" ] && grep -q '"projectType": "application"' angular.json; then
    PROJECT_TYPE="angular"
    echo "Angular project detected"
    exit 0
fi

# Detectar TypeScript/Node
if [ -f "package.json" ] && [ -f "tsconfig.json" ]; then
    # Revisar si es Angular
    if grep -q '"@angular/core"' package.json; then
        PROJECT_TYPE="angular"
        echo "Angular (from package.json) detected"
    else
        PROJECT_TYPE="typescript"
        echo "TypeScript project detected"
    fi
    exit 0
fi

# Detectar Node.js puro
if [ -f "package.json" ]; then
    PROJECT_TYPE="nodejs"
    echo "Node.js project detected"
    exit 0
fi

# Si no se detecta nada
if [ -z "$PROJECT_TYPE" ]; then
    echo "WARNING: No project type detected, defaulting to generic"
    PROJECT_TYPE="generic"
fi

echo "$PROJECT_TYPE"
