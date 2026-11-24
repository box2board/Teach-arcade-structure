// Each district has the same reward mix, with different placements around its junction.
// The first six reachable spaces from every start offer 3 Tickets, 1 gift, 1 event, 1 scenic stop.
export const festivalJunctionOffsets=[0,4,8,12];
export const festivalStarts=festivalJunctionOffsets.map((offset,district)=>district*16+(offset+8)%16);
export const festivalSpacePatterns=[
 ['scenic','ticket','item','surprise','ticket','scenic','ticket','item','surprise','ticket','item','ticket','surprise','scenic','ticket','scenic'],
 ['scenic','item','surprise','ticket','scenic','ticket','ticket','item','surprise','ticket','surprise','ticket','scenic','item','ticket','scenic'],
 ['scenic','surprise','item','ticket','ticket','ticket','scenic','item','surprise','ticket','scenic','item','ticket','surprise','ticket','scenic'],
 ['scenic','ticket','surprise','scenic','ticket','item','ticket','item','surprise','item','ticket','surprise','ticket','ticket','scenic','scenic']
];
