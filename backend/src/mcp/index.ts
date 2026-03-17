/**
 * MCP (Model Context Protocol) Tools
 *
 * This module exposes two MCP-style tools that enrich the StudentLife AI:
 *   - get_weather   : Real-time weather for Fairfax, VA via OpenWeatherMap
 *   - get_mason360_events : Live campus events from Mason360 (GMU)
 *
 * These tools are called by the backend routes and injected into the AI
 * assistant's context so it can give weather-aware event recommendations.
 */

export { getWeather } from './weather.tool';
export type { WeatherData } from './weather.tool';
export { getMason360Events } from './mason360.tool';
export type { Mason360Event } from './mason360.tool';
