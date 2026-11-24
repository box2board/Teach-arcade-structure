import {backend} from './backend.js';

export const setMetadata = 'id,owner_id,title,description,subject,topic,primary_grade,grade_band,difficulty,visibility,question_count,revision,updated_at,moderation_hidden';

export async function readTeacherSet(id, options) {
  const [set] = await backend(`/rest/v1/teacher_question_sets?id=eq.${id}&select=${setMetadata}`, options);
  return readSetQuestions(set, options);
}

export async function readSetQuestions(set, options) {
  if (!set) return set;
  const items = await backend(`/rest/v1/teacher_question_set_items?set_id=eq.${set.id}&select=position,question_version_id,source_attribution,question_content_versions!inner(question,source_key)&order=position.asc`, options);
  return {...set, questions: items.map(item => {
    const version = Array.isArray(item.question_content_versions) ? item.question_content_versions[0] : item.question_content_versions;
    return {...version.question, _versionId: item.question_version_id, _sourceKey: version.source_key, _attribution: item.source_attribution};
  })};
}
