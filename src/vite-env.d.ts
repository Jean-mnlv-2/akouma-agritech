/// <reference types="vite/client" />

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
