import { useState, useEffect } from "react";
import countriesData from "@/assets/countries.json";

export interface Country {
  code: string;
  name: string;
  phoneCode: string;
  id?: number | string;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('/api/countries');
        if (res.ok) {
          const body = await res.json();
          const list = ((Array.isArray(body) ? body : body?.data) || []) as Country[];
          if (list.length > 0) {
            setCountries(list.sort((a, b) => a.name.localeCompare(b.name)));
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch countries from API, using fallback JSON', e);
      }

      const sortedCountries = [...countriesData].map((c, index) => ({
        ...c,
        id: index + 1
      })).sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sortedCountries);
    };

    fetchCountries();
  }, []);

  const getPhoneCode = (countryIdOrCode: string) => {
    const country = countries.find(
      c => c.id?.toString() === countryIdOrCode || c.code === countryIdOrCode || c.name === countryIdOrCode
    );
    return country?.phoneCode || "";
  };

  const updatePhoneWithCode = (
    currentPhone: string, 
    countryIdOrCode: string
  ) => {
    const code = getPhoneCode(countryIdOrCode);
    if (!code) return currentPhone;

    const phoneWithoutCode = currentPhone.replace(/^\+?\d+\s*/, "");
    return `${code} ${phoneWithoutCode}`.trim();
  };

  return {
    countries,
    getPhoneCode,
    updatePhoneWithCode
  };
};
