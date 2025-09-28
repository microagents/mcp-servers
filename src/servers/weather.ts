import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Type definitions for Open-Meteo API responses
interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

interface GeocodingApiResponse {
  results: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
  }>;
}

// Weather code to description mapping
function weatherCodeToDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
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
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || `Unknown weather code: ${code}`;
}

export function createWeatherServer(): McpServer {
  const server = new McpServer({
    name: "weather-server",
    version: "1.0.0",
  });

  // Tool 1: get_weather - Get weather by coordinates
  server.registerTool(
    "get_weather",
    {
      title: "Get Weather",
      description: "Get current weather and forecast for a specific location.",
      inputSchema: {
        latitude: z.number().describe("Latitude of the location"),
        longitude: z.number().describe("Longitude of the location"),
        location_name: z
          .string()
          .optional()
          .default("")
          .describe("Optional name of the location for display"),
        temperature_unit: z
          .string()
          .optional()
          .default("celsius")
          .describe("Temperature unit (celsius or fahrenheit)"),
        wind_speed_unit: z
          .string()
          .optional()
          .default("kmh")
          .describe("Wind speed unit (kmh, ms, mph, kn)"),
        precipitation_unit: z
          .string()
          .optional()
          .default("mm")
          .describe("Precipitation unit (mm or inch)"),
      },
    },
    async ({
      latitude,
      longitude,
      location_name = "",
      temperature_unit = "celsius",
      wind_speed_unit = "kmh",
      precipitation_unit = "mm",
    }) => {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "weather_code",
          "wind_speed_10m",
          "wind_direction_10m",
        ].join(","),
        hourly: [
          "temperature_2m",
          "relative_humidity_2m",
          "precipitation",
          "weather_code",
          "wind_speed_10m",
        ].join(","),
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_sum",
          "wind_speed_10m_max",
        ].join(","),
        temperature_unit,
        wind_speed_unit,
        precipitation_unit,
        timezone: "auto",
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
        );

        if (!response.ok) {
          throw new Error(`Weather API request failed: ${response.statusText}`);
        }

        const data = (await response.json()) as WeatherApiResponse;

        // Process current weather
        const current_data = {
          time: data.current.time,
          temperature: data.current.temperature_2m,
          relative_humidity: data.current.relative_humidity_2m,
          weather_code: data.current.weather_code,
          weather_description: weatherCodeToDescription(
            data.current.weather_code,
          ),
          wind_speed: data.current.wind_speed_10m,
          wind_direction: data.current.wind_direction_10m,
        };

        // Process hourly forecast (next 24 hours)
        const hourly_data = [];
        if (data.hourly && data.hourly.time) {
          for (let i = 0; i < Math.min(24, data.hourly.time.length); i++) {
            hourly_data.push({
              time: data.hourly.time[i],
              temperature: data.hourly.temperature_2m[i],
              relative_humidity: data.hourly.relative_humidity_2m[i],
              precipitation: data.hourly.precipitation[i],
              weather_code: data.hourly.weather_code[i],
              wind_speed: data.hourly.wind_speed_10m[i],
            });
          }
        }

        // Process daily forecast
        const daily_data = [];
        if (data.daily && data.daily.time) {
          for (let i = 0; i < data.daily.time.length; i++) {
            daily_data.push({
              date: data.daily.time[i],
              weather_code: data.daily.weather_code[i],
              weather_description: weatherCodeToDescription(
                data.daily.weather_code[i] ?? 0,
              ),
              temperature_max: data.daily.temperature_2m_max[i],
              temperature_min: data.daily.temperature_2m_min[i],
              precipitation_sum: data.daily.precipitation_sum[i],
              wind_speed_max: data.daily.wind_speed_10m_max[i],
            });
          }
        }

        const result = {
          location: {
            name:
              location_name !== ""
                ? location_name
                : `${latitude}, ${longitude}`,
            latitude: data.latitude,
            longitude: data.longitude,
            elevation: data.elevation,
            timezone: data.timezone,
            timezone_abbreviation: data.timezone_abbreviation,
          },
          units: {
            temperature: temperature_unit,
            wind_speed: wind_speed_unit,
            precipitation: precipitation_unit,
          },
          current: current_data,
          hourly: hourly_data,
          daily: daily_data,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResult = {
          error: error instanceof Error ? error.message : String(error),
          location: {
            latitude,
            longitude,
            name:
              location_name !== ""
                ? location_name
                : `${latitude}, ${longitude}`,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResult, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Tool 2: get_weather_by_city - Get weather by city name
  server.registerTool(
    "get_weather_by_city",
    {
      title: "Get Weather by City",
      description: "Get weather for a city by name using geocoding.",
      inputSchema: {
        city: z.string().describe("Name of the city"),
        country_code: z
          .string()
          .optional()
          .default("")
          .describe(
            'Optional(default=\'\') 2-letter country code (e.g., "US", "GB")',
          ),
        temperature_unit: z
          .string()
          .optional()
          .default("celsius")
          .describe("Temperature unit (celsius or fahrenheit)"),
        wind_speed_unit: z
          .string()
          .optional()
          .default("kmh")
          .describe("Wind speed unit (kmh, ms, mph, kn)"),
        precipitation_unit: z
          .string()
          .optional()
          .default("mm")
          .describe("Precipitation unit (mm or inch)"),
      },
    },
    async ({
      city,
      country_code = "",
      temperature_unit = "celsius",
      wind_speed_unit = "kmh",
      precipitation_unit = "mm",
    }) => {
      // Use the Open-Meteo geocoding API
      const geocodingParams = new URLSearchParams({
        name: city,
        count: "1",
        language: "en",
        format: "json",
      });

      try {
        const geocodingResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?${geocodingParams}`,
        );

        if (!geocodingResponse.ok) {
          throw new Error(
            `Geocoding API request failed: ${geocodingResponse.statusText}`,
          );
        }

        const geocodingData =
          (await geocodingResponse.json()) as GeocodingApiResponse;

        if (!geocodingData.results || geocodingData.results.length === 0) {
          const errorResult = {
            error: `City '${city}' not found`,
            city,
            country_code,
          };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(errorResult, null, 2),
              },
            ],
            isError: true,
          };
        }

        const location = geocodingData.results[0];
        if (!location) {
          const errorResult = {
            error: `Location data not found for city '${city}'`,
            city,
            country_code,
          };

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(errorResult, null, 2),
              },
            ],
            isError: true,
          };
        }

        // Get weather for the location using the get_weather logic
        const params = new URLSearchParams({
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          current: [
            "temperature_2m",
            "relative_humidity_2m",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m",
          ].join(","),
          hourly: [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
          ].join(","),
          daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "wind_speed_10m_max",
          ].join(","),
          temperature_unit,
          wind_speed_unit,
          precipitation_unit,
          timezone: "auto",
        });

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
        );

        if (!weatherResponse.ok) {
          throw new Error(
            `Weather API request failed: ${weatherResponse.statusText}`,
          );
        }

        const weatherData =
          (await weatherResponse.json()) as WeatherApiResponse;

        // Process current weather
        const current_data = {
          time: weatherData.current.time,
          temperature: weatherData.current.temperature_2m,
          relative_humidity: weatherData.current.relative_humidity_2m,
          weather_code: weatherData.current.weather_code,
          weather_description: weatherCodeToDescription(
            weatherData.current.weather_code,
          ),
          wind_speed: weatherData.current.wind_speed_10m,
          wind_direction: weatherData.current.wind_direction_10m,
        };

        // Process hourly forecast (next 24 hours)
        const hourly_data = [];
        if (weatherData.hourly && weatherData.hourly.time) {
          for (
            let i = 0;
            i < Math.min(24, weatherData.hourly.time.length);
            i++
          ) {
            hourly_data.push({
              time: weatherData.hourly.time[i],
              temperature: weatherData.hourly.temperature_2m[i],
              relative_humidity: weatherData.hourly.relative_humidity_2m[i],
              precipitation: weatherData.hourly.precipitation[i],
              weather_code: weatherData.hourly.weather_code[i],
              wind_speed: weatherData.hourly.wind_speed_10m[i],
            });
          }
        }

        // Process daily forecast
        const daily_data = [];
        if (weatherData.daily && weatherData.daily.time) {
          for (let i = 0; i < weatherData.daily.time.length; i++) {
            daily_data.push({
              date: weatherData.daily.time[i],
              weather_code: weatherData.daily.weather_code[i],
              weather_description: weatherCodeToDescription(
                weatherData.daily.weather_code[i] ?? 0,
              ),
              temperature_max: weatherData.daily.temperature_2m_max[i],
              temperature_min: weatherData.daily.temperature_2m_min[i],
              precipitation_sum: weatherData.daily.precipitation_sum[i],
              wind_speed_max: weatherData.daily.wind_speed_10m_max[i],
            });
          }
        }

        const result = {
          location: {
            name: `${location.name}, ${location.admin1 || ""}, ${location.country}`,
            latitude: weatherData.latitude,
            longitude: weatherData.longitude,
            elevation: weatherData.elevation,
            timezone: weatherData.timezone,
            timezone_abbreviation: weatherData.timezone_abbreviation,
          },
          units: {
            temperature: temperature_unit,
            wind_speed: wind_speed_unit,
            precipitation: precipitation_unit,
          },
          current: current_data,
          hourly: hourly_data,
          daily: daily_data,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorResult = {
          error: error instanceof Error ? error.message : String(error),
          city,
          country_code,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResult, null, 2),
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}
