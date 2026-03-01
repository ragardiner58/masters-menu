/* Masters Dinner Menu Generator
   - Pure vanilla JS
   - Real-time state sync between form and menu previews
   - SPA two-page flow: builder + final print view
*/

(() => {
  const MAX_COURSES = 6;
  const MAX_DISHES = 3;
  const LOGO_PATH = "../../alden/ancg_logo.png";

  const state = {
    hostName: "",
    eventDate: "",
    note: "",
    courses: []
  };

  let courseIdCounter = 1;
  let dishIdCounter = 1;

  const formPage = document.getElementById("formPage");
  const printPage = document.getElementById("printPage");

  const menuForm = document.getElementById("menuForm");
  const hostNameInput = document.getElementById("hostName");
  const eventDateInput = document.getElementById("eventDate");
  const noteInput = document.getElementById("personalNote");

  const coursesContainer = document.getElementById("coursesContainer");
  const addCourseBtn = document.getElementById("addCourseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const livePreview = document.getElementById("livePreview");
  const finalPreview = document.getElementById("finalPreview");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const startOverBtn = document.getElementById("startOverBtn");

  const courseTemplate = document.getElementById("courseTemplate");
  const dishTemplate = document.getElementById("dishTemplate");

  function createDish() {
    return {
      id: `dish-${dishIdCounter++}`,
      name: "",
      description: ""
    };
  }

  function createCourse() {
    return {
      id: `course-${courseIdCounter++}`,
      title: "",
      dishes: [createDish()]
    };
  }

  function initState() {
    state.courses = [createCourse()];
  }

  function setActivePage(page) {
    if (page === "form") {
      formPage.classList.add("active");
      printPage.classList.remove("active");
      return;
    }
    formPage.classList.remove("active");
    printPage.classList.add("active");
  }

  function syncTopLevelInputsToState() {
    state.hostName = hostNameInput.value.trim();
    state.eventDate = eventDateInput.value.trim();
    state.note = noteInput.value.trim();
  }

  function esc(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderCourseEditors() {
    coursesContainer.innerHTML = "";

    state.courses.forEach((course, courseIndex) => {
      const courseNode = courseTemplate.content.firstElementChild.cloneNode(true);

      const titleInput = courseNode.querySelector(".course-title-input");
      titleInput.value = course.title;
      titleInput.addEventListener("input", (event) => {
        state.courses[courseIndex].title = event.target.value;
        renderPreviews();
      });

      const removeCourseBtn = courseNode.querySelector(".remove-course-btn");
      removeCourseBtn.disabled = state.courses.length === 1;
      removeCourseBtn.addEventListener("click", () => {
        if (state.courses.length <= 1) return;
        state.courses = state.courses.filter((item) => item.id !== course.id);
        renderCourseEditors();
        renderPreviews();
      });

      const dishesContainer = courseNode.querySelector(".dishes-container");

      course.dishes.forEach((dish, dishIndex) => {
        const dishNode = dishTemplate.content.firstElementChild.cloneNode(true);

        const dishNameInput = dishNode.querySelector(".dish-name-input");
        dishNameInput.value = dish.name;
        dishNameInput.addEventListener("input", (event) => {
          state.courses[courseIndex].dishes[dishIndex].name = event.target.value;
          renderPreviews();
        });

        const dishDescInput = dishNode.querySelector(".dish-desc-input");
        dishDescInput.value = dish.description;
        dishDescInput.addEventListener("input", (event) => {
          state.courses[courseIndex].dishes[dishIndex].description = event.target.value;
          renderPreviews();
        });

        const removeDishBtn = dishNode.querySelector(".remove-dish-btn");
        removeDishBtn.disabled = course.dishes.length === 1;
        removeDishBtn.addEventListener("click", () => {
          if (state.courses[courseIndex].dishes.length <= 1) return;

          state.courses[courseIndex].dishes = state.courses[courseIndex].dishes.filter(
            (item) => item.id !== dish.id
          );

          renderCourseEditors();
          renderPreviews();
        });

        dishesContainer.appendChild(dishNode);
      });

      const addDishBtn = courseNode.querySelector(".add-dish-btn");
      addDishBtn.disabled = course.dishes.length >= MAX_DISHES;
      addDishBtn.addEventListener("click", () => {
        if (state.courses[courseIndex].dishes.length >= MAX_DISHES) return;
        state.courses[courseIndex].dishes.push(createDish());
        renderCourseEditors();
        renderPreviews();
      });

      coursesContainer.appendChild(courseNode);
    });

    addCourseBtn.disabled = state.courses.length >= MAX_COURSES;
  }

  function buildMenuMarkup() {
    const coursesMarkup = state.courses
      .map((course, index) => {
        const courseTitle = (course.title || "").trim() || `Course ${index + 1}`;
        const dishes = course.dishes.filter((dish) => dish.name.trim().length > 0);

        if (!dishes.length) return "";

        const dishesMarkup = dishes
          .map((dish) => {
            const name = esc(dish.name.trim());
            const desc = dish.description.trim();

            return `
              <li class="menu-dish">
                <div class="dish-name">${name}</div>
                ${desc ? `<div class="dish-desc">${esc(desc)}</div>` : ""}
              </li>
            `;
          })
          .join("");

        return `
          <li class="menu-course">
            <h4 class="menu-course-title">${esc(courseTitle)}</h4>
            <ul class="menu-dishes">${dishesMarkup}</ul>
          </li>
        `;
      })
      .filter(Boolean)
      .join("");

    return `
      <div class="menu-inner">
        <div class="menu-top-rule"></div>

        <div class="menu-logo-wrap">
          <img class="menu-logo" src="${LOGO_PATH}" alt="Augusta National Golf Club logo" />
        </div>

        <h3 class="menu-fixed-title">Masters Club Dinner</h3>
        ${state.eventDate ? `<div class="menu-date">${esc(state.eventDate)}</div>` : ""}

        ${coursesMarkup ? `<ul class="menu-courses">${coursesMarkup}</ul>` : ""}

        ${state.note ? `<div class="menu-bottom-rule"></div><p class="menu-note">“${esc(state.note)}”</p>` : ""}

        ${
          state.hostName
            ? `<p class="menu-host-honor">Served in Honor of ${esc(state.hostName)}</p>`
            : ""
        }
      </div>
    `;
  }

  function renderPreviews() {
    const markup = buildMenuMarkup();
    livePreview.innerHTML = markup;
    finalPreview.innerHTML = markup;
  }

  function hasValidRequiredDishNames() {
    return state.courses.every((course) =>
      course.dishes.every((dish) => dish.name.trim().length > 0)
    );
  }

  function validateBeforeReview() {
    syncTopLevelInputsToState();
    const topLevelValid = state.hostName.length > 0 && state.eventDate.length > 0;
    return topLevelValid && hasValidRequiredDishNames();
  }

  function resetFormToDefault() {
    hostNameInput.value = "";
    eventDateInput.value = "";
    noteInput.value = "";

    state.hostName = "";
    state.eventDate = "";
    state.note = "";
    state.courses = [createCourse()];

    renderCourseEditors();
    renderPreviews();
    setActivePage("form");
  }

  menuForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateBeforeReview()) {
      alert("Please complete Host Name, Date, and every Dish Name before reviewing.");
      return;
    }

    renderPreviews();
    setActivePage("print");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  [hostNameInput, eventDateInput, noteInput].forEach((input) => {
    input.addEventListener("input", () => {
      syncTopLevelInputsToState();
      renderPreviews();
    });
  });

  addCourseBtn.addEventListener("click", () => {
    if (state.courses.length >= MAX_COURSES) return;
    state.courses.push(createCourse());
    renderCourseEditors();
    renderPreviews();
  });

  resetBtn.addEventListener("click", () => {
    resetFormToDefault();
  });

  startOverBtn.addEventListener("click", () => {
    resetFormToDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  downloadPdfBtn.addEventListener("click", () => {
    window.print();
  });

  initState();
  renderCourseEditors();
  renderPreviews();
  setActivePage("form");
})();
