# app/dimensionality_reduction.py
from fastapi import APIRouter
from pydantic import BaseModel
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
from typing import List

router = APIRouter()

# Define the input model for dimensionality reduction
class CountryData(BaseModel):
    country: str
    population: float
    psi: float
    medals: int

class DimensionalityReductionResponse(BaseModel):
    country: str
    pca1: float
    pca2: float
    medals: int
    cluster: int

# Function for PCA (Principal Component Analysis)
def perform_pca(data: List[CountryData], n_components: int = 2):
    # Convert data into a Pandas DataFrame
    df = pd.DataFrame([{
        'country': d.country,
        'population': d.population,
        'psi': d.psi,
        'medals': d.medals
    } for d in data])
    
    # Prepare the features for PCA
    features = ['population', 'psi', 'medals']
    X = df[features].values
    
    # Standardize the data (important for PCA)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Perform PCA
    pca = PCA(n_components=n_components)
    pca_components = pca.fit_transform(X_scaled)
    
    # Add PCA results to the dataframe
    df['pca1'] = pca_components[:, 0]
    df['pca2'] = pca_components[:, 1]
    
    # Return the result
    return df

# Define the route for PCA
@router.post("/pca", response_model=List[DimensionalityReductionResponse])
async def pca(data: List[CountryData]):
    # Perform PCA on the received data
    pca_result = perform_pca(data)
    
    # Create clusters based on PCA
    from sklearn.cluster import KMeans
    kmeans = KMeans(n_clusters=4)
    pca_result['cluster'] = kmeans.fit_predict(pca_result[['pca1', 'pca2']])
    
    # Prepare the response
    result = [
        DimensionalityReductionResponse(
            country=row['country'],
            pca1=row['pca1'],
            pca2=row['pca2'],
            medals=row['medals'],
            cluster=row['cluster']
        )
        for _, row in pca_result.iterrows()
    ]
    
    return result
