(() => {
  const search = document.getElementById('movie-search');
  const topic = document.getElementById('movie-topic');
  const count = document.getElementById('movie-count');
  const empty = document.getElementById('movie-empty');
  const films = [...document.querySelectorAll('[data-movie]')];
  if (!search || !topic || !count || !empty) return;
  const update = () => {
    let shown = 0;
    const term = search.value.trim().toLowerCase();
    films.forEach(film => {
      const matches = film.dataset.movie.includes(term) && (!topic.value || film.dataset.topics.split(' ').includes(topic.value));
      film.hidden = !matches;
      if (matches) shown++;
    });
    count.textContent = `${shown} ${shown === 1 ? 'guide' : 'guides'} available`;
    empty.hidden = shown !== 0;
  };
  search.addEventListener('input', update);
  topic.addEventListener('change', update);
  update();
})();
