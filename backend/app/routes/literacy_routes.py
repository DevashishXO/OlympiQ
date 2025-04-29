from fastapi import APIRouter, HTTPException
import pandas as pd
import os

router = APIRouter()

# Update this path based on your actual file location
data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/literacy_rate_cleaned.csv"

# Load the dataset
try:
    data = pd.read_csv(data_file_path)
    data.columns = data.columns.str.strip()  # In case of trailing spaces
except Exception as e:
    print(f"Error loading literacy rate CSV: {e}")
    data = pd.DataFrame()

# Route to return all literacy rate data
@router.get("/literacy")
async def get_all_literacy_data():
    if data.empty:
        raise HTTPException(status_code=500, detail="Literacy data not available")
    return data.to_dict(orient="records")

# Route to return all available years
@router.get("/literacy/years")
async def get_literacy_years():
    if data.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    years = sorted(data["Year"].dropna().unique().tolist())
    return {"years": years}

# Route to get data by year
@router.get("/literacy/year/{year}")
async def get_literacy_by_year(year: int):
    if data.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    filtered = data[data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="No data for this year")
    return filtered.to_dict(orient="records")

# Route to get data by country
@router.get("/literacy/country/{country}")
async def get_literacy_by_country(country: str):
    if data.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    filtered = data[data["Country"].str.lower() == country.lower()]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Country not found")
    return filtered.to_dict(orient="records")

# Route to get data by country and year
@router.get("/literacy/country/{country}/year/{year}")
async def get_literacy_by_country_and_year(country: str, year: int):
    if data.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
    filtered = data[
        (data["Country"].str.lower() == country.lower()) &
        (data["Year"] == year)
    ]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="No data for this country and year")
    return filtered.to_dict(orient="records")
