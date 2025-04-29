from fastapi import APIRouter, HTTPException
import pandas as pd

router = APIRouter()

# Load the Education Expenditure dataset
edu_exp_path = "/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/education_expenditure_cleaned.csv" 
edu_data = pd.read_csv(edu_exp_path)

@router.get("/education-expenditure")
async def get_all_education_data():
    return edu_data.to_dict(orient="records")

@router.get("/education-expenditure/{country}")
async def get_education_data_by_country(country: str):
    filtered = edu_data[edu_data["Country"].str.lower() == country.lower()]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Country not found")
    return filtered.to_dict(orient="records")

@router.get("/education-expenditure/year/{year}")
async def get_education_data_by_year(year: int):
    filtered = edu_data[edu_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Year not found")
    return filtered.to_dict(orient="records")

@router.get("/education-expenditure/top/{year}")
async def get_top_education_expenditure(year: int, top_n: int = 10):
    filtered = edu_data[edu_data["Year"] == year]
    if filtered.empty:
        raise HTTPException(status_code=404, detail="Year not found")
    top = filtered.sort_values(by="Education Exp (%GDP)", ascending=False).head(top_n)
    return top.to_dict(orient="records")
