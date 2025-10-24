const API_BASE = "https://www.themealdb.com/api/json/v1/1";
const areaSelect = document.getElementById("areaSelect");
const recipesGrid = document.getElementById("recipesGrid");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const modal = document.getElementById("recipeModal");

// Fetch and populate areas
async function loadAreas() {
  try {
    const response = await fetch(`${API_BASE}/list.php?a=list`);
    const data = await response.json();

    // Create and prepend the "Random Cuisine" option so it's the first one
    const randomOption = document.createElement("option");
    randomOption.value = "random";
    randomOption.textContent = "Random Cuisine";
    // Insert at the top of the select
    areaSelect.prepend(randomOption);

    data.meals.forEach((meal) => {
      const option = document.createElement("option");
      option.value = meal.strArea;
      option.textContent = meal.strArea;
      areaSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading areas:", error);
  }
}

// Fetch recipes by area
async function loadRecipesByArea(area) {
  loading.style.display = "block";
  emptyState.style.display = "none";
  recipesGrid.innerHTML = "";

  try {
    const response = await fetch(`${API_BASE}/filter.php?a=${area}`);
    const data = await response.json();

    loading.style.display = "none";

    if (data.meals) {
      data.meals.forEach((meal) => {
        const card = createRecipeCard(meal);
        recipesGrid.appendChild(card);
      });
    } else {
      emptyState.innerHTML =
        "<h2>No recipes found</h2><p>Try selecting a different cuisine</p>";
      emptyState.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading recipes:", error);
    loading.style.display = "none";
    emptyState.innerHTML =
      "<h2>Error loading recipes</h2><p>Please try again later</p>";
    emptyState.style.display = "block";
  }
}

// Create recipe card
function createRecipeCard(meal) {
  const card = document.createElement("div");
  card.className = "recipe-card";
  card.onclick = () => showRecipeDetail(meal.idMeal);

  card.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="recipe-card-content">
            <h3>${meal.strMeal}</h3>
            <p class="category">Click to view recipe</p>
        </div>
    `;

  return card;
}

// Show recipe detail
async function showRecipeDetail(mealId) {
  try {
    const response = await fetch(`${API_BASE}/lookup.php?i=${mealId}`);
    const data = await response.json();

    if (data.meals && data.meals[0]) {
      const meal = data.meals[0];
      displayRecipeDetail(meal);
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  } catch (error) {
    console.error("Error loading recipe detail:", error);
  }
}

// Display recipe detail in modal
function displayRecipeDetail(meal) {
  document.getElementById("modalImage").src = meal.strMealThumb;
  document.getElementById("modalTitle").textContent = meal.strMeal;

  // Recipe meta
  const meta = document.getElementById("recipeMeta");
  meta.innerHTML = `
        <span class="meta-tag"><strong>Category:</strong> ${
          meal.strCategory
        }</span>
        <span class="meta-tag"><strong>Cuisine:</strong> ${meal.strArea}</span>
        ${
          meal.strTags
            ? `<span class="meta-tag"><strong>Tags:</strong> ${meal.strTags}</span>`
            : ""
        }
    `;

  // Ingredients
  const ingredientsList = document.getElementById("ingredientsList");
  ingredientsList.innerHTML = "";

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      const item = document.createElement("div");
      item.className = "ingredient-item";
      item.textContent = `${measure} ${ingredient}`;
      ingredientsList.appendChild(item);
    }
  }

  // Instructions
  document.getElementById("instructions").textContent = meal.strInstructions;

  // Video
  const videoSection = document.getElementById("videoSection");
  const videoWrapper = document.getElementById("videoWrapper");

  if (meal.strYoutube) {
    const videoId = meal.strYoutube.split("v=")[1];
    videoWrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
    videoSection.style.display = "block";
  } else {
    videoSection.style.display = "none";
  }
}

// Close modal
function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Close modal on outside click
modal.onclick = function (event) {
  if (event.target === modal) {
    closeModal();
  }
};

// Close modal on Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

// Fetch a random meal and display it using the existing modal display function
async function getRandomMeal() {
  try {
    // Show loading state while fetching
    loading.style.display = "block";
    emptyState.style.display = "none";
    recipesGrid.innerHTML = "";

    const res = await fetch(`${API_BASE}/random.php`);
    if (!res.ok) {
      throw new Error(`Network response was not ok: ${res.status}`);
    }

    const data = await res.json();
    const meal = data.meals && data.meals[0];
    if (!meal) {
      throw new Error("No random meal returned from API");
    }

    // Use existing displayRecipeDetail to populate the modal
    displayRecipeDetail(meal);
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  } catch (err) {
    console.error("getRandomMeal error:", err);
    emptyState.innerHTML =
      "<h2>Error fetching random meal</h2><p>Please try again later</p>";
    emptyState.style.display = "block";
  } finally {
    loading.style.display = "none";
  }
}

// Area select change handler
areaSelect.addEventListener("change", function () {
  if (this.value === "random") {
    // If user chose Random Cuisine, fetch and show a random meal
    getRandomMeal();
  } else if (this.value) {
    loadRecipesByArea(this.value);
  } else {
    recipesGrid.innerHTML = "";
    emptyState.innerHTML =
      "<h2>Welcome!</h2><p>Select a cuisine from the dropdown above to browse recipes</p>";
    emptyState.style.display = "block";
  }
});