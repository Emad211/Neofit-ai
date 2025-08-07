-- Users and analytical profiles
CREATE TABLE Users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE UserProfiles (
    user_id UUID PRIMARY KEY REFERENCES Users(id),
    dob DATE,
    gender TEXT,
    height_cm INT,
    -- ... all Onboarding data
    weight_kg DECIMAL(5,2),
    body_type TEXT,
    fitness_level TEXT,
    training_days_per_week INT,
    lifestyle TEXT,
    disliked_foods TEXT[],
    medical_history TEXT,
    primary_goal TEXT
);

CREATE TABLE UserAnalysisProfiles (
    user_id UUID PRIMARY KEY REFERENCES Users(id),
    risk_level TEXT,
    contraindications JSONB, -- ['high_impact_jumping']
    tdee INT, -- Total Daily Energy Expenditure
    macros_target JSONB, -- {"protein": 150, "carbs": 200, "fat": 60}
    fitness_level TEXT, -- beginner, intermediate
    recommended_split TEXT, -- full_body
    updated_at TIMESTAMPTZ
);

-- User logs
CREATE TABLE WeightLogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    weight_kg DECIMAL(5,2),
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE FoodLogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    meal_type TEXT,
    description TEXT,
    calories INT,
    protein_g INT,
    carbs_g INT,
    fat_g INT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE WorkoutSessionLogs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    workout_plan_id INT,
    duration_minutes INT,
    total_volume_kg DECIMAL(10,2),
    session_date DATE,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ExerciseLogs (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES WorkoutSessionLogs(id),
    exercise_name TEXT,
    set_number INT,
    reps INT,
    weight_kg DECIMAL(5,2)
);

-- Generated plans
CREATE TABLE WorkoutPlans (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    plan_details JSONB -- e.g., [{"day": 1, "title": "Full Body A", "exercises": [...]}]
);

CREATE TABLE MealPlans (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    plan_details JSONB -- e.g., [{"day": "Monday", "meals": [...]}]
);
