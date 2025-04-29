from fastapi import APIRouter, Query
import pandas as pd
from scipy.stats import kendalltau, pearsonr

router = APIRouter()

# Load datasets
medals = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/medals.csv")
gdp = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/gdp_total_cleaned.csv")
gdp_per_capita = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/gdp_per_capita_cleaned.csv")
education_exp = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/education_expenditure_cleaned.csv")
health_exp = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/health_expenditure_cleaned.csv")
life_expectancy = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/life_expectancy_cleaned.csv")
literacy_rate = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/literacy_rate_cleaned.csv")
political_stability = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/political_stability_cleaned.csv")
population = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/population_cleaned.csv")
urban_population = pd.read_csv("/Users/miheergautam/Documents/GitHub/OLYMPIQ-Visual-Analytics/backend/app/data/processed/urban_population_cleaned.csv")

# Mapping factor names to dataframes and columns
factor_mapping = {
    "gdp": (gdp, "GDP (total)"),
    "gdp_per_capita": (gdp_per_capita, "GDP per capita"),
    "education_exp": (education_exp, "Education Exp (%GDP)"),
    "health_exp": (health_exp, "Health Exp (%GDP)"),
    "life_expectancy": (life_expectancy, "Life Expectancy"),
    "literacy_rate": (literacy_rate, "Literacy Rate (% 15+)"),
    "political_stability": (political_stability, "Political Stability Index"),
    "population": (population, "Population"),
    "urban_population": (urban_population, "Urban Population (%)"),
}

@router.get("/correlation")
async def calculate_correlation(
    factor: str = Query(..., description="Factor to correlate with medal counts"),
    medal_type: str = Query("Total", description="Medal type: Gold, Silver, Bronze, or Total"),
    method: str = Query("pearson", description="Correlation method: 'pearson' or 'kendall'")
):
    factor = factor.lower()
    method = method.lower()
    
    if factor not in factor_mapping:
        return {"error": f"Invalid factor. Choose from {list(factor_mapping.keys())}"}
    
    if medal_type not in ["Gold", "Silver", "Bronze", "Total"]:
        return {"error": "Invalid medal_type. Choose from Gold, Silver, Bronze, Total."}
    
    if method not in ["pearson", "kendall"]:
        return {"error": "Invalid method. Choose 'pearson' or 'kendall'."}
    
    factor_df, factor_column = factor_mapping[factor]
    
    # Merge medal data and factor data on Country and Year
    merged = pd.merge(
        medals[["Country", "Year", medal_type]],
        factor_df[["Country", "Year", factor_column]],
        on=["Country", "Year"],
        how="inner"
    ).dropna()

    if merged.empty:
        return {"error": "No overlapping data between medals and selected factor."}
    
    x = merged[medal_type]
    y = merged[factor_column]

    # Calculate correlation
    if method == "pearson":
        corr, p_value = pearsonr(x, y)
    else:  # kendall
        corr, p_value = kendalltau(x, y)
    
    return {
        "factor": factor,
        "medal_type": medal_type,
        "method": method,
        "correlation_coefficient": corr,
        "p_value": p_value,
        "n_samples": len(merged)
    }