from fastapi import APIRouter
import pandas as pd

router = APIRouter()


data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/political_stability_cleaned.csv"
data = pd.read_csv(data_file_path)

@router.get("/stability")
async def get_all_stability_data():
    return data.to_dict(orient="records")

@router.get("/stability/years")
async def get_all_years():
    years = sorted(data["Year"].unique().tolist())
    return {"years": years}

@router.get("/stability/year/{year}")
async def get_stability_by_year(year: int):
    filtered_data = data[data["Year"] == year]
    if filtered_data.empty:
        return {"error": "No data for this year"}
    return filtered_data.to_dict(orient="records")

@router.get("/stability/country/{country}")
async def get_stability_by_country(country: str):
    filtered_data = data[data["Country"].str.lower() == country.lower()]
    if filtered_data.empty:
        return {"error": "Country not found"}
    return filtered_data.to_dict(orient="records")

@router.get("/stability/country/{country}/year/{year}")
async def get_stability_by_country_and_year(country: str, year: int):
    filtered_data = data[
        (data["Country"].str.lower() == country.lower()) & (data["Year"] == year)
    ]
    if filtered_data.empty:
        return {"error": "No data for this country and year"}
    return filtered_data.to_dict(orient="records")
