export const tools = {
  'block-builder':['3D Block Builder','/brain-arcade/block-builder/'],
  citycanvas:['CityCanvas','/brain-arcade/citycanvas/'],
  'graphic-organizer':['Graphic Organizer Studio','/tools/graphic-organizers/kwl-chart/'],
  timeline:['Timeline Creator','/tools/timeline-creator/'],
  comic:['Comic Studio','/tools/comic-studio/'],
  flashcards:['Flashcard Studio','/tools/flashcards.html'],
  clash:['Category Clash','/review-lab/category-clash/'],
  graph:['Graphing Calculator','/tools/graphing-calculator/'],
  art:['Art Studio','/tools/art-studio/'],
  race:['3D Race Track Studio','/prototypes/race-track-studio/']
};
export const partSize = 600000;
export const partLimit = 46;
export const validId = value => typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
export const validTitle = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 120;
