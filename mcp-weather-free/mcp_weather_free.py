from mcp.server.fastmcp import FastMCP
import openmeteo_requests
from typing import Dict, Optional, Any
import requests

# Create an MCP server
mcp = FastMCP("mcp-weather-free")

# Initialize Open-Meteo client
om = openmeteo_requests.Client()


@mcp.tool()
def get_weather(
    latitude: float,
    longitude: float,
    location_name: Optional[str] = None,
    temperature_unit: str = "celsius",
    wind_speed_unit: str = "kmh",
    precipitation_unit: str = "mm"
) -> Dict[str, Any]:
    """
    Get current weather and forecast for a specific location.
    
    Args:
        latitude: Latitude of the location
        longitude: Longitude of the location
        location_name: Optional name of the location for display
        temperature_unit: Temperature unit (celsius or fahrenheit)
        wind_speed_unit: Wind speed unit (kmh, ms, mph, kn)
        precipitation_unit: Precipitation unit (mm or inch)
    
    Returns:
        Dictionary containing current weather and forecast data
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": ["temperature_2m", "relative_humidity_2m", "weather_code", "wind_speed_10m", "wind_direction_10m"],
        "hourly": ["temperature_2m", "relative_humidity_2m", "precipitation", "weather_code", "wind_speed_10m"],
        "daily": ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_sum", "wind_speed_10m_max"],
        "temperature_unit": temperature_unit,
        "wind_speed_unit": wind_speed_unit,
        "precipitation_unit": precipitation_unit,
        "timezone": "auto"
    }
    
    try:
        responses = om.weather_api("https://api.open-meteo.com/v1/forecast", params=params)
        response = responses[0]
        
        # Process current weather
        current = response.Current()
        current_temperature_2m = next(filter(lambda x: x.Variable() == 0, [current.Variables(i) for i in range(current.VariablesLength())]))
        current_humidity_2m = next(filter(lambda x: x.Variable() == 1, [current.Variables(i) for i in range(current.VariablesLength())]))
        current_weather_code = next(filter(lambda x: x.Variable() == 2, [current.Variables(i) for i in range(current.VariablesLength())]))
        current_wind_speed = next(filter(lambda x: x.Variable() == 3, [current.Variables(i) for i in range(current.VariablesLength())]))
        current_wind_direction = next(filter(lambda x: x.Variable() == 4, [current.Variables(i) for i in range(current.VariablesLength())]))
        
        current_data = {
            "time": current.Time(),
            "temperature": current_temperature_2m.Value(),
            "relative_humidity": current_humidity_2m.Value(),
            "weather_code": int(current_weather_code.Value()),
            "weather_description": weather_code_to_description(int(current_weather_code.Value())),
            "wind_speed": current_wind_speed.Value(),
            "wind_direction": current_wind_direction.Value()
        }
        
        # Process hourly forecast (next 24 hours)
        hourly = response.Hourly()
        hourly_time = hourly.Time()
        hourly_temperature = hourly.Variables(0)
        hourly_humidity = hourly.Variables(1)
        hourly_precipitation = hourly.Variables(2)
        hourly_weather_code = hourly.Variables(3)
        hourly_wind_speed = hourly.Variables(4)
        
        hourly_data = []
        for i in range(min(24, hourly_time.Length())):
            hourly_data.append({
                "time": hourly_time.Value(i),
                "temperature": hourly_temperature.ValuesInt64(i) if hourly_temperature.ValuesLength() > i else None,
                "relative_humidity": hourly_humidity.ValuesInt64(i) if hourly_humidity.ValuesLength() > i else None,
                "precipitation": hourly_precipitation.ValuesInt64(i) if hourly_precipitation.ValuesLength() > i else None,
                "weather_code": int(hourly_weather_code.ValuesInt64(i)) if hourly_weather_code.ValuesLength() > i else None,
                "wind_speed": hourly_wind_speed.ValuesInt64(i) if hourly_wind_speed.ValuesLength() > i else None
            })
        
        # Process daily forecast
        daily = response.Daily()
        daily_time = daily.Time()
        daily_weather_code = daily.Variables(0)
        daily_temp_max = daily.Variables(1)
        daily_temp_min = daily.Variables(2)
        daily_precipitation = daily.Variables(3)
        daily_wind_max = daily.Variables(4)
        
        daily_data = []
        for i in range(daily_time.Length()):
            daily_data.append({
                "date": daily_time.Value(i),
                "weather_code": int(daily_weather_code.ValuesInt64(i)),
                "weather_description": weather_code_to_description(int(daily_weather_code.ValuesInt64(i))),
                "temperature_max": daily_temp_max.ValuesInt64(i),
                "temperature_min": daily_temp_min.ValuesInt64(i),
                "precipitation_sum": daily_precipitation.ValuesInt64(i),
                "wind_speed_max": daily_wind_max.ValuesInt64(i)
            })
        
        return {
            "location": {
                "name": location_name or f"{latitude}, {longitude}",
                "latitude": response.Latitude(),
                "longitude": response.Longitude(),
                "elevation": response.Elevation(),
                "timezone": response.Timezone(),
                "timezone_abbreviation": response.TimezoneAbbreviation()
            },
            "units": {
                "temperature": temperature_unit,
                "wind_speed": wind_speed_unit,
                "precipitation": precipitation_unit
            },
            "current": current_data,
            "hourly": hourly_data,
            "daily": daily_data
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "name": location_name or f"{latitude}, {longitude}"
            }
        }


@mcp.tool()
def get_weather_by_city(
    city: str,
    country_code: Optional[str] = None,
    temperature_unit: str = "celsius",
    wind_speed_unit: str = "kmh",
    precipitation_unit: str = "mm"
) -> Dict[str, Any]:
    """
    Get weather for a city by name using geocoding.
    
    Args:
        city: Name of the city
        country_code: Optional 2-letter country code (e.g., "US", "GB")
        temperature_unit: Temperature unit (celsius or fahrenheit)
        wind_speed_unit: Wind speed unit (kmh, ms, mph, kn)
        precipitation_unit: Precipitation unit (mm or inch)
    
    Returns:
        Dictionary containing current weather and forecast data
    """
    # Use the Open-Meteo geocoding API
    geocoding_url = "https://geocoding-api.open-meteo.com/v1/search"
    geocoding_params = {
        "name": city,
        "count": 1,
        "language": "en",
        "format": "json"
    }
    
    try:
        response = requests.get(geocoding_url, params=geocoding_params)
        response.raise_for_status()
        data = response.json()
        
        if not data.get("results"):
            return {
                "error": f"City '{city}' not found",
                "city": city,
                "country_code": country_code
            }
        
        location = data["results"][0]
        
        # Get weather for the location
        return get_weather(
            latitude=location["latitude"],
            longitude=location["longitude"],
            location_name=f"{location['name']}, {location.get('admin1', '')}, {location['country']}",
            temperature_unit=temperature_unit,
            wind_speed_unit=wind_speed_unit,
            precipitation_unit=precipitation_unit
        )
        
    except Exception as e:
        return {
            "error": str(e),
            "city": city,
            "country_code": country_code
        }


def weather_code_to_description(code: int) -> str:
    """Convert WMO weather code to human-readable description."""
    weather_codes = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }
    return weather_codes.get(code, f"Unknown weather code: {code}")


@mcp.resource("weather://current/{latitude}/{longitude}")
def get_current_weather_resource(latitude: float, longitude: float) -> str:
    """Get current weather as a resource."""
    result = get_weather(latitude, longitude)
    
    if "error" in result:
        return f"Error: {result['error']}"
    
    current = result["current"]
    location = result["location"]
    units = result["units"]
    
    temp_unit = "°C" if units["temperature"] == "celsius" else "°F"
    
    return f"""Current Weather at {location['name']}
Temperature: {current['temperature']}{temp_unit}
Humidity: {current['relative_humidity']}%
Wind: {current['wind_speed']} {units['wind_speed']} from {current['wind_direction']}°
Conditions: {current['weather_description']}
"""


def main():
    """Main entry point for the MCP server."""
    import sys
    mcp.run(transport=sys.argv[1] if len(sys.argv) > 1 else "stdio")


if __name__ == "__main__":
    main()