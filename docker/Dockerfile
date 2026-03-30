# Stage 1: Build Stage (dependencies y compilación)
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Ejecutar build si es necesario (compilar TypeScript, etc.)
RUN npm run build || true

# Stage 2: Production Stage (imagen final optimizada)
FROM node:18-alpine

# Metadatos
LABEL maintainer="Crezcamos CI/CD Team <cicd@crezcamos.com>"
LABEL version="1.0"
LABEL description="Aplicación Crezcamos - Despliegue en GKE"

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Labels para metadatos
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.vcs-ref=$VCS_REF
LABEL org.label-schema.version=$VERSION

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV LOG_LEVEL=warn
ENV PORT=8080

# Crear usuario no-root
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias del builder
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules

# Copiar package.json
COPY --chown=appuser:appuser package*.json ./

# Copiar código compilado
COPY --chown=appuser:appuser --from=builder /app/dist ./dist
COPY --chown=appuser:appuser --from=builder /app/src ./src

# Copiar archivos de configuración
COPY --chown=appuser:appuser config ./config
COPY --chown=appuser:appuser public ./public || true

# Crear directorio para logs
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Cambiar a usuario no-root
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Exponer puerto
EXPOSE 8080 9090

# Comando por defecto
CMD ["node", "dist/index.js"]
