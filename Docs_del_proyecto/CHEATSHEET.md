# ⚡ CHEAT SHEET - GitLab CI/CD Commands
## Quick Reference for Common Tasks

**Print this sheet and keep it at your desk!**

---

## 🔄 GIT WORKFLOW

### Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

### Push Changes
```bash
git add .
git commit -m "feat: description"
git push origin feature/my-feature
```

### Merge to Develop (via GitLab)
1. Create Merge Request (MR)
2. Wait for pipeline ✅
3. Get approval ✅
4. Click "Merge when pipeline succeeds"

### Create Release
```bash
git checkout -b release/v1.2.0 origin/develop
git push origin release/v1.2.0
# Create MR → develop
```

### Merge to Main
```bash
git checkout main
git pull origin main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags
```

---

## 🧪 LOCAL TESTING

### Install Dependencies
```bash
npm install
```

### Run Tests
```bash
# All tests
npm test

# Specific test file
npm test -- tests/unit/mytest.spec.js

# With coverage
npm test -- --coverage

# E2E (requires app running)
npm run test:e2e

# Watch mode
npm test -- --watch
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Build
```bash
npm run build
```

### Start App
```bash
npm run dev      # Development
npm start        # Production
```

### Docker Build
```bash
docker build -t crezcamos:local .
docker run -p 3000:8080 crezcamos:local
```

---

## 📊 MONITORING PIPELINE

### View Pipeline
```
GitLab → Project → CI/CD → Pipelines → [Your MR]
```

### Check Job Logs
```
Click job name → View full logs
```

### Common Job Names
```
detect-project-type  # First job
secret-scanning      # Security
dependency-check     # Security
container-scan       # Security
unit-tests           # Testing
integration-tests    # Testing
docker-build         # Build
deploy-to-dev        # Deployment
deploy-to-staging    # Deployment
```

---

## ☸️ KUBERNETES COMMANDS

### Check Cluster
```bash
# Which cluster?
kubectl config current-context

# Switch cluster
kubectl config use-context dev-cluster
kubectl config use-context staging-cluster
kubectl config use-context prod-cluster
```

### See Resources
```bash
# Pods
kubectl get pods -n development
kubectl get pods -n staging
kubectl get pods -n production

# Detailed pod info
kubectl describe pod <pod-name> -n development

# Logs (live)
kubectl logs -f <pod-name> -n staging
```

### Test Deployment
```bash
# Port forward
kubectl port-forward <pod-name> 3000:8080 -n staging

# Bash into pod
kubectl exec -it <pod-name> -n staging -- /bin/bash

# Check events
kubectl get events -n staging --sort-by='.lastTimestamp'
```

### Manual Deployment (if needed)
```bash
# Apply manifest
kubectl apply -f infrastructure/kubernetes/apps/dev/deployment.yaml -n development

# Rollout status
kubectl rollout status deployment/crezcamos -n development

# Scale manually
kubectl scale deployment crezcamos --replicas=3 -n staging
```

---

## 🐛 TROUBLESHOOTING

### Pipeline Says "Not Detected"
```bash
# Check these files exist:
ls pom.xml                    # Spring Boot
ls angular.json               # Angular
ls pubspec.yaml               # Flutter
ls tsconfig.json              # TypeScript
```

### Tests Failing Locally
```bash
# Clear cache
rm -rf node_modules
npm install
npm test
```

### Git Merge Conflicts
```bash
# Start rebase
git fetch origin
git rebase origin/develop

# Edit files with "<<<", "===", ">>>" marks
# Then continue
git add .
git rebase --continue

# Or cancel if needed
git rebase --abort
```

### Docker Build Fails
```bash
# Check Dockerfile syntax
cat docker/Dockerfile

# Test build locally
docker build -t test:local .

# Check logs for errors
docker logs <container-id>
```

### Pod Crashes
```bash
# See why
kubectl describe pod <pod-name> -n staging

# Check logs
kubectl logs <pod-name> -n staging

# Check previous logs (after crash)
kubectl logs <pod-name> -n staging --previous
```

---

## 🔐 SECURITY CHECKS

### Local Security Audit
```bash
# Check for secrets
npm audit
npm audit fix

# Lint for issues
npm run lint
```

### Manual Trivy Scan
```bash
# Scan image
trivy image crezcamos:v1.0.0

# Scan with severity filter
trivy image --severity HIGH,CRITICAL crezcamos:v1.0.0
```

---

## 📱 TEAM COMMUNICATION

### Slack Channels
```
#crezcamos-devops        → General questions
#incidents               → Ops on-call issues
#releases                → Release announcements
```

### Report Issue
```
Slack → #crezcamos-devops → @DevOps → Describe issue → Attach logs
```

### Escalate Critical Issue
```
Slack → @on-call-engineer
On-call emoji: 🚨 for critical
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Before Pushing
- [ ] `npm test` passes locally
- [ ] `npm run lint` shows no errors
- [ ] `npm run build` succeeds
- [ ] No secrets in code (check: no `API_KEY=`, no `password=`)
- [ ] `.env` files in `.gitignore`

### Before Deploy
- [ ] MR description is clear
- [ ] All reviewers approved
- [ ] All pipeline jobs ✅
- [ ] Code coverage >= 80%
- [ ] No SonarQube blocking issues

### Production Release
- [ ] Release notes written
- [ ] Tag created
- [ ] Change log updated
- [ ] Team notified
- [ ] On-call ready

---

## ⏰ RESPONSE TIMES

```
Typical Pipeline Execution:
DEV      → 5-10 min
STAGING  → 15-20 min (+ QA time)
PROD     → 30-60 min (+ approval gates)

If stuck/slow:
0-2 min   → Probably queued, wait
2-5 min   → Check if installing deps
5-10 min  → Probably running tests
10+ min   → Check logs for errors
20+ min   → Probably building image
```

---

## 🆘 EMERGENCY COMMANDS

### Roll Back Production
```bash
# Only if critical issue!
kubectl rollout undo deployment/crezcamos -n production
kubectl rollout status deployment/crezcamos -n production

# Notify team immediately:
# Slack → #incidents: "[ROLLBACK] Rolled back due to [REASON]"
```

### Kill Stuck Pipeline Job
```
GitLab → Pipeline → Job → Click "Cancel"
(Takes up to 10 seconds to stop)
```

### Force Push (Only on Feature Branches!)
```bash
# After rebase
git push origin feature/my-feature --force-with-lease

# Never do this on develop/release/main!
```

---

## 📞 QUICK CONTACTS

```
DevOps Lead:    slack @devops
On-Call:        slack @on-call-engineer (🚨 for urgent)
Main Channel:   #crezcamos-devops
Emergency:      PagerDuty (if escalated)
```

---

## 📚 FULL DOCUMENTATION

| Quick Question | Read This |
|---|---|
| How do I deploy? | [QUICK-START.md](QUICK-START.md) |
| Pipeline is broken | [QUICK-START.md#troubleshooting](QUICK-START.md#troubleshooting-común) |
| What's the architecture? | [ARCHITECTURE.md](ARCHITECTURE.md) |
| I'm a new developer | [README.md](README.md) |
| Kubernetes stuff | [README.md#kubernetes](README.md) |
| Many questions? | [INDEX.md](INDEX.md) |

---

## 🎯 ONE-MINUTE SUMMARY

```
1. Create branch:              git checkout -b feature/xyz
2. Make changes + test:        npm test
3. Commit + push:              git push origin feature/xyz
4. Create MR (GitLab)          → Add title + description
5. Wait for pipeline:          See status in GitLab
6. Get approval:               Click "Approve"
7. Merge:                      Click "Merge when pipeline succeeds"
8. Done! ✅                    DEV auto-updated

Staging/Prod: Repeat steps 1-7 but to release/main branches
```

---

**Print this! Keep it handy!**

```
╔═════════════════════════════════════╗
║   Stuck?  Slack #crezcamos-devops   ║
║   Urgent? @on-call-engineer 🚨     ║
║   Docs?   Index.md or README.md     ║
╚═════════════════════════════════════╝
```

---

*Last updated: March 29, 2026*  
*Keep this cheat sheet current by updating examples*

