from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import asyncio
import json
from datetime import datetime
from ..database import get_db
from ..models.user import Quiz, QuizQuestion, UserQuizResult, User, AssessmentQuizAttempt
from ..schemas import QuizCreate, QuizResponse, QuizSubmission, QuizResultResponse, QuizQuestionResponse
from ..utils.auth import get_current_user
from ..utils.mistral import generate_quiz_questions, get_fallback_questions

router = APIRouter(tags=["quiz"])

@router.get("/", response_model=List[QuizResponse])
def get_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.is_active == True).all()
    result = []

    for quiz in quizzes:
        questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
        quiz_data = {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "category": quiz.category,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "option_a": q.option_a,
                    "option_b": q.option_b,
                    "option_c": q.option_c,
                    "option_d": q.option_d,
                    "points": q.points
                } for q in questions
            ]
        }
        result.append(quiz_data)

    return result

@router.get("/assessment")
async def get_assessment_quiz(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get user's assessment quiz attempts"""
    attempts = db.query(AssessmentQuizAttempt).filter(
        AssessmentQuizAttempt.user_id == current_user.id
    ).order_by(AssessmentQuizAttempt.started_at.desc()).all()
    
    return {
        "attempts": [
            {
                "id": attempt.id,
                "attempt_number": attempt.attempt_number,
                "total_score": attempt.total_score,
                "max_score": attempt.max_score,
                "percentage": attempt.percentage,
                "category_scores": attempt.category_scores,
                "started_at": attempt.started_at,
                "completed_at": attempt.completed_at,
                "is_completed": attempt.completed_at is not None
            }
            for attempt in attempts
        ],
        "total_attempts": len(attempts)
    }

@router.post("/assessment/create")
async def create_assessment_quiz(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new assessment quiz attempt using Mistral AI"""
    categories = ["Network Security", "Web Security", "Cryptography", "Linux Fundamentals", "Penetration Testing", "Incident Response"]

    all_questions = []
    question_id = 1

    for category in categories:
        try:
            # Generate unique questions for each user using Mistral AI
            questions = await generate_quiz_questions(category, num_questions=3)

            for q in questions:
                all_questions.append({
                    "id": question_id,
                    "quiz_id": categories.index(category) + 1,
                    "category": category,
                    "question": q["question"],
                    "option_a": q["option_a"],
                    "option_b": q["option_b"],
                    "option_c": q["option_c"],
                    "option_d": q["option_d"],
                    "correct_answer": q["correct_answer"],
                    "points": q.get("points", 10)
                })
                question_id += 1
        except Exception as e:
            print(f"Error generating questions for {category}: {e}")
            # Use fallback questions
            fallback = get_fallback_questions(category, 3)
            for q in fallback:
                all_questions.append({
                    "id": question_id,
                    "quiz_id": categories.index(category) + 1,
                    "category": category,
                    "question": q["question"],
                    "option_a": q["option_a"],
                    "option_b": q["option_b"],
                    "option_c": q["option_c"],
                    "option_d": q["option_d"],
                    "correct_answer": q["correct_answer"],
                    "points": q.get("points", 10)
                })
                question_id += 1

    # Get attempt number
    existing_attempts = db.query(AssessmentQuizAttempt).filter(
        AssessmentQuizAttempt.user_id == current_user.id
    ).count()
    attempt_number = existing_attempts + 1

    # Create and save the attempt
    attempt = AssessmentQuizAttempt(
        user_id=current_user.id,
        attempt_number=attempt_number,
        questions=all_questions,
        max_score=sum(q.get("points", 10) for q in all_questions)
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "questions": all_questions,
        "total": len(all_questions),
        "attempt_number": attempt_number
    }

@router.get("/assessment/{attempt_id}")
async def get_assessment_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific assessment quiz attempt"""
    attempt = db.query(AssessmentQuizAttempt).filter(
        AssessmentQuizAttempt.id == attempt_id,
        AssessmentQuizAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    return {
        "id": attempt.id,
        "attempt_number": attempt.attempt_number,
        "questions": attempt.questions,
        "answers": attempt.answers,
        "total_score": attempt.total_score,
        "max_score": attempt.max_score,
        "percentage": attempt.percentage,
        "category_scores": attempt.category_scores,
        "started_at": attempt.started_at,
        "completed_at": attempt.completed_at,
        "is_completed": attempt.completed_at is not None
    }

@router.post("/submit")
def submit_quiz(submission: QuizSubmission, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == submission.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()

    score = 0
    max_score = 0

    for question in questions:
        max_score += question.points
        answer = submission.answers.get(str(question.id))
        if answer and answer.lower() == question.correct_answer.lower():
            score += question.points

    percentage = (score / max_score * 100) if max_score > 0 else 0

    # Save result
    result = UserQuizResult(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score,
        max_score=max_score,
        percentage=percentage
    )
    db.add(result)

    # Mark quiz as completed for user
    current_user.quiz_completed = True

    db.commit()

    return {
        "quiz_id": quiz.id,
        "score": score,
        "max_score": max_score,
        "percentage": percentage,
        "category": quiz.category
    }

@router.post("/submit-assessment")
def submit_assessment(submission: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Submit answers for dynamically generated assessment"""
    attempt_id = submission.get("attempt_id")
    answers = submission.get("answers", submission)
    questions_data = submission.get("questions", [])

    if not attempt_id:
        raise HTTPException(status_code=400, detail="attempt_id is required")

    # Get the attempt
    attempt = db.query(AssessmentQuizAttempt).filter(
        AssessmentQuizAttempt.id == attempt_id,
        AssessmentQuizAttempt.user_id == current_user.id
    ).first()
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    
    if attempt.completed_at:
        raise HTTPException(status_code=400, detail="This attempt has already been completed")

    # Use questions from attempt if not provided
    if not questions_data:
        questions_data = attempt.questions

    results = []
    category_scores = {}
    total_score = 0
    max_score = 0

    # Score the quiz
    for q in questions_data:
        category = q.get("category", "Unknown")
        if category not in category_scores:
            category_scores[category] = {"score": 0, "max_score": 0}

        points = q.get("points", 10)
        category_scores[category]["max_score"] += points
        max_score += points

        answer = answers.get(str(q["id"]))
        if answer and answer.lower() == q.get("correct_answer", "").lower():
            category_scores[category]["score"] += points
            total_score += points

    # Calculate percentages
    overall_percentage = (total_score / max_score * 100) if max_score > 0 else 0
    
    for category, scores in category_scores.items():
        percentage = (scores["score"] / scores["max_score"] * 100) if scores["max_score"] > 0 else 0

        # Determine quiz_id based on category (map to existing quizzes if available)
        quiz_id_to_use = 1  # Default
        categories = ["Network Security", "Web Security", "Cryptography", "Linux Fundamentals", "Penetration Testing", "Incident Response"]
        try:
            static_quiz = db.query(Quiz).filter(Quiz.category == category).first()
            if static_quiz:
                quiz_id_to_use = static_quiz.id
            else:
                # Map to index-based quiz_id for known categories
                if category in categories:
                    quiz_id_to_use = categories.index(category) + 1
        except Exception as e:
            print(f"Error finding quiz for category {category}: {e}")
            quiz_id_to_use = 1

        # Create UserQuizResult entry for ranking
        result_entry = UserQuizResult(
            user_id=current_user.id,
            quiz_id=quiz_id_to_use,
            score=scores["score"],
            max_score=scores["max_score"],
            percentage=percentage
        )
        db.add(result_entry)

        results.append({
            "quiz_id": quiz_id_to_use,
            "category": category,
            "score": scores["score"],
            "max_score": scores["max_score"],
            "percentage": percentage
        })

    # Update the attempt
    attempt.answers = answers
    attempt.total_score = total_score
    attempt.max_score = max_score
    attempt.percentage = overall_percentage
    attempt.category_scores = category_scores
    attempt.completed_at = datetime.utcnow()
    
    # Mark quiz as completed for user
    current_user.quiz_completed = True
    db.commit()

    return {
        "attempt_id": attempt.id,
        "results": results,
        "total_score": total_score,
        "max_score": max_score,
        "overall_percentage": overall_percentage,
        "quiz_completed": True
    }

@router.get("/results", response_model=List[QuizResultResponse])
def get_quiz_results(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(UserQuizResult).filter(UserQuizResult.user_id == current_user.id).all()
    response = []

    for result in results:
        quiz = db.query(Quiz).filter(Quiz.id == result.quiz_id).first()
        response.append({
            "quiz_id": result.quiz_id,
            "score": result.score,
            "max_score": result.max_score,
            "percentage": result.percentage,
            "category": quiz.category if quiz else "Unknown"
        })

    return response

@router.post("/create")
def create_quiz(quiz_data: QuizCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    quiz = Quiz(
        title=quiz_data.title,
        description=quiz_data.description,
        category=quiz_data.category
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for q in quiz_data.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct_answer=q.correct_answer,
            points=q.points
        )
        db.add(question)

    db.commit()

    return {"message": "Quiz created", "quiz_id": quiz.id}
