# clusteranalysis.py

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

router = APIRouter()

# Input data model for clustering
class CountryData(BaseModel):
    country: str
    population: float
    psi: float
    medals: int

# Response model including the assigned cluster
class ClusterResponse(CountryData):
    cluster: int

# Core clustering function
def perform_clustering(data: List[CountryData], n_clusters: int = 4) -> pd.DataFrame:
    df = pd.DataFrame([d.dict() for d in data])
    if df.empty:
        raise ValueError("No data provided for clustering.")

    features = ['population', 'psi', 'medals']
    df_clean = df.dropna(subset=features).copy()
    if df_clean.empty:
        return pd.DataFrame(columns=['country', *features, 'cluster'])

    scaler = StandardScaler()
    df_clean[features] = scaler.fit_transform(df_clean[features])

    model = KMeans(n_clusters=n_clusters, random_state=42)
    df_clean['cluster'] = model.fit_predict(df_clean[features])

    return df_clean[['country', *features, 'cluster']]

# API endpoint for clustering
@router.post("/cluster", response_model=List[ClusterResponse])
async def cluster_countries(data: List[CountryData], k: int = 4):
    try:
        clustered_df = perform_clustering(data, n_clusters=k)
    except HTTPException as e:
        raise e  # Reraise the HTTPException
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected server error: {str(e)}")

    # Map clustering results back into Pydantic models
    return [
        ClusterResponse(
            country=row.country,
            population=row.population,
            psi=row.psi,
            medals=int(row.medals),  # Cast medals to an integer
            cluster=int(row.cluster)
        )
        for row in clustered_df.itertuples(index=False)
    ]
