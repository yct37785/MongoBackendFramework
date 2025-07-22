export const validProjectData = {
  title: 'My Project',
  desc: 'This is a sample project',
  targetCompletionDate: new Date(Date.now() + 86400000),
  defaultSprintColumns: ['To Do', 'In Progress'],
};

export const validSprintData = {
  title: 'Sprint 1',
  desc: '',
  startDate: new Date(),
  dueDate: new Date(Date.now() + 86400000),
  columns: ['Todo'],
};