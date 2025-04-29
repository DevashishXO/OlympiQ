from fastapi import APIRouter
import pandas as pd
import numpy as np

router = APIRouter()

data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/population_cleaned.csv"
data = pd.read_csv(data_file_path)

# Replace NaNs with None for safe JSON serialization
data = data.replace({np.nan: None})

@router.get("/population")
async def get_all_population_data():
    return data.to_dict(orient="records")

@router.get("/population/years")
async def get_all_years():
    years = sorted(data["Year"].unique().tolist())
    return {"years": years}

@router.get("/population/year/{year}")
async def get_population_by_year(year: int):
    filtered_data = data[data["Year"] == year]
    if filtered_data.empty:
        return {"error": "No data for this year"}
    return filtered_data.to_dict(orient="records")

@router.get("/population/country/{country}")
async def get_population_by_country(country: str):
    filtered_data = data[data["Country"].str.lower() == country.lower()]
    if filtered_data.empty:
        return {"error": "Country not found"}
    return filtered_data.to_dict(orient="records")

@router.get("/population/country/{country}/year/{year}")
async def get_population_by_country_and_year(country: str, year: int):
    filtered_data = data[
        (data["Country"].str.lower() == country.lower()) & (data["Year"] == year)
    ]
    if filtered_data.empty:
        return {"error": "No data for this country and year"}
    return filtered_data.to_dict(orient="records")
