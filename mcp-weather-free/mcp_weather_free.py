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
        # Variables are indexed by their position in the request array, not by Variable() ID
        current_temperature_2m = current.Variables(0)
        current_humidity_2m = current.Variables(1)
        current_weather_code = current.Variables(2)
        current_wind_speed = current.Variables(3)
        current_wind_direction = current.Variables(4)

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
        if hourly and hourly.VariablesLength() > 0:
            hourly_temperature = hourly.Variables(0)
            hourly_humidity = hourly.Variables(1)
            hourly_precipitation = hourly.Variables(2)
            hourly_weather_code = hourly.Variables(3)
            hourly_wind_speed = hourly.Variables(4)

            hourly_data = []
            for i in range(min(24, hourly_temperature.ValuesLength())):
                hourly_data.append({
                    "time": hourly.Time() + (i * 3600),  # Hourly intervals
                    "temperature": hourly_temperature.Values(i),
                    "relative_humidity": hourly_humidity.Values(i),
                    "precipitation": hourly_precipitation.Values(i),
                    "weather_code": int(hourly_weather_code.Values(i)),
                    "wind_speed": hourly_wind_speed.Values(i)
                })
        else:
            hourly_data = []

        # Process daily forecast
        daily = response.Daily()
        if daily and daily.VariablesLength() > 0:
            daily_weather_code = daily.Variables(0)
            daily_temp_max = daily.Variables(1)
            daily_temp_min = daily.Variables(2)
            daily_precipitation = daily.Variables(3)
            daily_wind_max = daily.Variables(4)

            daily_data = []
            for i in range(daily_weather_code.ValuesLength()):
                daily_data.append({
                    "date": daily.Time() + (i * 86400),  # Daily intervals
                    "weather_code": int(daily_weather_code.Values(i)),
                    "weather_description": weather_code_to_description(int(daily_weather_code.Values(i))),
                    "temperature_max": daily_temp_max.Values(i),
                    "temperature_min": daily_temp_min.Values(i),
                    "precipitation_sum": daily_precipitation.Values(i),
                    "wind_speed_max": daily_wind_max.Values(i)
                })
        else:
            daily_data = []

        return {
            "location": {
                "name": location_name or f"{latitude}, {longitude}",
                "latitude": response.Latitude(),
                "longitude": response.Longitude(),
                "elevation": response.Elevation(),
                "timezone": response.Timezone().decode() if isinstance(response.Timezone(), bytes) else response.Timezone(),
                "timezone_abbreviation": response.TimezoneAbbreviation().decode() if isinstance(response.TimezoneAbbreviation(), bytes) else response.TimezoneAbbreviation()
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

def main():
    """Main entry point for the MCP server."""
    import sys
    mcp.run(transport=sys.argv[1] if len(sys.argv) > 1 else "stdio")


if __name__ == "__main__":
    main()
