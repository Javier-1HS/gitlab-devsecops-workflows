# 📊 GUÍA DE CONFIGURACIÓN DE MONITOREO
## Prometheus, Grafana y Alertas para Crezcamos

**Versión:** 1.0.0  
**Fecha:** 29 de marzo de 2026  
**Tiempo estimado:** 4-5 horas

---

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Instalación de Prometheus](#instalación-de-prometheus)
3. [Instalación de Grafana](#instalación-de-grafana)
4. [Configuración de Alertas](#configuración-de-alertas)
5. [Google Cloud Logging](#google-cloud-logging)
6. [Dashboards](#dashboards)
7. [Validación](#validación)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Configuración Inicial

### Prerrequisitos

- ✅ 3 clusters GKE funcionando (dev/staging/prod)
- ✅ kubectl configurado con acceso a los 3 clusters
- ✅ Helm 3+ instalado
- ✅ Espacio en disco: mínimo 50GB para almacenamiento de métricas
- ✅ Memoria disponible: mínimo 4GB por cluster para monitoring stack

### Crear namespaces de monitoreo

```bash
# En cada cluster

# DEV
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster
kubectl create namespace monitoring
kubectl label namespace monitoring name=monitoring

# STAGING
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl create namespace monitoring
kubectl label namespace monitoring name=monitoring

# PROD
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster
kubectl create namespace monitoring
kubectl label namespace monitoring name=monitoring

# Verificar
kubectl get namespaces --show-labels
```

### Agregar repositorios Helm

```bash
# Agregar repositorio Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Agregar repositorio Grafana
helm repo add grafana https://grafana.github.io/helm-charts

# Actualizar caché de repos
helm repo update

# Verificar repos
helm repo list
```

---

## 📈 Instalación de Prometheus

### Paso 1: Crear valores personalizados para Prometheus

```bash
# Crear archivo de valores
cat > prometheus-values.yaml <<'EOF'
# Prometheus Server Configuration
prometheus:
  prometheusSpec:
    # Retention de datos
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
    
    # Resources
    resources:
      requests:
        cpu: 500m
        memory: 2Gi
      limits:
        cpu: 2
        memory: 4Gi
    
    # Service Monitor Selector
    serviceMonitorSelectorNilUsesHelmValues: false
    
    # Pod Monitor Selector
    podMonitorSelectorNilUsesHelmValues: false

# Alertmanager Configuration
alertmanager:
  enabled: true
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi

# Node Exporter
nodeExporter:
  enabled: true

# Kube State Metrics
kubeStateMetrics:
  enabled: true

# Prometheus Node Exporter
prometheus-node-exporter:
  hostNetwork: true

# Grafana
grafana:
  enabled: false  # Lo instalaremos por separado

EOF

cat prometheus-values.yaml
```

### Paso 2: Instalar Prometheus Stack (DEV)

```bash
# Cambiar a DEV cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster

# Instalar Prometheus Stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f prometheus-values.yaml

# Verificar instalación
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Esperar a que todos los pods estén ready (2-3 minutos)
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus -n monitoring --timeout=300s
```

### Paso 3: Instalar Prometheus Stack (STAGING)

```bash
# Cambiar a STAGING cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-staging-cluster

# Instalar Prometheus Stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f prometheus-values.yaml

# Verificar
kubectl get pods -n monitoring
```

### Paso 4: Instalar Prometheus Stack (PROD)

```bash
# Cambiar a PROD cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster

# Instalar Prometheus Stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f prometheus-values.yaml

# Verificar
kubectl get pods -n monitoring
```

### Paso 5: Configurar Service Monitors

```bash
# Crear ServiceMonitor para aplicaciones
cat > servicemonitor.yaml <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: crezcamos-app
  namespace: monitoring
  labels:
    app: crezcamos
spec:
  selector:
    matchLabels:
      app: crezcamos
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
EOF

# Aplicar en cada cluster
kubectl apply -f servicemonitor.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-dev-cluster
kubectl apply -f servicemonitor.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl apply -f servicemonitor.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-prod-cluster

# Verificar
kubectl get servicemonitor -n monitoring --all-contexts
```

---

## 📊 Instalación de Grafana

### Paso 1: Crear valores personalizados para Grafana

```bash
# Crear archivo de valores
cat > grafana-values.yaml <<'EOF'
# Grafana Admin Password
adminPassword: ChangeMe123!@

# Persistence
persistence:
  enabled: true
  size: 10Gi
  accessModes:
    - ReadWriteOnce

# Resources
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 200m
    memory: 256Mi

# Service
service:
  type: LoadBalancer
  port: 3000

# Data sources
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus-stack-prometheus:9090
      access: proxy
      isDefault: true

# Dashboards provisioning
dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      editable: true
      options:
        path: /var/lib/grafana/dashboards/default

EOF

cat grafana-values.yaml
```

### Paso 2: Instalar Grafana (DEV)

```bash
# Cambiar a DEV cluster
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-dev-cluster

# Instalar Grafana
helm install grafana grafana/grafana \
  -n monitoring \
  -f grafana-values.yaml

# Obtener LoadBalancer IP
kubectl get svc -n monitoring -w

# Esperar a que tenga IP externa (EXTERNAL-IP no será <pending>)
```

### Paso 3: Instalar Grafana (STAGING y PROD)

```bash
# STAGING
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
helm install grafana grafana/grafana \
  -n monitoring \
  -f grafana-values.yaml
kubectl get svc -n monitoring

# PROD
kubectl config use-context gke_crezcamos-prod_us-central1_crezcamos-prod-cluster
helm install grafana grafana/grafana \
  -n monitoring \
  -f grafana-values.yaml
kubectl get svc -n monitoring
```

### Paso 4: Acceder a Grafana

```bash
# Obtener IP externa (esperar a que salga)
GRAFANA_IP=$(kubectl get svc grafana -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Grafana: http://$GRAFANA_IP:3000"

# Credenciales por defecto:
# Usuario: admin
# Password: [la que especificaste en grafana-values.yaml]

# Cambiar password una vez logueado
```

---

## 🚨 Configuración de Alertas

### Paso 1: Crear reglas de alerta

```bash
# Crear PrometheusRule para alertas
cat > prometheus-rules.yaml <<'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: crezcamos-alerts
  namespace: monitoring
spec:
  groups:
  - name: crezcamos.rules
    interval: 30s
    rules:
    # CPU Usage Alert
    - alert: HighCPUUsage
      expr: sum(rate(container_cpu_usage_seconds_total[5m])) by (pod, namespace) > 0.8
      for: 5m
      labels:
        severity: warning
        alertgroup: performance
      annotations:
        summary: "High CPU usage detected"
        description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} has CPU usage > 80%"

    # Memory Usage Alert
    - alert: HighMemoryUsage
      expr: sum(container_memory_usage_bytes) by (pod, namespace) / sum(container_spec_memory_limit_bytes) by (pod, namespace) > 0.85
      for: 5m
      labels:
        severity: warning
        alertgroup: performance
      annotations:
        summary: "High memory usage detected"
        description: "Pod {{ $labels.pod }} has memory usage > 85%"

    # Pod Restart Alert
    - alert: PodRestarting
      expr: rate(kube_pod_container_status_restarts_total[1h]) > 0
      for: 5m
      labels:
        severity: critical
        alertgroup: stability
      annotations:
        summary: "Pod is restarting frequently"
        description: "Pod {{ $labels.pod }} in {{ $labels.namespace }} has restarted"

    # Node Not Ready Alert
    - alert: NodeNotReady
      expr: kube_node_status_condition{condition="Ready", status="true"} == 0
      for: 5m
      labels:
        severity: critical
        alertgroup: infrastructure
      annotations:
        summary: "Kubernetes Node not ready"
        description: "Node {{ $labels.node }} is not ready"

    # Deployment Replicas Alert
    - alert: DeploymentReplicasMismatch
      expr: kube_deployment_spec_replicas != kube_deployment_status_replicas_updated
      for: 10m
      labels:
        severity: warning
        alertgroup: deployment
      annotations:
        summary: "Deployment replicas mismatch"
        description: "Deployment {{ $labels.deployment }} in {{ $labels.namespace }} has replica mismatch"

    # PVC Usage Alert
    - alert: PersistentVolumeAlmostFull
      expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.8
      for: 5m
      labels:
        severity: warning
        alertgroup: storage
      annotations:
        summary: "PVC almost full"
        description: "PVC {{ $labels.persistentvolumeclaim }} is {{ $value | humanizePercentage }} full"

EOF

# Aplicar en cada cluster
kubectl apply -f prometheus-rules.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-dev-cluster
kubectl apply -f prometheus-rules.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl apply -f prometheus-rules.yaml -n monitoring --context=gke_crezcamos-prod_us-central1_crezcamos-prod-cluster

# Verificar
kubectl get prometheusrule -n monitoring --all-contexts
```

### Paso 2: Configurar Alertmanager

```bash
# Crear ConfigMap de Alertmanager
cat > alertmanager-config.yaml <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: monitoring
data:
  config.yaml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

    route:
      receiver: 'default'
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 12h
      routes:
      - match:
          severity: critical
        receiver: 'critical'
        continue: true
        group_wait: 10s
        group_interval: 1m
        repeat_interval: 1h

    receivers:
    - name: 'default'
      slack_configs:
      - channel: '#alerts-general'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

    - name: 'critical'
      slack_configs:
      - channel: '#alerts-critical'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
      pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
        description: '{{ .GroupLabels.alertname }}'

EOF

# Aplicar en cada cluster
kubectl apply -f alertmanager-config.yaml --context=gke_crezcamos-prod_us-central1_crezcamos-dev-cluster
kubectl apply -f alertmanager-config.yaml --context=gke_crezcamos-prod_us-central1_crezcamos-staging-cluster
kubectl apply -f alertmanager-config.yaml --context=gke_crezcamos-prod_us-central1_crezcamos-prod-cluster
```

**IMPORTANTE:** Reemplaza `YOUR/SLACK/WEBHOOK` y `YOUR_PAGERDUTY_KEY` con credenciales reales.

### Paso 3: Conectar Alertmanager a Prometheus

```bash
# Editar Prometheus Deployment para apuntar a Alertmanager
kubectl edit deployment prometheus-stack-prometheus -n monitoring

# Agregar en la sección alerting:
# alertmanagers:
# - static_configs:
#   - targets:
#     - alertmanager:9093
```

---

## ☁️ Google Cloud Logging

### Paso 1: Habilitar Cloud Logging API

```bash
# Ya debería estar habilitada, pero verificar:
gcloud services list --enabled | grep logging

# Si no está, habilitarla:
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
```

### Paso 2: Configurar Cloud Logging Integration

```bash
# Los clusters GKE ya envían logs automáticamente a Cloud Logging
# Verificar en GCP Console:
# Logging → Logs Explorer

# Crear Log Filter para ver logs de Crezcamos
# resource.type="k8s_container"
# resource.labels.namespace_name=("development" OR "staging" OR "production")
# resource.labels.pod_name=~"crezcamos-.*"
```

### Paso 3: Crear Log Sink para almacenamiento largo plazo

```bash
# Crear bucket de Cloud Storage
gsutil mb gs://crezcamos-logs-archive

# Crear sink para logs de producción
gcloud logging sinks create crezcamos-prod-sink \
  storage.googleapis.com/crezcamos-logs-archive \
  --log-filter='resource.type="k8s_container" AND resource.labels.namespace_name="production"'

# Verificar sink
gcloud logging sinks list
```

### Paso 4: Crear Log-based Metrics

```bash
# Métrica: Errores en logs de aplicación
gcloud logging metrics create app_errors \
  --description="Count of ERROR level logs from application" \
  --log-filter='severity="ERROR" AND resource.type="k8s_container"'

# Métrica: Requests por segundo
gcloud logging metrics create request_rate \
  --description="HTTP request rate" \
  --log-filter='httpRequest.status>=200'

# Verificar
gcloud logging metrics list
```

---

## 📈 Dashboards

### Paso 1: Dashboard de Infraestructura

```bash
# En Grafana, ir a:
# Dashboards → New → Import

# Importar dashboard ID: 1860 (Node Exporter for Prometheus)
# O crear uno personalizado con:

cat > infra-dashboard.json <<'EOF'
{
  "dashboard": {
    "title": "Crezcamos Infrastructure",
    "panels": [
      {
        "title": "CPU Usage by Cluster",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total[5m])) by (cluster)"
          }
        ]
      },
      {
        "title": "Memory Usage by Cluster",
        "targets": [
          {
            "expr": "sum(container_memory_usage_bytes) by (cluster)"
          }
        ]
      },
      {
        "title": "Pod Status",
        "targets": [
          {
            "expr": "sum(kube_pod_status_phase) by (phase)"
          }
        ]
      },
      {
        "title": "Node Status",
        "targets": [
          {
            "expr": "sum(kube_node_status_condition{condition=\"Ready\"}) by (status)"
          }
        ]
      }
    ]
  }
}
EOF
```

### Paso 2: Dashboard de Aplicación

```bash
# Crear panel para aplicaciones Crezcamos
# Datasource: Prometheus
# Métricas importantes:
# - rate(http_requests_total[5m])
# - histogram_quantile(0.95, http_request_duration_seconds)
# - deployment_replicas{deployment=~"crezcamos-.*"}
```

### Paso 3: Dashboard de Alertas

```bash
# En Grafana:
# Dashboards → Manage → New
# Agregar panel tipo "Alertlist"
# Mostrar alertas de última hora
# Filtrar por ambiente (dev/staging/prod)
```

---

## ✅ Validación

### Test 1: Verificar Prometheus scrape

```bash
# Port-forward a Prometheus
kubectl port-forward svc/prometheus-stack-prometheus 9090:9090 -n monitoring

# Abrir en navegador: http://localhost:9090

# Verificar targets: Status → Targets
# Todos deberían estar "Up"
```

### Test 2: Verificar Grafana datasource

```bash
# Ir a Grafana (http://$GRAFANA_IP:3000)
# Configuration → Data Sources
# Verificar que Prometheus esté como "Up"
```

### Test 3: Probar alerta

```bash
# Crear un pod con alto CPU
kubectl run stress-test --image=polinux/stress \
  --requests=cpu=500m \
  --limits=cpu=500m \
  -- stress --cpu 4 -t 10m

# Esperar 5 minutos
# Debería generar alert "HighCPUUsage"

# Ver alerta en Alertmanager:
kubectl port-forward svc/prometheus-stack-alertmanager 9093:9093 -n monitoring
# Acceder a: http://localhost:9093
```

### Test 4: Validar Google Cloud Logging

```bash
# En GCP Console:
# Logging → Logs Explorer

# Ejecutar query:
# resource.type="k8s_container"
# resource.labels.cluster_name=("crezcamos-dev-cluster" OR "crezcamos-staging-cluster" OR "crezcamos-prod-cluster")

# Deberías ver logs de los clusters
```

---

## 🔍 Troubleshooting

### Prometheus no scrape targets

```bash
# Verificar ServiceMonitor está en el mismo namespace
kubectl get servicemonitor -n monitoring

# Verificar labels coincidan
kubectl get svc -n development --show-labels

# Verificar Prometheus config
kubectl logs -l app.kubernetes.io/name=prometheus -n monitoring | grep -i "scrape\|target"

# Recargar Prometheus
kubectl rollout restart deployment prometheus-stack-prometheus -n monitoring
```

### Grafana no conecta a Prometheus

```bash
# Verificar DNS desde Grafana
kubectl exec -n monitoring deployment/grafana -- nslookup prometheus-stack-prometheus

# Verificar conectividad
kubectl exec -n monitoring deployment/grafana -- curl http://prometheus-stack-prometheus:9090/-/healthy

# Ver logs de Grafana
kubectl logs -n monitoring deployment/grafana
```

### Alertas no se envían

```bash
# Verificar PrometheusRule
kubectl get prometheusrule -n monitoring
kubectl describe prometheusrule crezcamos-alerts -n monitoring

# Verificar Alertmanager config
kubectl get cm -n monitoring
kubectl describe cm alertmanager-config -n monitoring

# Ver logs de Alertmanager
kubectl logs -n monitoring alertmanager-stack-alertmanager-0

# Probar webhook de test
curl -X POST http://alertmanager-url:9093/api/v1/alerts
```

### PV lleno (Prometheus retiene muchos datos)

```bash
# Verificar uso de PV
kubectl exec -n monitoring prometheus-stack-prometheus-0 -- du -sh /prometheus

# Reducir retention period
kubectl edit prometheus prometheus-stack-prometheus -n monitoring
# Cambiar: retention: 30d -> retention: 15d

# O aumentar PV size
kubectl patch pvc prometheus-stack-prometheus-db-prometheus-stack-prometheus-0 -n monitoring \
  -p '{"spec":{"resources":{"requests":{"storage":"200Gi"}}}}'
```

---

## 📊 Métricas Clave a Monitorear

| Métrica | Umbral Alerta | Descripción |
|---------|--------------|-------------|
| CPU Usage | > 80% | Uso de CPU del contenedor |
| Memory Usage | > 85% | Memoria usada vs límite |
| Pod Restarts | > 0 en 1h | Container se reinicia frecuentemente |
| Node Ready | < 1 | Nodo no está listo |
| Deployment Replicas | Mismatch | Replicas no coinciden |
| PVC Usage | > 80% | Almacenamiento casi lleno |
| Request Latency | p95 > 1000ms | Latencia de requests |
| Error Rate | > 1% | Porcentaje de requests con error |

---

## 🔗 Acceso a herramientas

```bash
# Obtener LoadBalancer IPs
kubectl get svc -n monitoring --all-contexts

# Grafana:
http://<GRAFANA-IP>:3000

# Prometheus:
kubectl port-forward svc/prometheus-stack-prometheus 9090:9090 -n monitoring
http://localhost:9090

# Alertmanager:
kubectl port-forward svc/prometheus-stack-alertmanager 9093:9093 -n monitoring
http://localhost:9093
```

---

## ✅ Checklist Final

- [ ] Prometheus instalado en 3 clusters
- [ ] Prometheus scrapeando targets exitosamente
- [ ] Grafana instalado en 3 clusters
- [ ] Grafana conectado a Prometheus
- [ ] PrometheusRules configuradas
- [ ] Alertmanager configurado con Slack/PagerDuty
- [ ] Google Cloud Logging habilitado
- [ ] Logs llegando a Cloud Logging
- [ ] Log Sinks configurados
- [ ] Dashboards creados y funcionando
- [ ] Alertas testeadas exitosamente
- [ ] Métricas custom configuradas

---

## 📚 Documentos Relacionados

- [Instalación de Infraestructura](instalacion-infraestructura.md)
- [Configuración de Pipelines](configuracion-pipelines.md)
- [DEPLOYMENT-CHECKLIST.md](../DEPLOYMENT-CHECKLIST.md)

---

**Documento:** configuracion-monitoreo.md  
**Versión:** 1.0.0  
**Última actualización:** 29 de marzo de 2026
