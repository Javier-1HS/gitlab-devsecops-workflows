# 📋 CHECKLIST DE DEPLOYMENT
## Crezcamos CI/CD - Production Ready

**Fecha de Validación:** 29 de marzo de 2026  
**Versión:** 1.0.0

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 🔧 Infrastructure Setup

- [ ] **GCP Project Configurado**
  - [ ] Project ID: `crezcamos-prod`
  - [ ] Billing habilitado
  - [ ] APIs habilitadas: GKE, Container Registry, Cloud Logging, Cloud Monitoring

- [ ] **GKE Clusters Creados** (3 clusters)
  - [ ] `crezcamos-dev-cluster` (2-3 nodos e2-medium)
  - [ ] `crezcamos-staging-cluster` (2-3 nodos e2-standard-2)
  - [ ] `crezcamos-prod-cluster` (3-5 nodos e2-standard-4, multi-zona)

- [ ] **Service Accounts Configuradas**
  - [ ] SA en each cluster con permisos necesarios
  - [ ] JSON key file creado y codificado en base64
  - [ ] Enviado a GitLab como `GCP_SERVICE_ACCOUNT_KEY`

### 📚 GitLab Setup

- [ ] **Repository Creado**
  - [ ] GitLab instance self-managed disponible
  - [ ] Repo clonado: `proyecto-gitlab-cicd-crezcamos`
  - [ ] Permission model: GitFlow gobernado

- [ ] **GitLab Runner Instalado**
  - [ ] Runner registrado en GitLab
  - [ ] Docker executor habilitado
  - [ ] Tags: `docker`, `gcp`
  - [ ] Verificar con `gitlab-runner status`

- [ ] **Variables de CI/CD Configuradas**
  - [ ] GCP_PROJECT_ID
  - [ ] GCP_SERVICE_ACCOUNT_KEY (base64)
  - [ ] GCP_REGION
  - [ ] GKE_CLUSTER_* (3 vars)
  - [ ] DATABASE_URL_* (staging, prod)
  - [ ] API_KEY_* (staging, prod)
  - [ ] SONAR_HOST_URL
  - [ ] SONAR_TOKEN
  - [ ] SLACK_WEBHOOK_URL (opcional)

- [ ] **Protecciones de Branch**
  - [ ] `main`: Require MR, Require approval (2), Require status checks
  - [ ] `release`: Require MR, Require approval (1)
  - [ ] `develop`: Require MR (opcional pero recomendado)

### 🔐 Secrets Management

- [ ] **Google Secret Manager**
  - [ ] Secretos creados para DB, API keys
  - [ ] Permisos de lectura para service account
  - [ ] Rotación de secretos programada

- [ ] **Image Registry Secrets**
  - [ ] Docker registry secret en cada namespace
  - [ ] Credenciales actualizadas mensualmente

### 📦 Container Registry

- [ ] **GitLab Container Registry Habilitado**
  - [ ] Storage configurado
  - [ ] Cleanup policy habilitada
  - [ ] Keep last N images: 10
  - [ ] Remove images older than: 90 days

---

## ✅ KUBERNETES SETUP CHECKLIST

### 🎯 Development Cluster

- [ ] **Namespace Creado**
  ```bash
  kubectl create namespace development --context=dev-cluster
  ```

- [ ] **Service Account Creado**
  ```bash
  kubectl create serviceaccount crezcamos-sa -n development
  ```

- [ ] **RBAC Configurado**
  - [ ] ClusterRole con permisos deployment, service, configmap
  - [ ] RoleBinding a service account

- [ ] **Registry Secret Creado**
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=<registry> \
    --docker-username=<user> \
    --docker-password=<pass> \
    -n development
  ```

### 🔄 Staging Cluster

- [ ] **Namespace Creado**
  ```bash
  kubectl create namespace staging --context=staging-cluster
  ```

- [ ] **Service Account**
  - [ ] Service account creado
  - [ ] RBAC configurado
  - [ ] Registry secret creado

- [ ] **HPA Configurado**
  - [ ] Metrics-server instalado
  - [ ] HPA yaml aplicado

- [ ] **Monitoring**
  - [ ] Prometheus scraping enabled
  - [ ] Grafana dashboards creados

### 🏆 Production Cluster

- [ ] **Namespace Creado**
  ```bash
  kubectl create namespace production --context=prod-cluster
  ```

- [ ] **Service Account**
  - [ ] Service account creado
  - [ ] RBAC configurado (stricter)
  - [ ] Registry secret creado

- [ ] **Network Policies**
  - [ ] Default deny inbound
  - [ ] Allow only from ingress
  - [ ] Allow inter-pod communication

- [ ] **High Availability**
  - [ ] Pod Disruption Budgets (PDB)
  - [ ] Pod anti-affinity rules
  - [ ] Multiple zones enabled

- [ ] **Monitoring & Alerts**
  - [ ] Prometheus scraping enabled
  - [ ] Grafana dashboards prod
  - [ ] Alerts configured (CPU, Memory, Error rate)

---

## ✅ GITLAB CI/CD SETUP CHECKLIST

### 📊 Pipeline Configuration

- [ ] **Main Pipeline Functions**
  - [ ] `detect-project-type` job ejecuta primero
  - [ ] Templates incluidos correctamente
  - [ ] Rules funcionan para each branch

- [ ] **Develop Branch Pipeline**
  - [ ] Secret scanning ✅
  - [ ] Dependency check ✅
  - [ ] Unit tests ✅
  - [ ] Build ✅
  - [ ] Vulnerability scan ✅
  - [ ] Deploy to DEV ✅
  - [ ] Health check ✅

- [ ] **Release Branch Pipeline**
  - [ ] All dev pipeline steps
  - [ ] Manual QA approval gate ✅
  - [ ] Deploy to STAGING ✅
  - [ ] E2E tests ✅
  - [ ] Smoke tests ✅

- [ ] **Main Branch Pipeline**
  - [ ] All release pipeline steps
  - [ ] Manual technical lead approval ✅
  - [ ] Manual change committee approval ✅
  - [ ] Create release tag ✅
  - [ ] Blue-Green deploy ✅
  - [ ] Production smoke tests ✅
  - [ ] Traffic switch approval ✅
  - [ ] Cleanup blue ✅

### 🔍 Verify Pipeline Execution

- [ ] **Test Push a Develop**
  ```bash
  git checkout develop
  git commit --allow-empty -m "test: pipeline trigger"
  git push origin develop
  
  # Esperar pipeline completado
  # Verificar: Deploy to DEV completed
  # Verificar: Health check passed
  ```

- [ ] **Test Release**
  ```bash
  git checkout release
  git commit --allow-empty -m "test: release pipeline"
  git push origin release
  
  # Esperar pipeline completado
  # Aprobar manual gates
  # Verificar: Deploy to STAGING completed
  ```

- [ ] **Test Production (en staging first)**
  ```bash
  # En rama main
  git commit --allow-empty -m "test: production pipeline"
  git push origin main
  
  # Esperar hasta antes del traffic switch
  # Verificar all smoke tests passed
  # Manual approve traffic switch
  ```

---

## ✅ TESTING CONFIGURATION CHECKLIST

### 🧪 Unit Tests

- [ ] **Framework Setup**
  - [ ] Jest (TypeScript/Angular) `npm test`
  - [ ] JUnit (Java/Maven) `mvn test`
  - [ ] pytest (Python) `pytest tests/`
  - [ ] Flutter tests `flutter test`

- [ ] **Coverage Thresholds**
  - [ ] Statements >= 80%
  - [ ] Branches >= 75%
  - [ ] Functions >= 80%
  - [ ] Lines >= 80%

### 🔗 Integration Tests

- [ ] **Database Setup**
  - [ ] Test database creado
  - [ ] Migrations up to date
  - [ ] Fixtures/seeds creados

- [ ] **Services**
  - [ ] Mock/test services configurados
  - [ ] Test data populated

### 🎯 E2E Tests

- [ ] **Cypress Setup**
  - [ ] `cypress.config.js` configurado
  - [ ] Test specs creados: `cypress/e2e/**/*.cy.js`
  - [ ] Base URL: `http://localhost:3000`

- [ ] **Common Flows**
  - [ ] Login flow
  - [ ] Create resource
  - [ ] Edit resource
  - [ ] Delete resource
  - [ ] Search/Filter

### ⚡ Performance Tests

- [ ] **k6 Load Tests**
  - [ ] `scripts/performance/load-test.js` actualizado
  - [ ] Base URL configurable
  - [ ] Thresholds sensatos

---

## ✅ SECURITY CHECKLIST

### 🔐 Secret Management

- [ ] **No Secrets in Code**
  - [ ] `.env*` files in `.gitignore`
  - [ ] Credential rotation policy
  - [ ] Secret scanning enabled

- [ ] **Secret Rotation Schedule**
  - [ ] Database passwords: 90 days
  - [ ] API keys: 30 days
  - [ ] Service account keys: 90 days
  - [ ] GitLab token: 6 months (or sooner)

### 🛡️ Image Security

- [ ] **Dockerfile Best Practices**
  - [ ] Non-root user
  - [ ] Read-only root filesystem
  - [ ] No secrets in image
  - [ ] Minimal base image
  - [ ] Health check included

- [ ] **Trivy Scanning**
  - [ ] Run on all images: `trivy image <image>`
  - [ ] Critical severity fails pipeline
  - [ ] High severity warning

### 🔍 Code Security

- [ ] **SonarQube Quality Gate**
  - [ ] Created project: `crezcamos`
  - [ ] Quality profile assigned
  - [ ] Issues reviewed and cleared
  - [ ] Coverage report linked

- [ ] **Dependency Audit**
  - [ ] `npm audit` configured
  - [ ] Moderate level warning
  - [ ] Packages updated regularly

---

## ✅ MONITORING & ALERTING CHECKLIST

### 📊 Prometheus Setup

- [ ] **Scrape Targets**
  - [ ] Prometheus deployed en GKE
  - [ ] ServiceMonitor creado
  - [ ] Scrape interval: 30s
  - [ ] Targets: `/metrics` en cada pod

### 📈 Grafana Dashboards

- [ ] **Dashboards Creados**
  - [ ] CPU/Memory usage
  - [ ] Request rate
  - [ ] Error rate
  - [ ] Latency (p50, p95, p99)
  - [ ] Pod restarts

### 🚨 Alert Rules

- [ ] **Critical Alerts**
  - [ ] CPU > 80% for 5 min → PagerDuty
  - [ ] Memory > 85% for 5 min → PagerDuty
  - [ ] Error rate > 5% for 2 min → Slack

- [ ] **Warning Alerts**
  - [ ] CPU > 70% for 10 min → Slack
  - [ ] Memory > 75% for 10 min → Slack
  - [ ] Requests > 1000/min → Slack

### 📝 Logging

- [ ] **Cloud Logging Configured**
  - [ ] Sink creado: `gcloud logging sinks create`
  - [ ] Exclusion filters configuradas
  - [ ] Log queries probadas (liveness, errors)

---

## ✅ DOCUMENTATION CHECKLIST

- [ ] **README.md**
  - [ ] Actualizado con instrucciones
  - [ ] Links corregidos
  - [ ] Diagrama arquitectura
  - [ ] Troubleshooting sections

- [ ] **MONOREPO-MULTILANGUAGE-GUIDE.md**
  - [ ] Ejemplos funcionales
  - [ ] Setup instructions

- [ ] **PROJECT-AUDIT-REPORT.md**
  - [ ] Checklist completado
  - [ ] Firmas/aprobaciones

- [ ] **Runbooks**
  - [ ] Incident response procedures
  - [ ] Escalation contacts
  - [ ] Rollback procedures

---

## ✅ OPERATIONAL READINESS

### 👥 Team Preparation

- [ ] **On-Call Schedule**
  - [ ] Primary on-call assigned
  - [ ] Secondary on-call assigned
  - [ ] Escalation policy defined

- [ ] **Training**
  - [ ] Team trained on CI/CD
  - [ ] Team trained on rollback procedures
  - [ ] Team trained on incident response

- [ ] **Documentation Reviewed**
  - [ ] All team members reviewed README
  - [ ] All team members reviewed troubleshooting
  - [ ] All team members know contacts

### 📞 Support Contacts

- [ ] **Escalation Chain**
  - [ ] Primary: DevOps engineer contact
  - [ ] Secondary: Lead engineer contact
  - [ ] Tertiary: Manager contact
  - [ ] Emergency: CTO contact

- [ ] **Communication Channels**
  - [ ] Slack channel: #crezcamos-devops
  - [ ] Email: devops@crezcamos.com
  - [ ] Incident channel: #incidents
  - [ ] Status page (if applicable)

---

## ✅ FINAL VALIDATION

### 🎯 Production Readiness Gate

- [ ] All boxes above checked ✅
- [ ] Security review passed ✅
- [ ] Performance benchmarks passed ✅
- [ ] Load testing completed ✅
- [ ] Failover testing completed ✅
- [ ] Rollback testing completed ✅
- [ ] Team sign-off obtained ✅

### 📊 Final Sign-Off

- [ ] **Technical Lead Review**
  - [ ] Date: _____________
  - [ ] Signature: _____________
  - [ ] Comments: _____________

- [ ] **Operations Review**
  - [ ] Date: _____________
  - [ ] Signature: _____________
  - [ ] Comments: _____________

- [ ] **Security Review**
  - [ ] Date: _____________
  - [ ] Signature: _____________
  - [ ] Comments: _____________

---

## 📅 Post-Deployment Tasks

### Day 1 (Deployment Day)
- [ ] Monitor all pipelines
- [ ] Verify all services healthy
- [ ] Test manual processes
- [ ] Monitor error rates

### Day 1-7 (First Week)
- [ ] Monitor all metrics
- [ ] Respond to any alerts
- [ ] Document any issues
- [ ] Prepare day-2 improvements

### Week 2-4 (First Month)
- [ ] Review logs and metrics
- [ ] Optimize performance
- [ ] Update documentation
- [ ] Train additional team members

### Month 2+ (Ongoing)
- [ ] Regular maintenance
- [ ] Dependency updates
- [ ] Security patches
- [ ] Capacity planning

---

**Nota:** Este checklist debe completarse antes de considerar el sistema listo para producción.

**Última actualización:** 29 de marzo de 2026

