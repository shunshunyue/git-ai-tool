import simpleGit from 'simple-git';
import VCS from './vcs.js';

export default class GitVCS extends VCS {
  constructor(projectPath) {
    super();
    this.git = simpleGit(projectPath);
  }

  async stageChanges() {
    try {
      console.log('正在将所有更改添加到暂存区...');
      await this.git.add('.');
      console.log('所有更改已成功添加到暂存区');
    } catch (error) {
      console.error('Git stage changes error:', error);
      throw error;
    }
  }
  // 获取 Git 的差异内容
  async getDiff() {
    try {
      const diff = await this.git.diff(['--cached']);
      return diff;
    } catch (error) {
      console.error('Error fetching git diff:', error);
      return null;
    }
  }

  // 提交变更
  async commit(message) {
    try {
      await this.git.commit(message);
    } catch (error) {
      console.error('Git commit failed:', error);
    }
  }

  // 获取当前 Git 用户名
  async getUserName() {
    try {
      const config = await this.git.raw(['config', 'user.name']);
      return config.trim();
    } catch (error) {
      console.error('Failed to get git username:', error);
      return null;
    }
  }
}
