from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, labs, users, courses, quiz, admin, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ISC Cyber Range API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(labs.router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(quiz.router)
app.include_router(admin.router)
app.include_router(dashboard.router)

@app.get("/")
def root():
    return {"message": "ISC Cyber Range API", "status": "online"}
