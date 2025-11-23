from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import asyncio
from ..database import get_db
from ..models.user import Quiz, QuizQuestion, UserQuizResult, User
from ..schemas import QuizCreate, QuizResponse, QuizSubmission, QuizResultResponse, QuizQuestionResponse
from ..utils.auth import get_current_user
from ..utils.mistral import generate_quiz_questions, get_fallback_questions

router = APIRouter(prefix="/quiz", tags=["quiz"])

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
    """Get dynamically generated quiz questions using Mistral AI"""
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

    return {"questions": all_questions, "total": len(all_questions)}

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
    answers = submission.get("answers", submission)
    questions_data = submission.get("questions", [])

    results = []
    category_scores = {}
    categories = ["Network Security", "Web Security", "Cryptography", "Linux Fundamentals", "Penetration Testing", "Incident Response"]

    # If questions_data provided, use it for scoring
    if questions_data:
        for q in questions_data:
            category = q.get("category", "Unknown")
            if category not in category_scores:
                category_scores[category] = {"score": 0, "max_score": 0}

            points = q.get("points", 10)
            category_scores[category]["max_score"] += points

            answer = answers.get(str(q["id"]))
            if answer and answer.lower() == q.get("correct_answer", "").lower():
                category_scores[category]["score"] += points
    else:
        # Fallback: assume 3 questions per category, 10 points each
        for i, (qid, answer) in enumerate(answers.items()):
            cat_idx = int(qid) // 4  # Rough category mapping
            if cat_idx < len(categories):
                category = categories[cat_idx]
            else:
                category = categories[0]

            if category not in category_scores:
                category_scores[category] = {"score": 0, "max_score": 0}

            category_scores[category]["max_score"] += 10
            # For fallback, give partial credit
            category_scores[category]["score"] += 5

    # Save results
    for category, scores in category_scores.items():
        percentage = (scores["score"] / scores["max_score"] * 100) if scores["max_score"] > 0 else 0

        # Create a dummy quiz result (we're using dynamic generation)
        result = UserQuizResult(
            user_id=current_user.id,
            quiz_id=categories.index(category) + 1 if category in categories else 1,
            score=scores["score"],
            max_score=scores["max_score"],
            percentage=percentage
        )
        db.add(result)

        results.append({
            "quiz_id": categories.index(category) + 1 if category in categories else 1,
            "category": category,
            "score": scores["score"],
            "max_score": scores["max_score"],
            "percentage": percentage
        })

    current_user.quiz_completed = True
    db.commit()

    return {"results": results, "quiz_completed": True}

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
