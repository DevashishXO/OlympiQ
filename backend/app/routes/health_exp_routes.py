from fastapi import APIRouter
import pandas as pd
import numpy as np

router = APIRouter()

data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/health_expenditure_cleaned.csv"
data = pd.read_csv(data_file_path)

# Convert empty strings to NaN, then replace NaN with None for JSON-safe output
data = data.replace(r'^\s*$', np.nan, regex=True).replace({np.nan: None})

@router.get("/health")
async def get_all_health_data():
    return data.to_dict(orient="records")

@router.get("/health/years")
async def get_all_years():
    years = sorted(data["Year"].dropna().unique().tolist())
    return {"years": years}

@router.get("/health/year/{year}")
async def get_health_by_year(year: int):
    filtered_data = data[data["Year"] == year]
    if filtered_data.empty:
        return {"error": "No data for this year"}
    return filtered_data.to_dict(orient="records")

@router.get("/health/country/{country}")
async def get_health_by_country(country: str):
    filtered_data = data[data["Country"].str.lower() == country.lower()]
    if filtered_data.empty:
        return {"error": "Country not found"}
    return filtered_data.to_dict(orient="records")

@router.get("/health/country/{country}/year/{year}")
async def get_health_by_country_and_year(country: str, year: int):
    filtered_data = data[
        (data["Country"].str.lower() == country.lower()) & (data["Year"] == year)
    ]
    if filtered_data.empty:
        return {"error": "No data for this country and year"}
    return filtered_data.to_dict(orient="records")
