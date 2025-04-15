"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import Image from "next/image";

interface WeatherDataResMain {
  temp_max: number;
  temp_min: number;
}

interface WeatherDataRes {
  dt_txt: string;
  main: WeatherDataResMain;
  weather: WeatherData[];
}

interface WeatherData {
  date: string;
  temp_max: number;
  temp_min: number;
  description: string;
  icon: string;
}

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

const WeatherPage = () => {
  const [city, setCity] = useState("Shanghai");
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState("Shanghai, CN");

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const getCardGradient = (temp: number) => {
    if (temp > 30)
      return "bg-gradient-to-br from-orange-100 to-amber-100 border-amber-200";
    if (temp > 25)
      return "bg-gradient-to-br from-yellow-100 to-orange-100 border-orange-200";
    if (temp > 20)
      return "bg-gradient-to-br from-blue-50 to-cyan-100 border-cyan-200";
    if (temp > 15)
      return "bg-gradient-to-br from-blue-100 to-indigo-100 border-indigo-200";
    return "bg-gradient-to-br from-indigo-100 to-purple-100 border-purple-200";
  };

  const fetchCityCoordinates = async (cityName: string) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`
      );
      if (response.data.length > 0) {
        return response.data[0];
      } else {
        setError("City not found");
        return null;
      }
    } catch (err) {
      console.log(err);
      setLoading(false);
      setError("Failed to fetch city data");
      return null;
    }
  };

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );

      const dailyData: Record<string, WeatherData> = {};

      response.data.list.forEach((item: WeatherDataRes) => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            temp_max: item.main.temp_max,
            temp_min: item.main.temp_min,
            description: item.weather[0].description,
            icon: item.weather[0].icon,
          };
        } else {
          if (item.main.temp_max > dailyData[date].temp_max) {
            dailyData[date].temp_max = item.main.temp_max;
          }
          if (item.main.temp_min < dailyData[date].temp_min) {
            dailyData[date].temp_min = item.main.temp_min;
          }
        }
      });

      const result = Object.values(dailyData).slice(0, 7);
      setWeatherData(result);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError("Failed to fetch weather data");
      setLoading(false);
    }
  };

  const handleCitySearch = async () => {
    if (!city) return;

    setLoading(true);
    setError(null);

    const cityData = await fetchCityCoordinates(city);
    if (cityData) {
      setCurrentCity(`${cityData.name}, ${cityData.country}`);
      await fetchWeatherData(cityData.lat, cityData.lon);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const cityData = await fetchCityCoordinates("Shanghai");
      if (cityData) {
        await fetchWeatherData(cityData.lat, cityData.lon);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
            Weather Forecast
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Check the 7-day weather forecast for any city around the world
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCitySearch()}
              placeholder="Enter city name..."
              className="flex-grow px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={handleCitySearch}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 mb-8 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mr-3">
                  {currentCity}
                </h2>
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-5">
                {weatherData.map((day, index) => (
                  <div
                    key={index}
                    className={`
                      relative rounded-2xl p-5 shadow-md border
                      transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                      ${getCardGradient(day.temp_max)}
                    `}
                  >
                    {/* 装饰元素 */}
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full bg-white bg-opacity-20"></div>

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {format(parseISO(day.date), "EEE")}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(day.date), "MMM d")}
                          </p>
                        </div>
                        <div className="bg-white bg-opacity-50 rounded-full p-1">
                          <Image
                            src={getWeatherIcon(day.icon)}
                            alt={day.description}
                            width={40}
                            height={40}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>

                      <div className="flex items-end justify-between mb-3">
                        <span className="text-4xl font-bold text-gray-900">
                          {Math.round(day.temp_max)}°
                        </span>
                        <span className="text-lg text-gray-600 mb-1">
                          {Math.round(day.temp_min)}°
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-700 capitalize mb-4">
                        {day.description}
                      </p>

                      {/* 温度范围指示器 */}
                      <div className="relative h-2 bg-white bg-opacity-50 rounded-full mb-1 overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-amber-400 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, (day.temp_max + 10) * 3)
                            )}%`,
                            left: `${Math.max(0, (day.temp_min + 10) * 3)}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>-10°</span>
                        <span>30°</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
