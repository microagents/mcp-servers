# MCP Weather Free

A Model Context Protocol (MCP) server that provides weather data using the free Open-Meteo API. No API key required!

## Features

- **Current Weather**: Get real-time weather conditions including temperature, humidity, wind speed, and weather descriptions
- **Hourly Forecast**: 24-hour weather forecast with hourly updates
- **Daily Forecast**: 7-day weather forecast with daily summaries
- **City Search**: Look up weather by city name with automatic geocoding
- **Multiple Units**: Support for different temperature (Celsius/Fahrenheit), wind speed (km/h, m/s, mph, knots), and precipitation (mm, inch) units

## Installation

### Using uvx (recommended)

```bash
uvx --from git+https://github.com/microagents/mcp-servers.git#subdirectory=mcp-weather-free mcp-weather-free
```

### Using pip

```bash
pip install git+https://github.com/microagents/mcp-servers.git#subdirectory=mcp-weather-free
```

## Configuration

Add the following to your MCP client configuration:

### For Claude Desktop

Update your `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "weather": {
            "command": "uvx",
            "args": ["--from", "git+https://github.com/microagents/mcp-servers.git#subdirectory=mcp-weather-free", "mcp-weather-free"]
        }
    }
}
```

### For other MCP clients

```json
{
    "mcpServers": {
        "weather": {
            "command": "python",
            "args": ["-m", "mcp_weather_free"]
        }
    }
}
```

## Available Tools

### `get_weather`

Get weather data for specific coordinates.

**Parameters:**
- `latitude` (float, required): Latitude of the location
- `longitude` (float, required): Longitude of the location
- `location_name` (string, optional): Display name for the location
- `temperature_unit` (string, optional): "celsius" (default) or "fahrenheit"
- `wind_speed_unit` (string, optional): "kmh" (default), "ms", "mph", or "kn"
- `precipitation_unit` (string, optional): "mm" (default) or "inch"

**Example:**
```
Get weather for latitude: 40.7128, longitude: -74.0060
```

### `get_weather_by_city`

Get weather data by city name.

**Parameters:**
- `city` (string, required): Name of the city
- `country_code` (string, optional): 2-letter country code (e.g., "US", "GB")
- `temperature_unit` (string, optional): "celsius" (default) or "fahrenheit"
- `wind_speed_unit` (string, optional): "kmh" (default), "ms", "mph", or "kn"
- `precipitation_unit` (string, optional): "mm" (default) or "inch"

**Example:**
```
Get weather for city: "New York"
```

## Resources

The server also provides a resource endpoint:

- `weather://current/{latitude}/{longitude}` - Get formatted current weather for a location

## Response Format

Weather data includes:
- **Location information**: coordinates, timezone, elevation
- **Current conditions**: temperature, humidity, wind, weather description
- **Hourly forecast**: Next 24 hours of weather data
- **Daily forecast**: Next 7 days of weather summaries

## License

This project is licensed under the MIT License.

## Credits

Weather data provided by [Open-Meteo](https://open-meteo.com/) - free weather API with no API key required.