"""Centralized logging and monitoring utilities for Azure components."""
import logging
import sys
import time
from typing import Optional, Dict, Any
from functools import wraps
from contextlib import contextmanager

try:
    from opencensus.ext.azure.log_exporter import AzureLogHandler
    from opencensus.ext.azure import metrics_exporter
    from opencensus.stats import aggregation as aggregation_module
    from opencensus.stats import measure as measure_module
    from opencensus.stats import stats as stats_module
    from opencensus.stats import view as view_module
    from opencensus.tags import tag_map as tag_map_module
    AZURE_MONITOR_AVAILABLE = True
except ImportError:
    AZURE_MONITOR_AVAILABLE = False


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logging."""
    
    def format(self, record):
        """Format log record with additional context."""
        # Add custom fields
        if not hasattr(record, 'service'):
            record.service = 'unknown'
        if not hasattr(record, 'operation'):
            record.operation = 'unknown'
        if not hasattr(record, 'duration_ms'):
            record.duration_ms = 0
        if not hasattr(record, 'status'):
            record.status = 'unknown'
        
        return super().format(record)


class AzureLogger:
    """Centralized logger for Azure components with monitoring integration."""
    
    _instance = None
    _loggers: Dict[str, logging.Logger] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AzureLogger, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the Azure logger."""
        if self._initialized:
            return
        
        self.application_insights_key: Optional[str] = None
        self._initialized = True
        
        # Setup root logger
        self._setup_root_logger()
    
    def _setup_root_logger(self):
        """Configure the root logger with console output."""
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        
        # Console handler with structured formatting
        if not root_logger.handlers:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.INFO)
            
            formatter = StructuredFormatter(
                fmt='%(asctime)s - %(name)s - %(levelname)s - [%(service)s] [%(operation)s] '
                    '%(message)s - duration=%(duration_ms)dms status=%(status)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)
    
    def configure_application_insights(self, instrumentation_key: str):
        """
        Configure Application Insights integration.
        
        Args:
            instrumentation_key: Azure Application Insights instrumentation key
        """
        if not AZURE_MONITOR_AVAILABLE:
            logging.warning("Azure Monitor not available. Install opencensus-ext-azure for monitoring.")
            return
        
        if not instrumentation_key:
            logging.warning("Application Insights instrumentation key not provided")
            return
        
        self.application_insights_key = instrumentation_key
        
        # Add Azure Log Handler to root logger
        root_logger = logging.getLogger()
        
        # Check if Azure handler already exists
        has_azure_handler = any(
            isinstance(h, AzureLogHandler) for h in root_logger.handlers
        )
        
        if not has_azure_handler:
            azure_handler = AzureLogHandler(
                connection_string=f'InstrumentationKey={instrumentation_key}'
            )
            azure_handler.setLevel(logging.INFO)
            root_logger.addHandler(azure_handler)
            
            logging.info("Application Insights logging configured", extra={
                'service': 'monitoring',
                'operation': 'configure',
                'duration_ms': 0,
                'status': 'success'
            })
    
    def get_logger(self, name: str, service: str = 'application') -> logging.Logger:
        """
        Get a logger instance for a specific service.
        
        Args:
            name: Logger name (usually module name)
            service: Service name for context
            
        Returns:
            Configured logger instance
        """
        if name not in self._loggers:
            logger = logging.getLogger(name)
            logger.service = service
            self._loggers[name] = logger
        
        return self._loggers[name]
    
    @contextmanager
    def log_operation(
        self,
        logger: logging.Logger,
        operation: str,
        service: str,
        **kwargs
    ):
        """
        Context manager for logging operations with duration tracking.
        
        Args:
            logger: Logger instance
            operation: Operation name
            service: Service name
            **kwargs: Additional context to log
            
        Example:
            with azure_logger.log_operation(logger, 'upload_video', 'blob_storage', video_id='123'):
                # perform operation
                pass
        """
        start_time = time.time()
        extra = {
            'service': service,
            'operation': operation,
            'duration_ms': 0,
            'status': 'started',
            **kwargs
        }
        
        logger.info(f"Starting {operation}", extra=extra)
        
        try:
            yield
            duration_ms = int((time.time() - start_time) * 1000)
            extra['duration_ms'] = duration_ms
            extra['status'] = 'success'
            logger.info(f"Completed {operation}", extra=extra)
            
        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            extra['duration_ms'] = duration_ms
            extra['status'] = 'error'
            extra['error'] = str(e)
            extra['error_type'] = type(e).__name__
            logger.error(f"Failed {operation}: {str(e)}", extra=extra, exc_info=True)
            raise
    
    def log_metric(
        self,
        logger: logging.Logger,
        metric_name: str,
        value: float,
        service: str,
        **tags
    ):
        """
        Log a custom metric.
        
        Args:
            logger: Logger instance
            metric_name: Name of the metric
            value: Metric value
            service: Service name
            **tags: Additional tags for the metric
        """
        extra = {
            'service': service,
            'operation': 'metric',
            'metric_name': metric_name,
            'metric_value': value,
            'duration_ms': 0,
            'status': 'success',
            **tags
        }
        logger.info(f"Metric: {metric_name}={value}", extra=extra)


def log_azure_operation(service: str, operation: str):
    """
    Decorator for logging Azure service operations.
    
    Args:
        service: Azure service name
        operation: Operation name
        
    Example:
        @log_azure_operation('blob_storage', 'upload_video')
        async def upload_video(self, data):
            # implementation
            pass
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = azure_logger.get_logger(func.__module__, service)
            
            with azure_logger.log_operation(logger, operation, service):
                result = await func(*args, **kwargs)
                return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger = azure_logger.get_logger(func.__module__, service)
            
            with azure_logger.log_operation(logger, operation, service):
                result = func(*args, **kwargs)
                return result
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# Global instance
azure_logger = AzureLogger()
