"""Test logging functionality."""
import pytest
import logging
from src.utils.logging import azure_logger, log_azure_operation, AzureLogger


def test_azure_logger_singleton():
    """Test that AzureLogger is a singleton."""
    logger1 = AzureLogger()
    logger2 = AzureLogger()
    assert logger1 is logger2


def test_get_logger():
    """Test getting a logger instance."""
    logger = azure_logger.get_logger('test_module', 'test_service')
    assert logger is not None
    assert isinstance(logger, logging.Logger)
    assert logger.name == 'test_module'


def test_log_operation_context_manager():
    """Test log_operation context manager."""
    logger = azure_logger.get_logger('test', 'test_service')
    
    # Should not raise any exceptions
    with azure_logger.log_operation(logger, 'test_operation', 'test_service'):
        pass


def test_log_operation_context_manager_with_exception():
    """Test log_operation context manager with exception."""
    logger = azure_logger.get_logger('test', 'test_service')
    
    with pytest.raises(ValueError):
        with azure_logger.log_operation(logger, 'test_operation', 'test_service'):
            raise ValueError("Test error")


def test_log_metric():
    """Test logging a metric."""
    logger = azure_logger.get_logger('test', 'test_service')
    
    # Should not raise any exceptions
    azure_logger.log_metric(
        logger,
        'test_metric',
        42.0,
        'test_service',
        tag1='value1'
    )


def test_log_azure_operation_decorator_sync():
    """Test log_azure_operation decorator with sync function."""
    
    @log_azure_operation('test_service', 'test_operation')
    def test_function(value):
        return value * 2
    
    result = test_function(5)
    assert result == 10


def test_log_azure_operation_decorator_async():
    """Test log_azure_operation decorator with async function."""
    
    @log_azure_operation('test_service', 'test_operation')
    async def test_async_function(value):
        return value * 2
    
    import asyncio
    result = asyncio.run(test_async_function(5))
    assert result == 10


def test_configure_application_insights_no_key():
    """Test Application Insights configuration without key."""
    # Should not raise exception, just log warning
    azure_logger.configure_application_insights('')


def test_structured_formatter():
    """Test StructuredFormatter."""
    from src.utils.logging import StructuredFormatter
    
    formatter = StructuredFormatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - [%(service)s] %(message)s'
    )
    
    record = logging.LogRecord(
        name='test',
        level=logging.INFO,
        pathname='test.py',
        lineno=1,
        msg='Test message',
        args=(),
        exc_info=None
    )
    
    formatted = formatter.format(record)
    assert 'test' in formatted
    assert 'Test message' in formatted
    assert 'unknown' in formatted  # Default service value
