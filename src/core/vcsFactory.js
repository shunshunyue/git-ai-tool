import GitVCS from './gitVCS.js';
import SVNVCS from './svnVCS.js';

export function createVCS(type, projectPath) {
  if (type === 'git') {
    return new GitVCS(projectPath);
  } else if (type === 'svn') {
    return new SVNVCS(projectPath);
  } else {
    throw new Error(`Unsupported version control system: ${type}`);
  }
}
