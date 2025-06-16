"""MCP Weather Free - A Model Context Protocol server for weather data using Open-Meteo API."""

from .main import mcp, get_weather, get_weather_by_city, main

__version__ = "0.1.0"
__all__ = ["mcp", "get_weather", "get_weather_by_city", "main"]