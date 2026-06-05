#!/usr/bin/env python3
"""
TEP-QF Logging Utilities
========================
Standardized logging infrastructure for the TEP-QF quantum foundations pipeline.

Author: Matthew Lukin Smawfield
Date: May 2026
License: CC-BY-4.0
"""

import logging
import sys
from pathlib import Path
from typing import Optional

# Custom log levels
PROCESS_LEVEL = 25
SUCCESS_LEVEL = 26
TEST_LEVEL = 27

logging.addLevelName(PROCESS_LEVEL, "PROCESS")
logging.addLevelName(SUCCESS_LEVEL, "SUCCESS")
logging.addLevelName(TEST_LEVEL, "TEST")


class TEPFormatter(logging.Formatter):
    """Color-coded console formatter."""
    
    COLORS = {
        'SUCCESS': '\033[1;32m',
        'WARNING': '\033[1;33m',
        'ERROR': '\033[1;31m',
        'INFO': '\033[0;37m',
        'DEBUG': '\033[0;90m',
        'PROCESS': '\033[0;34m',
        'TEST': '\033[1;35m',
        'TITLE': '\033[1;36m',
        'RESET': '\033[0m'
    }
    
    def __init__(self, use_colors=True):
        super().__init__(fmt='%(asctime)s [%(levelname)s] %(message)s', datefmt='%H:%M:%S')
        self.use_colors = use_colors
    
    def format(self, record):
        message = super().format(record)
        if self.use_colors and sys.stdout.isatty():
            color = self.COLORS.get(record.levelname, self.COLORS['INFO'])
            message = f"{color}{message}{self.COLORS['RESET']}"
        return message


class TEPFileFormatter(logging.Formatter):
    """Clean formatter for log files (no ANSI codes)."""
    def __init__(self):
        super().__init__(fmt='%(asctime)s [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')


class TEPLogger:
    """Main logger class with console and file handlers."""
    
    def __init__(self, name: str, log_file_path: Optional[Path] = None, level=logging.INFO):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)
        self.logger.handlers = []  # Clear existing handlers
        
        # Console handler with colors
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(TEPFormatter(use_colors=True))
        self.logger.addHandler(console_handler)
        
        # File handler without colors
        if log_file_path:
            log_file_path.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file_path)
            file_handler.setFormatter(TEPFileFormatter())
            self.logger.addHandler(file_handler)
    
    def process(self, msg, *args, **kwargs):
        self.logger.log(PROCESS_LEVEL, msg, *args, **kwargs)
    
    def success(self, msg, *args, **kwargs):
        self.logger.log(SUCCESS_LEVEL, msg, *args, **kwargs)
    
    def test(self, msg, *args, **kwargs):
        self.logger.log(TEST_LEVEL, msg, *args, **kwargs)
    
    def info(self, msg, *args, **kwargs):
        self.logger.info(msg, *args, **kwargs)
    
    def warning(self, msg, *args, **kwargs):
        self.logger.warning(msg, *args, **kwargs)
    
    def error(self, msg, *args, **kwargs):
        self.logger.error(msg, *args, **kwargs)
    
    def debug(self, msg, *args, **kwargs):
        self.logger.debug(msg, *args, **kwargs)


# Global logger instance
_global_logger: Optional[TEPLogger] = None


def set_step_logger(logger: TEPLogger):
    """Set the global logger for the current step."""
    global _global_logger
    _global_logger = logger


def get_logger() -> TEPLogger:
    """Get the global logger instance."""
    global _global_logger
    if _global_logger is None:
        _global_logger = TEPLogger("default")
    return _global_logger


def print_status(message: str, level: str = "INFO"):
    """Print a status message using the global logger."""
    logger = get_logger()
    level_map = {
        "INFO": logger.info,
        "PROCESS": logger.process,
        "SUCCESS": logger.success,
        "WARNING": logger.warning,
        "ERROR": logger.error,
        "TEST": logger.test,
        "DEBUG": logger.debug
    }
    func = level_map.get(level, logger.info)
    func(message)


def print_table(headers: list, rows: list, title: str = ""):
    """Print a formatted table."""
    logger = get_logger()
    
    if title:
        logger.info(f"\n{title}")
        logger.info("=" * len(title))
    
    # Calculate column widths
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Print header
    header_line = " | ".join(h.ljust(w) for h, w in zip(headers, col_widths))
    logger.info(header_line)
    logger.info("-" * len(header_line))
    
    # Print rows
    for row in rows:
        row_line = " | ".join(str(cell).ljust(w) for cell, w in zip(row, col_widths))
        logger.info(row_line)
