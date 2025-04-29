from fastapi import APIRouter
import pandas as pd

router = APIRouter()

data_file_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/medals.csv"
data = pd.read_csv(data_file_path)

@router.get("/medals")
async def get_medals():
    return data.to_dict(orient="records")

@router.get("/medals/years")
async def get_all_years():
    years = sorted(data['Year'].unique().tolist())
    return {"years": years}

@router.get("/medals/year/{year}")
async def get_medals_by_year(year: int):
    filtered_data = data[data['Year'] == year]
    if filtered_data.empty:
        return {"error": "No data for this year"}
    return filtered_data.to_dict(orient="records")

@router.get("/medals/aggregate")
async def get_aggregate_medals():
    aggregated = data.groupby("Country")[["Gold", "Silver", "Bronze", "Total"]].sum().reset_index()
    aggregated = aggregated.sort_values(by="Total", ascending=False)
    return aggregated.to_dict(orient="records")

@router.get("/medals/trend/{country}")
async def get_medal_trend(country: str):
    trend = data[data['Country'].str.lower() == country.lower()]
    if trend.empty:
        return {"error": "Country not found"}
    return trend.sort_values(by="Year").to_dict(orient="records")

@router.get("/medals/top/{year}")
async def get_top_countries_by_year(year: int, top_n: int = 10):
    year_data = data[data['Year'] == year]
    if year_data.empty:
        return {"error": "No data for this year"}
    top_countries = year_data.sort_values(by="Total", ascending=False).head(top_n)
    return top_countries.to_dict(orient="records")

@router.get("/medals/{country}")
async def get_medals_by_country(country: str):
    filtered_data = data[data['Country'].str.lower() == country.lower()]
    if filtered_data.empty:
        return {"error": "Country not found"}
    return filtered_data.to_dict(orient="records")