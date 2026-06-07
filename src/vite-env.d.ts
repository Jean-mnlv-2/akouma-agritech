/// <reference types="vite/client" />
/// <reference types="vite-imagetools/client" />

declare module "*?format=avif&quality=70" { const src: string; export default src; }
declare module "*?format=webp&quality=75" { const src: string; export default src; }
declare module "*?format=avif" { const src: string; export default src; }
declare module "*?format=webp" { const src: string; export default src; }

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
