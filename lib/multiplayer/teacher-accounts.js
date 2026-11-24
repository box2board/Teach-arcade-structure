import {authenticate, backend, settings} from '../teacher/backend.js';
import {readTeacherSet} from '../teacher/set-reader.js';
import {teacherBank, teacherSetId} from '../../public/teacher/set-contract.js';

export function teacherAccounts(req, res) {
  const configured = Boolean(settings());
  let authorization;
  const identity = () => authorization ??= configured ? authenticate(req, res) : Promise.resolve({});
  return {
    configured,
    async list() {
      const {token, user} = await identity();
      if (!user?.id) return {signedIn:false, sets:[]};
      const id = encodeURIComponent(user.id);
      const metadata = 'id,title,subject,question_count';
      const sources = [
        ['/rest/v1/teacher_question_sets?owner_id=eq.'+id+'&select='+metadata+'&order=id', row => row],
        ['/rest/v1/teacher_set_saves?teacher_id=eq.'+id+'&select=teacher_question_sets!inner('+metadata+')&order=set_id', row => row.teacher_question_sets]
      ];
      const lists = await Promise.all(sources.map(async ([path, getSet]) => {
        const sets = [];
        for (let offset=0; ; offset+=100) {
          const rows = await backend(path+'&limit=100&offset='+offset, {token});
          sets.push(...rows.map(getSet));
          if (rows.length<100) return sets;
        }
      }));
      const sets = lists.flat().map(set => ['teacher:'+set.id, {id:'teacher:'+set.id, title:set.title, subject:set.subject, questionCount:set.question_count}]);
      return {signedIn:true, sets:[...new Map(sets).values()]};
    },
    async bank(reference) {
      const id = typeof reference === 'string' && reference.startsWith('teacher:') ? reference.slice(8) : null;
      if (!teacherSetId(id)) return null;
      const {token, user} = await identity();
      if (!user?.id) return null;
      const set = await readTeacherSet(id, {token});
      if(!set)return null;
      try {return teacherBank(set);}
      catch (error) {throw Object.assign(error,{status:400});}
    }
  };
}
