-- Users and their detailed profiles
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE UserProfiles (
    user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT,
    height_cm INT,
    weight_kg DECIMAL(5, 1),
    body_type TEXT, -- ectomorph, mesomorph, endomorph
    fitness_level TEXT, -- beginner, intermediate, advanced
    training_days_per_week INT,
    lifestyle TEXT, -- sedentary, lightly_active, etc.
    disliked_foods TEXT[],
    medical_history TEXT,
    primary_goal TEXT -- lose_weight, gain_muscle, improve_fitness
);

-- AI-generated analysis based on onboarding data
CREATE TABLE UserAnalysisProfiles (
    user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
    risk_level TEXT, -- low, medium, high
    contraindications JSONB, -- e.g., ['high_impact_jumping']
    tdee INT, -- Total Daily Energy Expenditure
    macros_target JSONB, -- e.g., {"protein": 150, "carbs": 200, "fat": 60}
    recommended_split TEXT, -- e.g., full_body, upper_lower
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-generated logs
CREATE TABLE WeightLogs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    weight_kg DECIMAL(5, 1) NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE FoodLogs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    meal_type TEXT, -- Breakfast, Lunch, Dinner, Snack
    description TEXT NOT NULL,
    calories INT,
    protein_g INT,
    carbs_g INT,
    fat_g INT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE WorkoutSessionLogs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    workout_plan_id INT, -- FK to WorkoutPlans
    duration_minutes INT,
    total_volume_kg DECIMAL(10, 2),
    session_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE ExerciseLogs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES WorkoutSessionLogs(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    set_number INT NOT NULL,
    reps INT,
    weight_kg DECIMAL(5, 2)
);

-- AI-generated plans
CREATE TABLE WorkoutPlans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    plan_data JSONB, -- The full workout plan structure
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE MealPlans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    plan_data JSONB, -- The full meal plan structure
    created_at TIMESTAMPTZ DEFAULT NOW()
);
