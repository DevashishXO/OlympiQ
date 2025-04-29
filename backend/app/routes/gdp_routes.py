from fastapi import APIRouter, HTTPException, Query
import pandas as pd

router = APIRouter()

data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/gdp_total_cleaned.csv"
gdp_data = pd.read_csv(data_file_path)

gdp_data.columns = gdp_data.columns.str.strip()

# Get all GDP records
@router.get("/gdp")
async def get_all_gdp():
    return gdp_data.to_dict(orient="records")

# Get GDP for a specific country
@router.get("/gdp/{country}")
async def get_gdp_by_country(country: str):
    filtered = gdp_data[gdp_data["Country"].str.lower() == country.lower()]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Country not found")
    return filtered.to_dict(orient="records")

# Get GDP for a specific year
@router.get("/gdp/year/{year}")
async def get_gdp_by_year(year: int):
    filtered = gdp_data[gdp_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="No GDP data for given year")
    return filtered.to_dict(orient="records")

# Get GDP trend for a specific country (year-wise data)
@router.get("/gdp/trend/{country}")
async def get_gdp_trend(country: str):
    filtered = gdp_data[gdp_data["Country"].str.lower() == country.lower()]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Country not found")
    trend = filtered.sort_values("Year")[["Year", "GDP (total)"]]
    return trend.to_dict(orient="records")

# Get top N countries by GDP in a given year
@router.get("/gdp/top/{year}")
async def get_top_gdp_countries(year: int, top_n: int = Query(10, gt=0)):
    filtered = gdp_data[gdp_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Year not found")
    top = filtered.sort_values("GDP (total)", ascending=False).head(top_n)
    return top[["Country", "GDP (total)"]].to_dict(orient="records")