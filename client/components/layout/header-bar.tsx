"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Settings,
  LogOut,
  CloudSun,
  DollarSign,
} from "lucide-react";

interface WeatherInfo {
  temperature: number;
  description: string;
}

const describeWeather = (code: number): string => {
  if ([0].includes(code)) return "Despejado";
  if ([1, 2, 3].includes(code)) return "Parcial";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Nieve";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Clima";
};

export default function HeaderBar() {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-34.61&longitude=-58.38&current_weather=true"
        );
        if (!response.ok) {
          throw new Error("No se pudo obtener el clima");
        }
        const data = await response.json();
        const current = data.current_weather;
        setWeather({
          temperature: current?.temperature ?? 0,
          description: describeWeather(current?.weathercode ?? 0),
        });
      } catch (error) {
        console.error("Weather fetch failed", error);
      }
    };

    const loadUsd = async () => {
      try {
        const response = await fetch("https://dolarapi.com/v1/dolares/oficial");
        if (!response.ok) {
          throw new Error("No se pudo obtener la cotización del dólar");
        }
        const data = await response.json();
        setUsdRate(data?.venta ?? data?.value_avg ?? null);
      } catch (error) {
        console.error("USD fetch failed", error);
      }
    };

    const fetchIndicators = async () => {
      setIsFetching(true);
      await Promise.all([loadWeather(), loadUsd()]);
      setIsFetching(false);
    };

    fetchIndicators();
    const interval = setInterval(fetchIndicators, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-gray-800 px-6 py-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="text-sm">
          <ul className="flex flex-wrap items-center gap-4">
            <li>
              <Link href="/dashboard" className="hover:text-gray-300">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/clients" className="hover:text-gray-300">
                Clientes
              </Link>
            </li>
            <li>
              <Link href="/dashboard/tickets" className="hover:text-gray-300">
                Tickets
              </Link>
            </li>
            <li>
              <Link href="/contracts" className="hover:text-gray-300">
                Contratos
              </Link>
            </li>
            <li>
              <Link href="/budgets" className="hover:text-gray-300">
                Presupuestos
              </Link>
            </li>
            <li>
              <Link href="/payments" className="hover:text-gray-300">
                Pagos
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-4 text-sm font-medium text-slate-100 md:flex">
            <div className="flex items-center gap-2">
              <CloudSun className="h-4 w-4" />
              {weather ? (
                <span>
                  {weather.temperature.toFixed(0)}°C · {weather.description}
                </span>
              ) : (
                <span>{isFetching ? "Actualizando clima..." : "Clima N/D"}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {typeof usdRate === "number" ? (
                <span>USD ${usdRate.toFixed(2)}</span>
              ) : (
                <span>{isFetching ? "Actualizando USD..." : "USD N/D"}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="h-6 w-6 cursor-pointer hover:text-gray-300" />
            <Settings className="h-6 w-6 cursor-pointer hover:text-gray-300" />
            <LogOut className="h-6 w-6 cursor-pointer hover:text-gray-300" />
          </div>
        </div>
      </div>
    </header>
  );
}
