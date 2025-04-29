from fastapi import APIRouter, HTTPException
import pandas as pd

router = APIRouter()

# Load the GDP per capita dataset
gdp_pc_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/gdp_per_capita_cleaned.csv"  
gdp_data = pd.read_csv(gdp_pc_file_path)

gdp_data.rename(columns={"Country Name": "Country"}, inplace=True)

@router.get("/gdp-per-capita")
async def get_all_gdp_per_capita():
    return gdp_data.to_dict(orient="records")

@router.get("/gdp-per-capita/{country}")
async def get_gdp_per_capita_by_country(country: str):
    filtered = gdp_data[gdp_data["Country"].str.lower() == country.lower()]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Country not found")
    return filtered.to_dict(orient="records")

@router.get("/gdp-per-capita/year/{year}")
async def get_gdp_per_capita_by_year(year: int):
    filtered = gdp_data[gdp_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Year not found")
    return filtered.to_dict(orient="records")

@router.get("/gdp-per-capita/top/{year}")
async def get_top_gdp_per_capita(year: int, top_n: int = 10):
    filtered = gdp_data[gdp_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Year not found")
    top = filtered.sort_values(by="GDP per capita", ascending=False).head(top_n)
    return top.to_dict(orient="records")
