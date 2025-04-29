import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const olympiqApi = createApi({
  reducerPath: "olympiqApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://127.0.0.1:8000/api" }),
  endpoints: (builder) => ({
    // ----- Medals -----
    getMedals: builder.query({
      query: () => "medals",
    }),
    getMedalYears: builder.query({
      query: () => "medals/years",
    }),
    getMedalsByYear: builder.query({
      query: (year) => `medals/year/${year}`,
    }),
    getAggregateMedals: builder.query({
      query: () => "medals/aggregate",
    }),
    getMedalTrend: builder.query({
      query: (country) => `medals/trend/${country}`,
    }),
    getTopCountriesByYear: builder.query({
      query: ({ year, top_n = 10 }) => `medals/top/${year}?top_n=${top_n}`,
    }),
    getMedalsByCountry: builder.query({
      query: (country) => `medals/${country}`,
    }),

    // ----- GDP -----
    getAllGDP: builder.query({
      query: () => "gdp",
    }),
    getGDPByCountry: builder.query({
      query: (country) => `gdp/${country}`,
    }),
    getGDPByYear: builder.query({
      query: (year) => `gdp/year/${year}`,
    }),
    getGDPTrend: builder.query({
      query: (country) => `gdp/trend/${country}`,
    }),
    getTopGDPCountries: builder.query({
      query: ({ year, top_n = 10 }) => `gdp/top/${year}?top_n=${top_n}`,
    }),

    // ----- Political Stability -----
    getAllStability: builder.query({
      query: () => "stability",
    }),
    getStabilityYears: builder.query({
      query: () => "stability/years",
    }),
    getStabilityByYear: builder.query({
      query: (year) => `stability/year/${year}`,
    }),
    getStabilityByCountry: builder.query({
      query: (country) => `stability/country/${country}`,
    }),
    getStabilityByCountryAndYear: builder.query({
      query: ({ country, year }) => `stability/country/${country}/year/${year}`,
    }),

    // ----- Urban Population -----
    getAllUrban: builder.query({ query: () => "urban" }),
    getUrbanYears: builder.query({ query: () => "urban/years" }),
    getUrbanByYear: builder.query({ query: (year) => `urban/year/${year}` }),
    getUrbanByCountry: builder.query({
      query: (country) => `urban/country/${country}`,
    }),
    getUrbanByCountryAndYear: builder.query({
      query: ({ country, year }) => `urban/country/${country}/year/${year}`,
    }),

    // ----- Total Population -----
    getAllPopulation: builder.query({ query: () => "population" }),
    getPopulationYears: builder.query({ query: () => "population/years" }),
    getPopulationByYear: builder.query({
      query: (year) => `population/year/${year}`,
    }),
    getPopulationByCountry: builder.query({
      query: (country) => `population/country/${country}`,
    }),
    getPopulationByCountryAndYear: builder.query({
      query: ({ country, year }) =>
        `population/country/${country}/year/${year}`,
    }),

    // ----- Life Expectancy -----
    getAllLifeExpectancy: builder.query({ query: () => "life" }),
    getLifeExpectancyYears: builder.query({ query: () => "life/years" }),
    getLifeExpectancyByYear: builder.query({
      query: (year) => `life/year/${year}`,
    }),
    getLifeExpectancyByCountry: builder.query({
      query: (country) => `life/country/${country}`,
    }),
    getLifeExpectancyByCountryAndYear: builder.query({
      query: ({ country, year }) => `life/country/${country}/year/${year}`,
    }),

    // ----- Health Expenditure -----
    getAllHealthExpenditure: builder.query({ query: () => "health" }),
    getHealthExpenditureYears: builder.query({ query: () => "health/years" }),
    getHealthExpenditureByYear: builder.query({
      query: (year) => `health/year/${year}`,
    }),
    getHealthExpenditureByCountry: builder.query({
      query: (country) => `health/country/${country}`,
    }),
    getHealthExpenditureByCountryAndYear: builder.query({
      query: ({ country, year }) => `health/country/${country}/year/${year}`,
    }),

    // ----- GDP per Capita -----
    getAllGDPPerCapita: builder.query({ query: () => "gdp-per-capita" }),
    getGDPPerCapitaByCountry: builder.query({
      query: (country) => `gdp-per-capita/${country}`,
    }),
    getGDPPerCapitaByYear: builder.query({
      query: (year) => `gdp-per-capita/year/${year}`,
    }),
    getTopGDPPerCapita: builder.query({
      query: ({ year, top_n = 10 }) =>
        `gdp-per-capita/top/${year}?top_n=${top_n}`,
    }),

    // ----- Education Expenditure -----
    getAllEducationExpenditure: builder.query({
      query: () => "education-expenditure",
    }),
    getEducationExpenditureByCountry: builder.query({
      query: (country) => `education-expenditure/${country}`,
    }),
    getEducationExpenditureByYear: builder.query({
      query: (year) => `education-expenditure/year/${year}`,
    }),
    getTopEducationExpenditure: builder.query({
      query: ({ year, top_n = 10 }) =>
        `education-expenditure/top/${year}?top_n=${top_n}`,
    }),
    // ----- Correlation -----
    getCorrelation: builder.query({
      query: ({ factor, medal_type, method }) =>
        `correlation?factor=${factor}&medal_type=${medal_type}&method=${method}`,
    }),
  }),
});

export const {
  // Medals
  useGetMedalsQuery,
  useGetMedalYearsQuery,
  useGetMedalsByYearQuery,
  useGetAggregateMedalsQuery,
  useGetMedalTrendQuery,
  useGetTopCountriesByYearQuery,
  useGetMedalsByCountryQuery,

  // GDP
  useGetAllGDPQuery,
  useGetGDPByCountryQuery,
  useGetGDPByYearQuery,
  useGetGDPTrendQuery,
  useGetTopGDPCountriesQuery,

  // Political Stability
  useGetAllStabilityQuery,
  useGetStabilityYearsQuery,
  useGetStabilityByYearQuery,
  useGetStabilityByCountryQuery,
  useGetStabilityByCountryAndYearQuery,

  // Urban Population
  useGetAllUrbanQuery,
  useGetUrbanYearsQuery,
  useGetUrbanByYearQuery,
  useGetUrbanByCountryQuery,
  useGetUrbanByCountryAndYearQuery,

  // Total Population
  useGetAllPopulationQuery,
  useGetPopulationYearsQuery,
  useGetPopulationByYearQuery,
  useGetPopulationByCountryQuery,
  useGetPopulationByCountryAndYearQuery,

  // Life Expectancy
  useGetAllLifeExpectancyQuery,
  useGetLifeExpectancyYearsQuery,
  useGetLifeExpectancyByYearQuery,
  useGetLifeExpectancyByCountryQuery,
  useGetLifeExpectancyByCountryAndYearQuery,

  // Health Expenditure
  useGetAllHealthExpenditureQuery,
  useGetHealthExpenditureYearsQuery,
  useGetHealthExpenditureByYearQuery,
  useGetHealthExpenditureByCountryQuery,
  useGetHealthExpenditureByCountryAndYearQuery,

  // GDP per Capita
  useGetAllGDPPerCapitaQuery,
  useGetGDPPerCapitaByCountryQuery,
  useGetGDPPerCapitaByYearQuery,
  useGetTopGDPPerCapitaQuery,

  // Education Expenditure
  useGetAllEducationExpenditureQuery,
  useGetEducationExpenditureByCountryQuery,
  useGetEducationExpenditureByYearQuery,
  useGetTopEducationExpenditureQuery,

  // Correlation
  useGetCorrelationQuery,
} = olympiqApi;
