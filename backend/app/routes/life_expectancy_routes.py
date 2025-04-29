from fastapi import APIRouter
import pandas as pd

router = APIRouter()

data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/life_expectancy_cleaned.csv"
data = pd.read_csv(data_file_path)

@router.get("/life")
async def get_all_life_expectancy():
    return data.to_dict(orient="records")

@router.get("/life/years")
async def get_all_years():
    years = sorted(data["Year"].dropna().unique().tolist())
    return {"years": years}

@router.get("/life/year/{year}")
async def get_life_by_year(year: int):
    filtered_data = data[data["Year"] == year]
    if filtered_data.empty:
        return {"error": "No data for this year"}
    return filtered_data.to_dict(orient="records")

@router.get("/life/country/{country}")
async def get_life_by_country(country: str):
    filtered_data = data[data["Country"].str.lower() == country.lower()]
    if filtered_data.empty:
        return {"error": "Country not found"}
    return filtered_data.to_dict(orient="records")

@router.get("/life/country/{country}/year/{year}")
async def get_life_by_country_and_year(country: str, year: int):
    filtered_data = data[
        (data["Country"].str.lower() == country.lower()) & (data["Year"] == year)
    ]
    if filtered_data.empty:
        return {"error": "No data for this country and year"}
    return filtered_data.to_dict(orient="records")
