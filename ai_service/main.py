import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AgroRent AI Service")

# Enable CORS for Mobile/Web apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

class CropQuery(BaseModel):
    crop: str
    soil_type: str = None
    acreage: float = None

class RecommendationResponse(BaseModel):
    recommendations: list[dict]
    reasoning: str
    source: str # 'mock' or 'gemini'

@app.get("/")
def read_root():
    return {"status": "AI Service is running", "gemini_enabled": model is not None}

@app.post("/recommend-equipment", response_model=RecommendationResponse)
async def recommend_equipment(query: CropQuery):
    if not query.crop:
        raise HTTPException(status_code=400, detail="Crop is required")

    # If Gemini is enabled, use real AI
    if model:
        try:
            prompt = f"""
            You are an expert agronomist AI for a platform called AgroRent AI.
            A farmer is planting {query.crop}. 
            {f"The soil type is {query.soil_type}." if query.soil_type else ""}
            {f"They have {query.acreage} acres of land." if query.acreage else ""}
            
            Based on this, what are the top 3 types of farming equipment they will need to rent throughout the crop lifecycle?
            Format your response exactly like this:
            
            Equipment: [Equipment Name]
            Category: [TRACTOR, HARVESTER, or IMPLEMENT]
            Why: [Brief 1 sentence reason]
            ---
            Equipment: [Equipment Name]
            Category: [TRACTOR, HARVESTER, or IMPLEMENT]
            Why: [Brief 1 sentence reason]
            ---
            Equipment: [Equipment Name]
            Category: [TRACTOR, HARVESTER, or IMPLEMENT]
            Why: [Brief 1 sentence reason]
            
            Reasoning: [1 paragraph summarizing the overall strategy for this crop]
            """
            
            response = model.generate_content(prompt)
            text = response.text
            
            # Simple parser for the structured output
            parts = text.split('Reasoning:')
            reasoning = parts[1].strip() if len(parts) > 1 else "Based on agricultural best practices for your crop."
            
            equipments = []
            if len(parts) > 0:
                chunks = parts[0].split('---')
                for chunk in chunks:
                    if 'Equipment:' in chunk:
                        lines = chunk.strip().split('\n')
                        eq = {}
                        for line in lines:
                            if line.startswith('Equipment:'):
                                eq['name'] = line.replace('Equipment:', '').strip()
                            elif line.startswith('Category:'):
                                eq['category'] = line.replace('Category:', '').strip()
                            elif line.startswith('Why:'):
                                eq['why'] = line.replace('Why:', '').strip()
                        if 'name' in eq:
                            equipments.append(eq)
            
            return RecommendationResponse(
                recommendations=equipments,
                reasoning=reasoning,
                source="gemini"
            )
        except Exception as e:
            print(f"Gemini API Error: {e}")
            # Fallback to mock on error
            pass

    # Fallback to Mock AI if Gemini is not configured or failed
    crop_lower = query.crop.lower()
    
    if "wheat" in crop_lower or "rice" in crop_lower or "paddy" in crop_lower:
        recs = [
            {"name": "Heavy Duty Tractor (50+ HP)", "category": "TRACTOR", "why": "Essential for deep ploughing and land preparation."},
            {"name": "Combine Harvester", "category": "HARVESTER", "why": "Crucial for efficient harvesting and threshing of grains."},
            {"name": "Rotavator", "category": "IMPLEMENT", "why": "Used for seedbed preparation and mixing crop residues."}
        ]
        reasoning = f"For grain crops like {query.crop}, timely land preparation and harvesting are critical. Heavy machinery ensures large areas are covered quickly."
    else:
        recs = [
            {"name": "Compact Tractor (30-40 HP)", "category": "TRACTOR", "why": "Versatile for general farm work and inter-culture operations."},
            {"name": "Cultivator", "category": "IMPLEMENT", "why": "For breaking up soil and weed control."},
            {"name": "Seed Drill", "category": "IMPLEMENT", "why": "For precise sowing of seeds."}
        ]
        reasoning = f"Based on standard farming practices for {query.crop}, these implements will help optimize your yield and reduce manual labor."

    return RecommendationResponse(
        recommendations=recs,
        reasoning=reasoning,
        source="mock"
    )
