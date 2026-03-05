/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONEYFUSION_TOKEN: string;
  readonly VITE_MONEYFUSION_API_URL: string;
  readonly VITE_MONEYFUSION_NOTIF_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-select-country-list' {
  interface CountryOption {
    value: string;
    label: string;
  }

  interface CountryList {
    getData(): CountryOption[];
    getValue(label: string): string | undefined;
    getLabel(value: string): string | undefined;
  }

  function countryList(): CountryList;
  export default countryList;
}
