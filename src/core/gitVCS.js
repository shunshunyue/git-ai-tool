import simpleGit from 'simple-git';
import VCS from './vcs.js';
import chalk from 'chalk';

export default class GitVCS extends VCS {
  constructor(projectPath) {
    super();
    this.git = simpleGit(projectPath);
  }

  async stageChanges() {
    try {
      console.log(chalk.green('正在将所有更改添加到暂存区...\n'));
      await this.git.add('.');
      console.log(chalk.green('所有更改已成功添加到暂存区\n'));

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
  // 获取提交记录
  async getLogs(since, until) {
    try {
      const log = await this.git.log({
        '--since': since,  // 限制时间范围
        '--until': until,
        format: {
          hash: '%h',
          date: '%ar',
          message: '%s',
          author_name: '%an',
        },
      });
      return log.all.map(commit => `${commit.hash} - ${commit.author_name}: ${commit.message} (${commit.date})`).join('\n');
    } catch (error) {
      console.error(chalk.red('Error fetching git logs:'), error);
      return null;
    }
  }
}
