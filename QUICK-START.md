# 🚀 QUICK START - Crezcamos CI/CD
## Guía Rápida Para Desarrolladores

**Versión:** 1.0.0  
**Última Actualización:** 29 de marzo de 2026

---

## 📋 Tabla de Contenidos

1. [Primer Deployment](#primer-deployment)
2. [Flujo GitFlow](#flujo-gitflow)
3. [Troubleshooting Común](#troubleshooting-común)
4. [Comandos Útiles](#comandos-útiles)
5. [Contactos](#contactos)

---

## 🎯 Primer Deployment

### 1️⃣ Preparación Local

```bash
# Clonar repo
git clone <gitlab-url>/crezcamos-cicd.git
cd proyecto-gitlab-cicd-crezcamos

# Configurar git
git config user.name "Tu Nombre"
git config user.email "tu@crezcamos.com"

# Crear rama de trabajo
git checkout develop
git pull origin develop
git checkout -b feature/mi-feature
```

### 2️⃣ Desarrollo

```bash
# Instalar dependencias (Node.js)
npm install

# Ejecutar tests localmente
npm test                    # Unit tests
npm run test:e2e          # E2E tests (requiere app running)

# Linting
npm run lint

# Build local
npm run build

# Ejecutar app localmente
npm run dev               # Modo development
npm start                 # Modo producción
```

### 3️⃣ Commit & Push

```bash
# Staged changes
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar nueva característica"
# o
git commit -m "fix: corregir bug en login"
# o
git commit -m "docs: actualizar README"

# Push a remote
git push origin feature/mi-feature
```

### 4️⃣ Merge Request (MR)

1. **Abrir MR en GitLab**
   - Title: `feat: agregar nueva característica`
   - Description: Explicar qué cambió y por qué
   - Target: `develop`

2. **Esperar validación**
   - ✅ Pipeline completa
   - ✅ Tests pasan
   - ✅ Code quality OK
   - ✅ Coverage >= 80%

3. **Esperar aprobación**
   - Mínimo 1 revisor
   - Dirección: suggestions de revisor

4. **Merge**
   - Click "Merge when pipeline succeeds"

---

## 📊 Flujo GitFlow

```
main (producción)
  ↑
release/* (staging)
  ↑
develop (integración)
  ↑
feature/* (desarrollo)
```

### Branch `develop` (Integración)
**Quién:** Todo el equipo  
**Cuándo:** Nuevo feature completado  
**Pipeline:** Todos los tests + deploy a DEV

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nueva-api
# ... código ...
git push origin feature/nueva-api
# Abrir MR → develop
# ✅ Merge cuando pipeline completa
```

### Branch `release/*` (Staging)
**Quién:** Tech Lead + QA  
**Cuándo:** Preparar release  
**Pipeline:** Tests + deploy a STAGING

```bash
# Crear release branch
git checkout -b release/v1.2.0 origin/develop

# Bugfixes solamente
git commit -m "fix: bug en feature X"

# Push
git push origin release/v1.2.0

# Crear MR → release
# Esperar: QA approval + manual gate
# Merge cuando todo está ready
```

### Branch `main` (Producción)
**Quién:** Tech Lead + Change Committee  
**Cuándo:** Release aprobado  
**Pipeline:** Tests + deploy a PROD (azul) + smoke tests + manual traffic switch

```bash
# Merge release → main
git checkout main
git pull origin main
git merge release/v1.2.0
git tag v1.2.0
git push origin main
git push origin --tags

# Esperar: Pipeline approval + manual gates
# Resultado: ✅ Producción actualizada
```

---

## 🔍 Monitorear Pipeline

### GitLab Pipeline View
```
View pipeline: Project → CI/CD → Pipelines → [tu merge request]

Buscar por:
- Status: ✅ Success / ⏱️ Running / ❌ Failed
- Stage: detect-project-type → security → build → test → deploy → health-check
```

### Logs de Job
```
Click on job name → Ver output completo
Buscar por errores: FAILED, ERROR, Exception
```

---

## ❌ Troubleshooting Común

### Pipeline Falla en "detect-project-type"

**Síntoma:** Job "detect-project-type" reporta "PROJECT_TYPE not detected"

**Solución:**
```bash
# Verificar estructura de proyecto
ls -la

# Debe haber UNO de estos:
# - pom.xml (Spring Boot)
# - angular.json (Angular)
# - pubspec.yaml (Flutter)
# - tsconfig.json + package.json (TypeScript)

# Si falta, agregarlo
# Ej. para TypeScript:
npm init -y
touch tsconfig.json
```

---

### Tests Fallan Localmente pero Pasan en CI

**Síntoma:** `npm test` falla, pero pipeline pasa

**Solución:**
```bash
# Verificar Node version
node --version
# Debe ser >= 18

# Limpiar cache
rm -rf node_modules
rm package-lock.json
npm install

# Ejecutar tests otra vez
npm test
```

---

### Merge Conflict

**Síntoma:** "This merge request has conflicts"

**Solución:**
```bash
# Update local develop
git checkout develop
git pull origin develop

# Rebase feature branch
git checkout feature/mi-feature
git rebase develop

# Si hay conflictos, editor abrirá archivos
# Editar conflictos manually
# Ejecutar tests para verificar

# Completar rebase
git add .
git rebase --continue
# o
git rebase --abort  # si necesitas cancelar

# Force push (solo en feature branches)
git push origin feature/mi-feature --force-with-lease
```

---

### Deploy Falla a Kubernetes

**Síntoma:** Job "deploy-to-staging" o "deploy-to-prod" falla

**Solución:**
```bash
# Verificar Kubernetes cluster status
kubectl cluster-info --context=staging-cluster

# Ver deployments
kubectl get deployments -n staging

# Ver pods status
kubectl get pods -n staging
kubectl describe pod <pod-name> -n staging

# Ver logs del pod
kubectl logs <pod-name> -n staging

# Ver events
kubectl get events -n staging --sort-by='.lastTimestamp'
```

---

### Imagen Docker No Se Publica

**Síntoma:** "Failed to push image to registry"

**Solución:**
```bash
# Verificar credenciales de registry
docker login <registry-url>

# Build local para verificar
docker build -t crezcamos:local .

# Run para verificar funciona
docker run crezcamos:local

# Si build falla, verificar Dockerfile
cat docker/Dockerfile
# Debe tener: FROM, WORKDIR, COPY, RUN, CMD
```

---

### SonarQube Quality Gate Falla

**Síntoma:** "Quality Gate failed"

**Solución:**
```bash
# 1. Ver qué pasó
# → GitLab pipeline → SonarQube gate job → link a dashboard

# 2. Problemas comunes:
# - Coverage < 80%: Agregar tests
# - Code smells: Refactorizar código
# - Security issues: Revisar logs de seguridad

# 3. Ejecutar sonar localmente
npm run sonar

# 4. Revisar reporte en SonarQube dashboard
# URL: https://sonarqube.crezcamos.com/dashboard?id=crezcamos_<lang>
```

---

## 📱 Comandos Útiles

### Git

```bash
# Ver ramas locales
git branch

# Ver ramas remotas
git branch -r

# Crear rama local y remotizar
git checkout -b feature/algo
git push origin feature/algo

# Ver historial de commits
git log --oneline -20

# Ver cambios sin stagear
git diff

# Ver cambios staged
git diff --staged

# Deshacer cambios locales
git checkout -- archivo.js

# Deshacer último commit (si no fue pushed)
git reset --soft HEAD~1

# Forzar descarga remota
git fetch origin
git reset --hard origin/develop
```

### npm

```bash
# Ver qué versión se instalará
npm info nombre-paquete

# Instalar versión específica
npm install paquete@1.2.3

# Actualizar todo
npm upgrade

# Actualizar package.json
npm update

# Ver qué está desactualizado
npm outdated

# Auditar seguridad
npm audit
npm audit fix
```

### Docker

```bash
# Build imagen
docker build -t crezcamos:v1 .

# Run contenedor
docker run -p 3000:8080 crezcamos:v1

# Ver imágenes
docker images

# Ver contenedores running
docker ps

# Ver contenedores todos
docker ps -a

# Logs de contenedor
docker logs <container-id>

# En el contenedor
docker exec -it <container-id> /bin/bash
```

### Kubernetes

```bash
# Ver clusters disponibles
kubectl config get-contexts

# Cambiar contexto
kubectl config use-context staging-cluster

# Ver recursos
kubectl get pods -n staging
kubectl get services -n staging
kubectl get deployments -n staging

# Ver detalles
kubectl describe pod <pod-name> -n staging

# Logs
kubectl logs <pod-name> -n staging
kubectl logs -f <pod-name> -n staging  # follow logs

# Port forward
kubectl port-forward <pod-name> 3000:8080 -n staging

# Ejecutar en pod
kubectl exec -it <pod-name> -n staging -- /bin/bash

# Ver eventos
kubectl get events -n staging

# Ver metrics (requiere metrics-server)
kubectl top nodes
kubectl top pod -n staging
```

---

## 💬 Contactos

### Equipo DevOps
- **Slack:** #crezcamos-devops
- **Lead:** [Nombre DevOps Lead]
- **Email:** devops@crezcamos.com

### Escalación
- **Crítico (down):** PagerDuty
- **Alto:** Slack #incidents
- **Normal:** Asignación en Jira

### Herramientas
- **GitLab:** https://gitlab.crezcamos.com
- **SonarQube:** https://sonarqube.crezcamos.com
- **Prometheus:** https://prometheus.crezcamos.com
- **Grafana:** https://grafana.crezcamos.com
- **Kubernetes Dashboard:** https://k8s-dashboard.crezcamos.com

---

## 🆘 Help

### Reportar Bug
1. Click en GitHub/GitLab issue
2. Title: `[BUG] Descripción corta`
3. Description: 
   - Pasos para reproducir
   - Comportamiento esperado
   - Comportamiento actual
   - Logs o screenshots

### Solicitar Feature
1. Click en GitHub/GitLab issue
2. Title: `[FEATURE] Descripción corta`
3. Description:
   - Por qué se necesita
   - Cómo mejoraría el producto
   - Propuesta de solución (opcional)

### Pedir Ayuda
- **Slack:** Pregunta en #crezcamos-devops
- **Weekly Standup:** Viernes 10:00 AM
- **Office Hours:** DevOps Lead disponible Miércoles 2:00 PM

---

## 📝 Notas Importantes

### ✅ Mejores Prácticas

1. **Commits claros**
   ```
   ✅ commit -m "feat: agregar endpoint de login"
   ❌ commit -m "cambios"
   ```

2. **Tests antes de push**
   ```bash
   npm test              # unit tests
   npm run lint         # code quality
   npm run build        # verificar build
   ```

3. **Pequeños PRs**
   - Máximo 400 líneas de cambios
   - 1-2 features por PR
   - Más fácil de revisar

4. **Rebasar antes de merge**
   ```bash
   git fetch origin
   git rebase origin/develop
   git push origin feature/mi-feature --force-with-lease
   ```

### ⚠️ Cosas Que Rompen Pipeline

- ❌ Secretos en código (API keys, passwords)
- ❌ Archivos muy grandes (> 100MB)
- ❌ Tests que fallan
- ❌ Coverage < 80%
- ❌ Code smells sin resolver
- ❌ Dependencias vulnerables (severity: critical)

### 🔒 Seguridad

- Nunca pusheár secretos: `git-secrets` instalado
- Usar variables de entorno: `.env.example`
- Revisar `npm audit` output
- Usar herramienta de secrets management

---

## 📚 Links Útiles

- **Documentación completa:** [README.md](README.md)
- **Guía monorepo:** [MONOREPO-MULTILANGUAGE-GUIDE.md](MONOREPO-MULTILANGUAGE-GUIDE.md)
- **Audit report:** [PROJECT-AUDIT-REPORT.md](PROJECT-AUDIT-REPORT.md)
- **Deployment checklist:** [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)
- **GitFlow reference:** https://nvie.com/posts/a-successful-git-branching-model/
- **Conventional Commits:** https://www.conventionalcommits.org/

---

**¿Preguntas?** Contacta al equipo en #crezcamos-devops 🚀

