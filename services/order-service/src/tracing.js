// OpenTelemetry Tracing Configuration for Order Service
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Initialize Pyroscope for continuous profiling
const Pyroscope = require('@pyroscope/nodejs');

Pyroscope.init({
  serverAddress: process.env.PYROSCOPE_SERVER_ADDRESS || 'http://alloy:4040',
  appName: process.env.OTEL_SERVICE_NAME || 'order-service',
  tags: {
    env: process.env.NODE_ENV || 'development',
    service: 'order-service',
    version: '1.0.0',
    region: process.env.REGION || 'us-west-0',
    instance: process.env.HOSTNAME || 'local',
    platform: 'docker'
  },
  // Note: CPU and Heap profiling are enabled by default in @pyroscope/nodejs
  // The SDK automatically collects:
  // - process_cpu: CPU time consumed by functions
  // - memory:inuse_space: Heap memory currently in use
  // - memory:inuse_objects: Number of allocated objects
  // - memory:alloc_space: Total memory allocated (including freed)
  // - memory:alloc_objects: Total objects allocated
});

Pyroscope.start();

// Configure OpenTelemetry Resource
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'order-service',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

// Configure Trace Exporter
const traceExporter = new OTLPTraceExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
  headers: {},
});

// Configure Metric Exporter
const metricExporter = new OTLPMetricExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  headers: {},
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: resource,
  traceExporter: traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis-4': { enabled: true },
    }),
  ],
});

// Start the SDK
sdk.start();

// ⭐ Configure Logs Exporter (OTLP)
const logExporter = new OTLPLogExporter({
  url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
  headers: {},
});

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// Export logger for use in application
global.otelLogger = loggerProvider.getLogger('order-service', '1.0.0');

console.log('🔭 OpenTelemetry instrumentation started for order-service');
console.log(`📡 Sending telemetry to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
console.log('📝 Logs, traces, and metrics enabled');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('✅ OpenTelemetry SDK shut down successfully'))
    .catch((error) => console.error('❌ Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});

module.exports = sdk;
