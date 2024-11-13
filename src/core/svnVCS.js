import SVN from 'node-svn-ultimate';
import VCS from './vcs.js';

export default class SVNVCS extends VCS {
  constructor(projectPath) {
    super();
    this.projectPath = projectPath;
  }

  // 获取 SVN 的差异内容
  async getDiff() {
    return new Promise((resolve, reject) => {
      SVN.diff(this.projectPath, (err, diff) => {
        if (err) {
          reject(new Error('Failed to get SVN diff'));
        } else {
          resolve(diff);
        }
      });
    });
  }

  // 提交变更
  async commit(message) {
    return new Promise((resolve, reject) => {
      SVN.commit(this.projectPath, message, (err) => {
        if (err) {
          reject(new Error('SVN commit failed'));
        } else {
          resolve();
        }
      });
    });
  }

  // 获取当前 SVN 用户名
  async getUserName() {
    return new Promise((resolve, reject) => {
      SVN.info(this.projectPath, (err, info) => {
        if (err) {
          reject(new Error('Failed to get SVN username'));
        } else {
          resolve(info.author);
        }
      });
    });
  }
}
