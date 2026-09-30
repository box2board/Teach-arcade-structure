// Topic resource area now links teachers to Teach Arcade's own subject hub.
// Third-party resource feeds have been retired; no spreadsheet or external resource
// service is requested from this page.
(() => {
  const page = document.querySelector(".topic-page");
  if (!page || page.dataset.originalResourceGuide === "true") return;
  page.dataset.originalResourceGuide = "true";

  const list = page.querySelector("#resource-list");
  if (!list) return;

  page.querySelector(".filters-row")?.remove();
  page.querySelector("#tabs")?.remove();

  const subjectMap = {
    "social-studies": ["Social Studies", "/subjects/social-studies/"],
    "math": ["Math", "/subjects/math/"],
    "science": ["Science", "/subjects/science/"],
    "ela": ["English / Language Arts", "/subjects/ela/"],
    "fine-arts": ["Fine Arts", "/subjects/fine-arts/"]
  };
  const parts = window.location.pathname.split("/").filter(Boolean);
  const subject = subjectMap[parts[1]] || ["Subjects", "/subjects/"];

  const card = document.createElement("article");
  card.className = "card";
  const heading = document.createElement("h3");
  heading.textContent = "Original Teach Arcade Resources";
  const copy = document.createElement("p");
  copy.textContent = "This subject page now focuses on activities created for Teach Arcade. Visit the subject hub to browse original games, tools, and materials currently available.";
  const link = document.createElement("a");
  link.className = "cta";
  link.href = subject[1];
  link.textContent = "Browse " + subject[0];
  card.append(heading, copy, link);
  list.replaceChildren(card);
})();