export const getCountries = (lang = 'en') => {
  const countryName = new Intl.DisplayNames([lang], { type: 'region' });
  const countries: Record<string, string> = {};
  // Loop through possible two-letter ISO 3166-1 alpha-2 codes
  for (let i = 65; i <= 90; ++i) {
    // A-Z
    for (let j = 65; j <= 90; ++j) {
      // A-Z
      let code = String.fromCharCode(i) + String.fromCharCode(j);
      let name = countryName.of(code);
      // If the code is recognized as a country, add it to the list
      if (code !== name && name) {
        countries[code] = name;
      }
    }
  }
  return countries;
};
